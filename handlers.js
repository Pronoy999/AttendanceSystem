const database = require('./databaseHandler');
const snsLib = require('./snsLib');
var handlers = {};
handlers.notFound = function (data, callback) {
    var response = {
        'res': 'Invalid Path'
    };
    callback(true, 404, response);
};
/**
 * Method to verify or to send OTP.
 * @param data: Object Containing the details.
 * @param callback: The Method callback.
 */
handlers.otp = function (dataObject, callback) {
    var response = {};
    var method = dataObject.method;
    var queryString = dataObject.queryString;
    var phoneNumber;
    if (method === 'get') {
        phoneNumber = queryString.phoneNumber;
        var otp = Number(queryString.otp);
        var queryStatement = "SELECT * FROM otp WHERE mobile_number LIKE '" +
            phoneNumber + "' AND otp = " + otp;
        database.select(queryStatement, function (err, data) {
            if (err) {
                console.log(err);
                response = {
                    'res': 'ERROR'
                };
                callback(err, 500, response);
            } else {
                var serverOTP = data[0].otp;
                if (serverOTP === otp) {
                    response = {
                        'res': true,
                    };
                    callback(false, 200, response);
                } else {
                    response = {
                        'res': false,
                    };
                    callback(false, 200, response);
                }
            }
        });
    } else if (method === 'post') {
        phoneNumber = dataObject.postData.phoneNumber;
        snsLib.sendOTP(phoneNumber, function (err, randomOTP) {
            if (err) {
                console.log(err);
                response = {
                    'res': 'ERROR'
                };
                callback(err, 500, response);
            } else {
                var values = phoneNumber + "," + randomOTP;
                database.insert("otp", values, function (err, data) {
                    if (err) {
                        console.log(err);
                        response = {
                            'res': 'ERROR'
                        };
                        callback(err, 500, response);
                    } else {
                        response = {
                            'res': 'OTP Send.'
                        };
                        callback(err, 200, response);
                    }
                });
            }
        });
    }
};
module.exports = handlers;