const AWS = require("aws-sdk");
const messages = require('./Constants');
const database = require('./databaseHandler');
const moment = require('moment');
const sns = require('./snsLib');
const helpers = require('./helpers');
const workers = {};


/**
 * Method to escalate Video not uploaded status.
 */
workers.checkVideoUploadStatus = function () {
   setInterval(function () {
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
   }, 86400 * 1000 * 2);
};

workers.generateStockServiceCSVforOperations = () => {
   setInterval(() => {
      if (moment().day('Friday').day() === moment().day()) {
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
      }
   }, 1000 * 60 * 60 * 24);
};

workers.generateStockServiceCSVforAccounts = () => {
   setInterval(() => {
      const generateCSV = (service_stock, filename) => new Promise((resolve, reject) => {
         const query = `select model_name                        as Model,
                               product_color                     as Color,
                               storage                           as Storage,
                               count(model_name)                 as Quantity,
                               product_price                     as 'Unit Procurement Price',
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
   }, 1000 * 60 * 60 * 24);
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

module.exports = workers;