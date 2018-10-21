const database = require('./databaseHandler');
const snsLib = require('./snsLib');
const helpers = require('./helpers');
var handlers = {};
handlers.notFound = function (data, callback) {
    const response = {
        'res': 'Invalid Path'
    };
    callback(true, 404, response);
};
/**
 * Method to verify or to send OTP.
 * @param dataObject: The Data Object containing all the details.
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
                console.log(err);
                response = {
                    'res': 'ERROR'
                };
                callback(err, 500, response);
            } else {
                var values = "'" + phoneNumber + "'," + randomOTP;
                database.insert("otp", values, function (err, data) {
                    if (err) {
                        console.log(err);
                        //Updating the Old OTP.
                        const whereClause = "mobile_number LIKE '" + phoneNumber + "'";
                        database.update("otp", "otp", randomOTP, whereClause, function (err, data) {
                            if (err) {
                                console.log(err);
                                response = {
                                    'res': 'ERROR'
                                };
                                callback(err, 500, response);
                            } else {
                                response = {
                                    'res': ' New OTP Send.'
                                };
                                callback(false, 200, response);
                            }
                        });
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
/**
 * Handler to handle the normal text.
 * @param dataObject: The Data Object.
 * @param callback: The method callback.
 */
handlers.text = function (dataObject, callback) {
    var response = {};
    var phoneNumber = dataObject.postData.phoneNumber;
    var text = dataObject.postData.text;
    var method = dataObject.method;
    if (method === 'post') {
        snsLib.sendMessage(phoneNumber, text, function (err) {
            if (err) {
                response = {
                    'res': 'Error'
                };
                callback(err, 500, response);
            } else {
                response = {
                    'res': 'Message Send'
                };
                callback(false, 200, response);
            }
        });
    } else {
        response = {
            'res': 'Invalid Request'
        };
        callback(true, 404, response);
    }
};
/**
 * Method to either INSERT new Phones or to check for old ones.
 * @param dataObject: The request data.
 * @param callback: The method callback.
 */
handlers.phone = function (dataObject, callback) {
    var method = dataObject.method;
    var response = {};
    if (method === 'get') {
        var imei = dataObject.queryString.imei;
        var query = "SELECT * FROM phone_details WHERE imei LIKE '" + imei + "'";
        database.select(query, function (err, data) {
            if (err) {
                response = {
                    'res': 'Error'
                };
                callback(err, 500, response);
            }
            else {
                if (data.length > 0) {
                    callback(false, 200, data);
                } else {
                    response = {
                        'res': 'No device found with this ID.'
                    };
                    callback(false, 404, response);
                }
            }
        });
    } else if (method === 'post') {
        var postData = dataObject.postData;
        helpers.insertNewPhone(postData, function (err, data) {
            var response = {};
            if (err) {
                response = {
                    'res': 'Error, the phone may already exists.'
                };
                callback(err, 500, response);
            } else {
                response = {
                    'res': 'Successfully Inserted new phone'
                };
                callback(false, 200, response);
            }
        });
    }
};
/**
 * Method to insert Report for devices.
 * @param dataObject: the Request object.
 * @param callback: The method callback.
 */
handlers.report = function (dataObject, callback) {
    var method = dataObject.method;
    var response = {};
    if (method === 'post') {
        helpers.insertNewReport(dataObject.postData, function (err, data) {
            if (err) {
                response = {
                    'res': 'Error'
                };
                callback(err, 500, response);
            } else {
                response = {
                    'res': 'Successfully inserted the report.'
                };
                callback(false, 200, response);
            }
        });
    } else if (method === 'get') {
        response = {
            'res': 'Invalid Request Method'
        };
        callback(true, 404, response);
    }
};
module.exports = handlers;