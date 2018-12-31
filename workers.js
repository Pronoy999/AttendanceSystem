const database = require('./databaseHandler');
const moment = require('moment');
const sns = require('./snsLib');
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
    var query = "SELECT * FROM order_details o, " +
        "order_status_details s " +
        "WHERE s.status='Ready-to-Invoice' AND o.order_status=s.id";
    database.query(query, function (err, pendingData) {
        //console.log(pendingData);
        if (err) {
            console.log(err);
        } else {
            //for (let i = 0; i < pendingData.length; i++) {
            var eachOrder = pendingData[0];
            var dateTime = eachOrder.order_date + ' 10:00:00';
            var epochTime = moment(dateTime).valueOf();
            //var currentTime = Math.floor((new Date().getTime()));
            var currentTime = moment.now();
            var difference = currentTime - epochTime;
            var hoursDifference = Math.floor(difference / (1000 * 60 * 60));
            if (hoursDifference > 12) {
                var message = "Hi, order number: " + eachOrder.channel_order_id +
                    " from " + eachOrder.channel_name + " is Ready to Invoice for more than 12 Hours.";
                sns.sendMessage("+918097611136", message, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Sms Send.');
                    }
                });
            }
            //}
        }
    });
};
module.exports = workers;