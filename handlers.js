const database = require('./databaseHandler');
const snsLib = require('./snsLib');
const helpers = require('./helpers');
const companyPrefix = 'HX';
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
        database.query(queryStatement, function (err, data) {
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
        database.query(query, function (err, data) {
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
/**
 * Method to get the Order ID.
 * @param dataObject: The object containing the REQUEST.
 * @param callback: The Method callback.
 */
handlers.orderId = function (dataObject, callback) {
    var paymentMethod, productType, pincode, autoIncrVal;
    var response = {};
    if (dataObject.method === 'post') {
        var isResponded = false;
        helpers.getPaymentMethod(dataObject.postData.payment_method, function (err, data) {
            if (err) {
                response = {
                    'res': 'Invalid Payment method selected.'
                };
                callback(err, 400, response);
            } else {
                paymentMethod = data;
                checkResponse();
            }
        });
        helpers.getProductType(dataObject.postData.product_type, function (err, data) {
            if (err) {
                response = {
                    'res': 'Invalid Product Type'
                };
                callback(err, 400, response);
            } else {
                productType = data;
                checkResponse();
            }
        });
        pincode = dataObject.postData.pincode;
        helpers.getAutoIncrementedValue(function (err, data) {
            if (err) {
                response = {
                    'res': 'Error creating order Number'
                };
                callback(err, 500, response);
            } else {
                autoIncrVal = Number(data) + 1;
                database.insert("order_incremented_value", autoIncrVal, function (err, data) {
                    if (err) {
                        response = {
                            'res': 'Error Inserting new Order ID'
                        };
                        callback(err, 500, response);
                    } else {
                        checkResponse();
                    }
                });
            }
        });

        /**
         * Method to send the Response.
         */
        function checkResponse() {
            if (!isResponded && paymentMethod && productType && pincode && autoIncrVal) {
                isResponded = true;
                var orderId = companyPrefix + paymentMethod + productType + pincode + autoIncrVal;
                response = {
                    'res': orderId
                };
                callback(false, 200, response);
            }
        }
    } else {
        response = {
            'res': 'Invalid Request'
        };
        callback(false, 400, response);
    }
};
/**
 * Method to check whether the Mobile number belongs to Employee or Visitor or NEW.
 * @param dataObject: The Request object.
 * @param callback: The Method callback.
 */
handlers.logCheck = function (dataObject, callback) {
    var response = {};
    if (dataObject.method === 'get') {
        var mobileNumber = dataObject.queryString.mobileNumber;
        var query = "SELECT * FROM employee_details " +
            "WHERE mobile_number LIKE '" + mobileNumber + "'";
        database.query(query, function (err, data) {
            if (typeof(data[0]) === 'undefined') {
                query = "SELECT * FROM visitor_details " +
                    "WHERE mobile_number LIKE '" + mobileNumber + "'";
                database.query(query, function (err, data) {
                    if (err) {
                        response = {
                            'res': 'Error'
                        };
                        callback(err, 500, response);
                    } else {
                        if (typeof(data[0]) === 'undefined') {
                            response = {
                                'res': 'Not Present'
                            };
                            callback(false, 404, response);
                        } else {
                            response = {
                                'res': data[0],
                                'type': 'Visitor'
                            };
                            callback(false, 200, response);
                        }
                    }
                });
            } else {
                response = {
                    'res': data[0],
                    'type': 'Employee'
                };
                callback(false, 200, response);
            }
        });
    } else {
        response = {
            'res': 'Invalid Request'
        };
        callback(false, 400, response);
    }
};
/**
 * Method to add the Visitor.
 * @param dataObject: The Request Object.
 * @param callback: The method callback.
 */
handlers.addVisitor = function (dataObject, callback) {
    var response = {};
    if (dataObject.method === 'post') {
        var firstName = dataObject.postData.first_name;
        var lastName = dataObject.postData.last_name;
        var mobileNumber = dataObject.postData.mobile_number;
        firstName = typeof (firstName) === 'string' ? firstName : false;
        lastName = typeof (lastName) === 'string' ? lastName : false;
        mobileNumber = typeof(mobileNumber) === 'string' && mobileNumber.length === 13 ? mobileNumber : false;
        if (firstName && lastName && mobileNumber) {
            var values = "'','" + firstName + "','" + lastName + "','" +
                mobileNumber + "'";
            database.insert("visitor_details", values, function (err, data) {
                if (err) {
                    response = {
                        'res': 'Error, Visitor may already Exist.'
                    };
                    callback(err, 409, response);
                } else {
                    response = {
                        'res': 'New visitor added.'
                    };
                    callback(false, 200, response);
                }
            });
        } else {
            response = {
                'res': 'Insufficient Data'
            };
            callback(false, 400, response);
        }
    } else {
        response = {
            'res': 'Invalid Request'
        };
        callback(false, 400, response);
    }
};
/**
 * Method to get the Visit Log.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.visitLog = function (dataObject, callback) {
    var method = dataObject.method;
    var response = {};
    var log = {};
    if (method === 'post') {
        var postData = dataObject.postData;
        var employeeID = postData.employee_id;
        var vistorID = postData.visitor_id;
        var location = postData.location;
        var timeStamp = postData.timeStamp;
        var status = postData.status;
        helpers.getStatusValue(status, function (statusID) {
            if (employeeID)
                log['employee_id'] = employeeID;
            if (vistorID)
                log['vistor_id'] = vistorID;
            if (location)
                log['location'] = location;
            if (timeStamp)
                log['timeStamp'] = timeStamp;
            if (status) {
                if (statusID > 0)
                    log['status'] = statusID;
            }
            const where = Object.keys(log).map(x => x + " = '" + log[x] + "'").join(" AND ");
            getLog(where);
        });
    } else {
        response = {
            'res': 'Invalid Request'
        };
        callback(false, 400, response);
    }

    function getLog(where) {
        var query = "SELECT * FROM visit_details WHERE " + where;
        database.query(query, function (err, data) {
            if (err) {
                response = {
                    'res': 'Error'
                };
                callback(err, 500, response);
            } else {
                response = {
                    'res': data
                };
                callback(false, 200, response);
            }
        });
    }
};
/**
 * Method to update the iPhone Model name and storage.
 * @param dataObject: The request data.
 * @param callback: The Method callback.
 */
handlers.updateIphoneModel = function (dataObject, callback) {
    var postData = dataObject.postData;
    var response = {};
    if (dataObject.method === 'post') {
        var modelName = postData.model_name;
        var newModel = postData.new_model;
        var color = postData.color;
        var storage = Number(postData.storage);
        const query = "UPDATE phone_details SET model = '" + newModel + "', storage = " + storage + ", color = '" + color + "'" +
            " WHERE model LIKE '" + modelName + "'";
        console.log(query);
        database.query(query, function (err, data) {
            if (err) {
                response = {
                    'res': 'Error'
                };
                callback(err, 409, response);
            } else {
                response = {
                    'res': 'Updated successfully.'
                };
                callback(false, 200, response);
            }
        });
    } else {
        response = {
            'res': 'Invalid Request'
        };
        callback(false, 400, response);
    }
};
/**
 * Exporting the Handlers.
 */
module.exports = handlers;