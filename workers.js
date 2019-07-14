const AWS = require("aws-sdk");
const messages = require('./Constants');
const database = require('./databaseHandler');
const moment = require('moment');
const schedule = require('node-schedule');
const sns = require('./snsLib');
const helpers = require('./helpers');
const workers = {};


/**
 * Method to escalate Video not uploaded status.
 */
workers.checkVideoUploadStatus = function () {
   schedule.scheduleJob('0 0 * * *', function () {
      const query = "Select channel_order_id as name from order_details where is_video_taken = 1  and order_status = 5" +
         " union select product_imei_1 as name from inventory where is_video_taken = 1 and service_stock = 1";

      database.query(query, async function (err, videoUpdated) {
         if (err) {
            console.log(err);
         } else {
            const fileData = await workers._ifPresent('');
            const vidNames = fileData.Contents.map(y => y.Key);
            const updateData = videoUpdated.filter(x => !vidNames.includes("hx_" + x.name + ".mp4"));
// const updateData = fileData.Contents.filter(x=> !vidNames.includes(x.Key));
            for (let i = 0; i < updateData.length; i++) {

               fileName = updateData[i].name;

               const query = "update inventory set is_video_taken = -1 where product_imei_1 = '" + fileName + "'";
               database.query(query, function (err, updatedData) {
                  if (err) {
                     console.log(err);
                  } else {
                     console.log('Inventory Updated.');
                  }
               });
               const query1 = "update order_details set is_video_taken = -1 where channel_order_id = '" + fileName + "'";
               database.query(query1, function (err, updatedData) {
                  if (err) {
                     console.log(err);
                  } else {
                     console.log('Order details Updated.');
                  }
               });
            }
         }
      })
   });
};

workers.generateStockServiceCSVforOperations = () => {
   schedule.scheduleJob('0 0 * * 5', () => {
      const generateCSV = (service_stock, filename) => new Promise((resolve, reject) => {
         const query =
            "select model_name as Model, " +
            "product_color as Color, " +
            "storage as Stroage, " +
            "product_imei_1 as IMEI, " +
            "product_price as `Procurement Price` " +
            "from inventory where service_stock = " + service_stock;

         database.query(query, (err, data) => {
            if (err) {
               reject(err);
            } else {
               const replacer = (key, value) => value === null ? '' : value;
               const header = Object.keys(data[0]);
               let csv = data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
               csv.unshift(header.join(','));
               csv = csv.join('\r\n');

               resolve({
                  filename,
                  content: csv
               });
            }
         });
      });

      Promise.all([generateCSV(2, 'STOCK.csv'),
         generateCSV(3, 'SERVICE.csv')]).then(datas => {
         // console.log(datas);
         const date = moment().tz('Asia/Kolkata').format('DD/MM/YYYY');
         /* helpers.sendEmail(`writwick.das@hyperxchange.com`,
       `STOCK and SERVICE status ${date}`,
       `Please find attached the stock and service details for ${date}`,
       datas);
       */
         helpers.sendEmail(`operations@hyperxchange.com`,
            `STOCK and SERVICE status ${date}`,
            `Please find attached the stock and service details for ${date}`,
            "", datas);
      }).catch(err => console.log(err));
   });
};

workers.generateStockServiceCSVforAccounts = () => {
   schedule.scheduleJob('0 0 * * *', () => {
      const generateCSV = (service_stock, filename) => new Promise((resolve, reject) => {
         const query = `select model_name   as Model,
   product_coloras Color,
   storage as Storage,
   count(model_name)   as Quantity,
   product_priceas 'Unit Procurement Price',
   count(model_name) * product_price as 'Total Procurement Price'
   from diagnostic_app.inventory
   where service_stock = ${service_stock}
   group by model_name, product_color, storage;`;

         database.query(query, (err, data) => {
            if (err) {
               reject(err);
            } else {
               const replacer = (key, value) => value === null ? '' : value;
               const header = Object.keys(data[0]);
               let csv = data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
               csv.unshift(header.join(','));
               csv = csv.join('\r\n');

               resolve({
                  filename,
                  content: csv
               });
            }
         });
      });

      Promise.all([generateCSV(2, 'STOCK.csv'),
         generateCSV(3, 'SERVICE.csv')]).then(datas => {
         // console.log(datas);
         const date = moment().tz('Asia/Kolkata').format('DD/MM/YYYY');
         /* helpers.sendEmail(`writwick.das@hyperxchange.com`,
       `STOCK and SERVICE status ${date}`,
       `Please find attached the stock and service details for ${date}`,
       datas);
       */
         helpers.sendEmail(`accounts@hyperxchange.com`,
            `STOCK and SERVICE status ${date}`,
            `Please find attached the stock and service details for ${date}`,
            "", datas);
      }).catch(err => console.log(err));
   });
};

