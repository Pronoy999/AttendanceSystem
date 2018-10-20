const database = require('./databaseHandler');
const snsLib = require('./snsLib');
var handlers = {};
handlers.otp = function (data, callback) {
    var method = data.method;
    var phoneNumber;
    if (method === 'get') {
        phoneNumber = data.phoneNumber;
        var otp = data.userOtp;
        var queryStatement = "SELECT * FROM otp WHERE mobile_number LIKE '" +
            phoneNumber + "' AND otp = " + otp;
        database.select(queryStatement, function (err, data) {
            if (err) {
                console.log(err);
                callback(err);
            } else {
                var serverOTP = data[0].otp;
                if (serverOTP === otp) {
                    callback(false);
                } else {
                    callback(true);
                }
            }
        });
    } else if (method === 'post') {
        phoneNumber = data.phoneNumber;
        snsLib.sendOTP(phoneNumber, function (err, randomOTP) {
            if (err) {
                console.log(err);
            } else {
                var values = phoneNumber + "," + randomOTP;
                database.insert("otp", values, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                        callback(false);
                    }
                });
            }
        });
    }
};