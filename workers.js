import database from 'databaseHandler';
import moment from 'moment';

const workers = {};

workers.checkOrderStatus = function () {
    var query = "SELECT * FROM order_details o, " +
        "order_status_details s " +
        "WHERE s.status='Pending' AND s.id=o.order_status";
    database.query(query, function (err, pendingData) {
        if (err) {
            console.log(err);
        } else {
            for (let i = 0; i < pendingData.length; i++) {
                var eachOrder = pendingData[i];
                var dateTime = eachOrder.order_date + ' ' + eachOrder.order_time;
                var epochTime = moment(dateTime).unix();
                var currentTime = Math.floor((new Date().getTime()) / 1000);

            }
        }
    });
};
workers._loopCheck = function () {

};
module.exports = workers;