workers._ifPresent = function (fileName) {
   return new Promise((resolve, reject) => {
      var s3 = new AWS.S3();

      let params = {
         Bucket: messages.bucketName, /* required */
         Prefix: 'hx_' // Can be your folder name
      };
      s3.listObjects(params, function (err, data) {
         if (err) {
            console.log(err, err.stack);
            reject(err);
         } // an error occurred
         else {
            console.log(data);
            resolve(data)
         }// successful response
      });
   });

};


/**
 * Method to escalate Order status.
 */
workers.checkOrderStatus = function () {
   setInterval(function () {
      workers._loopCheck();
   }, 12 * 60 * 60 * 1000);
};
workers._loopCheck = function () {
   console.log('in Workers');
   const query = "SELECT * FROM order_details o, " +
      "order_status_details s " +
      "WHERE s.status='Ready-to-Pack' AND o.order_status=s.id";
   database.query(query, function (err, pendingData) {
      //console.log(pendingData);
      if (err) {
         console.log(err);
      } else {
         for (let i = 0; i < pendingData.length; i++) {
            var eachOrder = pendingData[0];
            var dateTime = eachOrder.order_date + ' 10:00:00';
            var epochTime = moment(dateTime).valueOf();
//var currentTime = Math.floor((new Date().getTime()));
            var currentTime = moment.now();
            var difference = currentTime - epochTime;
            var hoursDifference = Math.floor(difference / (1000 * 60 * 60));
            var message = "Hi, order number: " + eachOrder.channel_order_id +
               " from " + eachOrder.channel_name + " is Ready to Pack for more than 12 Hours.";
            let mobileNumber = "";
            if (hoursDifference <= 13) {
               mobileNumber = "+918097611136";

            } else {
               mobileNumber = "+919831140538";
            }
            sns.sendMessage(mobileNumber, message, function (err) {
               if (err) {
                  console.log(err);
               } else {
                  console.log('Sms Send.');
               }
            });
         }
      }
   });
};

workers.updateAndroidDeviceNames = () => {
   const db_url = 'https://github.com/jaredrummler/AndroidDeviceNames/raw/master/database/android-devices.db';
   const db_file = './android-devices.db';

   var download = (url, dest, cb) => {
      var file = fs.createWriteStream(dest);
      http.get(url, (response) => {
         response.pipe(file);
         file.on('finish', () => {
            file.close(cb);
         });
      }).on('error', (err) => {
         fs.unlink(dest);
         if (cb) cb(err.message);
      });
   };

   download(db_url, db_file, () => {
      let db = new sqlite.Database(db_file, 'OPEN_READONLY');

      db.serialize(() => {
         db.all(`SELECT name,codename,model FROM devices`, (err, data) => {
            if (!err) {
               database.query('TRUNCATE android_device_names', (err, returnData) => {
                  if (err) {
                     console.error(err.stack);
                  } else {
                     const query = `INSERT into android_device_names VALUES ${data.map(x => `(null,'${x.name}','${x.codename}','${x.model}')`).join()}`;
                     database.query(query, (err, insertData) => {
                        if (err) {
                           console.error(err.stack);
                        } else {
                           console.log('Successfully updated device names');
                        }
                     })
                  }
               })
            }
         })
      });

      try {
         fs.unlinkSync(db_file)
      } catch (e) {
         console.error(e.stack);
      }
   })

};

workers.updateiOSDeviceNames = () => {
   let rl = readline.createInterface({
      input: fs.createReadStream('model_data'),
      crlfDelay: Infinity
   });

   let values = [];

   rl.on('line', (line) => {
      let lineParts = line.split(',');
      let name = lineParts[0];
      let color = lineParts[1];

      let models = lineParts.slice(2);

      values.push(models.map(x => `(null,'${name}','${x}','${color}')`))
   });
   database.query('TRUNCATE ios_device_names', (err, returnData) => {
      if (err) {
         console.error(err.stack);
      } else {
         const query = `INSERT into ios_device_names VALUES ${values.join()}`;
         database.query(query, (err, insertData) => {
            if (err) {
               console.error(err.stack);
            } else {
               console.log('Successfully updated device names');
            }
         })
      }
   });

   rl = readline.createInterface({
      input: fs.createReadStream('model_type'),
      crlfDelay: Infinity
   });

   let valuesX = [];

   rl.on('line', (line) => {
      let lineParts = line.split(';');
      let codename = lineParts[0];
      let name = lineParts[1];

      valuesX.push(`(null,'${name}','${codename}')`);
   });

   database.query('TRUNCATE ios_device_codes', (err, returnData) => {
      if (err) {
         console.error(err.stack);
      } else {
         const query = `INSERT into ios_device_codes VALUES ${valuesX.join()}`;
         database.query(query, (err, insertData) => {
            if (err) {
               console.error(err.stack);
            } else {
               console.log('Successfully updated device names');
            }
         })
      }
   });
};
/**
 * Worker to escalate the Leave status pending for HRMS.
 */
