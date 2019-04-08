const database = require('./databaseHandler');
const moment = require('moment');
const sns = require('./snsLib');
const fs = require('fs');
const sqlite = require('sqlite3').verbose();
const readline = require('readline');
const http = require('follow-redirects').https;
const workers = {};

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
   const db_url = 'https://github.com/jaredrummler/AndroidDeviceNames/raw/master/database/android-devices.db'
   const db_file = './android-devices.db'

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
                     const query = `INSERT into android_device_names VALUES ${data.map(x => `(null,'${x.name}','${x.codename}','${x.model}')`).join()}`
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
      })

      try { fs.unlinkSync(db_file) } catch { }
   })

}

workers.updateiOSDeviceNames = () => {
   let rl = readline.createInterface({
      input: fs.createReadStream('model_data'),
      crlfDelay: Infinity
   });

   let values = []

   rl.on('line', (line) => {
      let lineParts = line.split(',')
      let name = lineParts[0]
      let color = lineParts[1]

      let models = lineParts.slice(2)

      values.push(models.map(x => `(null,'${name}','${x}','${color}')`))
   })
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

   let valuesX = []

   rl.on('line', (line) => {
      let lineParts = line.split(';')
      let codename = lineParts[0]
      let name = lineParts[1]

      valuesX.push(`(null,'${name}','${codename}')`);
   })

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
}

module.exports = workers;