workers.leaveStatusUpdate = () => {
   schedule.scheduleJob("0 0 * * *", () => {
      const query = "select lv.user_id," +
         "usr.userfullname as self_name," +
         "usr.emailaddress as employee_email," +
         "usr.contactnumber as self_number," +
         "lv_type.leavetype," +
         "lv.from_date," +
         "lv.to_date," +
         "lv.reason," +
         "lv.rep_mang_id," +
         "usr1.userfullname as reporting_manager_name," +
         "usr1.emailaddress as manager_email," +
         "usr1.contactnumber as manager_number," +
         "lv.hr_id," +
         "usr2.userfullname as hr_name," +
         "usr2.emailaddress as hr_email," +
         "usr2.contactnumber as hr_number, " +
         "DATEDIFF" +
         "   (now()," +
         "    lv.createddate) as day " +
         "from hrms.main_leaverequest lv," +
         "hrms.main_employeeleavetypes lv_type," +
         "hrms.main_users usr," +
         "hrms.main_users usr1," +
         "hrms.main_users usr2 " +
         "where lv.leavestatus =" +
         " 'Pending for approval'" +
         "  and DATEDIFF" +
         "   (now()," +
         "    lv.createddate) > 1" +
         "  and lv.leavetypeid = lv_type.id" +
         "  and usr.id = lv.user_id" +
         "  and lv.rep_mang_id = usr1.id" +
         "  and lv.hr_id = usr2.id";
      database.query(query, (err, data) => {
         if (err) {
            console.log(err);
         } else {
            for (let i = 0; i < data.length; i++) {
               const oneData = data[i];
               const time = oneData.day;
               if (time === 1) {
                  const reportingManagerEmail = oneData.manager_email;
                  console.log(reportingManagerEmail);
                  let emailBody = messages.LEAVE_PENDING_MESSAGE;
                  const name = oneData.self_name;
                  const reportingManager = oneData.reporting_manager_name;
                  const leaveType = oneData.leavetype;
                  const fromDate = oneData.from_date;
                  const toDate = oneData.to_date;
                  const reason = oneData.reason;
                  emailBody = emailBody.replace("%m", reportingManager);
                  emailBody = emailBody.replace("%n", name);
                  emailBody = emailBody.replace("%l", leaveType);
                  emailBody = emailBody.replace("%f", fromDate);
                  emailBody = emailBody.replace("%t", toDate);
                  emailBody = emailBody.replace("%r", reason);
                  helpers.sendEmail(reportingManagerEmail, "Pending Task for Approval", emailBody).then(() => {
                     console.log("Email Send.");
                  }).catch(err => {
                     console.error(err);
                  });
               } else if (time > 1) {
                  const hrName = oneData.hr_name;
                  const hrEmail = oneData.hr_email;
                  console.log(hrEmail);
                  const reportingManagerEmail = oneData.manager_email;
                  let emailBody = messages.LEAVE_HR_PENDING;
                  const name = oneData.self_name;
                  const reportingManager = oneData.reporting_manager_name;
                  const leaveType = oneData.leavetype;
                  const fromDate = oneData.from_date;
                  const toDate = oneData.to_date;
                  const reason = oneData.reason;
                  emailBody = emailBody.replace("%m", hrName);
                  emailBody = emailBody.replace("%rm", reportingManager);
                  emailBody = emailBody.replace("%n", name);
                  emailBody = emailBody.replace("%l", leaveType);
                  emailBody = emailBody.replace("%f", fromDate);
                  emailBody = emailBody.replace("%t", toDate);
                  emailBody = emailBody.replace("%r", reason);
                  helpers.sendEmail(hrEmail, "Pending Task for Approval", emailBody,
                     "" + reportingManagerEmail).then(() => {
                     console.log("Email Send.");
                  }).catch(err => {
                     console.error(err);
                  });
               }
            }
         }
      });
   });
};
/**
 * Worker to send remainder for pending expenses.
 */
workers.expenseStatusUpdate = () => {
   schedule.scheduleJob("0 0 * * *", () => {
      const query = "select ex.createdby as user_id," +
         "usr.userfullname user_name," +
         "usr.emailaddress user_email," +
         "usr.contactnumber user_contact," +
         "ex.expense_name," +
         "ex.expense_amount," +
         "ex.manager_id manager_id," +
         "usr1.userfullname manager_name," +
         "usr1.emailaddress manager_address," +
         "usr1.contactnumber manager_contact," +
         "ex.description," +
         "DATEDIFF" +
         "    (now()," +
         "     ex.createddate) as day" +
         "" +
         " from hrms.expenses ex," +
         "     hrms.main_users usr," +
         "     hrms.main_users usr1" +
         " where status" +
         "    not in" +
         "      ('saved', 'approved', 'rejected')" +
         "  and ex.createdby = usr.id and usr1.id = ex.manager_id";
      database.query(query, (err, data) => {
         if (err) {
            console.error(err.stack);
         } else {
            for (let i = 0; i < data.length; i++) {
               const oneData = data[i];
               const userName = oneData.user_name;
               const time = oneData.day;
               const manager = oneData.manager_name;
               const expenseName = oneData.expense_name;
               const managerEmail = oneData.manager_address;
               const expenseAmount = oneData.expense_amount;
               const desc = oneData.description;
               let expenseMessage = messages.EXPENSE_PENDING_MESSAGE;
               if (time > 1) {
                  expenseMessage = expenseMessage.replace("%rm", manager);
                  expenseMessage = expenseMessage.replace("%n", userName);
                  expenseMessage = expenseMessage.replace("%l", expenseName);
                  expenseMessage = expenseMessage.replace("%f", expenseAmount);
                  expenseMessage = expenseMessage.replace("%d", desc);
                  helpers.sendEmail(managerEmail, "Pending Task For Approval", expenseMessage).then(() => {
                     console.log("Email sent.");
                  }).catch(err => {
                     console.error(err);
                  });
               }
            }
         }
      });
   });
};
/**
 * Method to send remainders for Order status.
 */
workers.orderStatusRemainder = () => {
   schedule.scheduleJob("0 */5 * * *", () => {
      const query = "select od.channel_order_id," +
         "od.channel_name," +
         "od.product_details," +
         "od.customer_name," +
         "od.shipping_address," +
         "status.status," +
         "order_status," +
         "TIME_FORMAT(timediff(now(), od.order_date), \"%H\") as day " +
         "from diagnostic_app.order_details od," +
         "     diagnostic_app.order_status_details status " +
         "where od.order_status not in (4, 8," +
         "  5, 12)" +
         "  and status.id = od.order_status";
      database.query(query, (err, data) => {
         if (err) {
            console.error(err.stack);
         } else {
            let emailMessage = messages.ORDER_STATUS_MESSAGE;
            let emailBody = "";
            let shouldSentEmail = false;
            const ccEmail = "operations@hyperxchange.com";
            const managerEmail = "shipra@hyperxchange.com";
            const managerName = "Shipra";
            for (let i = 0; i < data.length; i++) {
               const oneData = data[i];
               const orderId = oneData.channel_order_id.substring(0, oneData.channel_order_id.lastIndexOf('-')) || oneData.channel_order_id;
               const channelName = oneData.channel_name;
               const product = oneData.product_details;
               const customername = oneData.customer_name;
               const orderStatus = oneData.status;
               const time = oneData.day;
               emailBody = messages.ORDER_STATUS_MESSAGE_1;
               if (time > 2) {
                  shouldSentEmail = true;
                  emailBody = emailBody.replace("%n", orderId);
                  emailBody = emailBody.replace("%l", channelName);
                  emailBody = emailBody.replace("%f", orderStatus);
                  emailBody = emailBody.replace("%cn", customername);
                  emailBody = emailBody.replace("%p", product);
                  emailBody = emailBody.replace("%d", time);
                  emailMessage += emailBody;
               }
            }
            emailMessage += messages.ORDER_STATUS_MESSAGE_2;
            emailMessage = emailMessage.replace("%rm", managerName);
            if (shouldSentEmail) {
               helpers.sendEmail(managerEmail, "Orders Pending for Action", emailMessage, ccEmail).then(() => {
                  console.log("Order Email sent.");
               }).catch(err => {
                  console.error(err.stack);
               });
            }
         }
      });
   });
};
/**
 * Exporting the Worker module.
 */
module.exports = workers;