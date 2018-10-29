const database = require('./databaseHandler');
const snsLib = require('./snsLib');
const helpers = require('./helpers');
const messages = require('./Constants');
var handlers = {};
/**
 * Method for Invalid Path.
 * @param data: The Data Object for the REQUEST.
 * @param callback: The Method callback.
 */
handlers.notFound = function (data, callback) {
    const response = {
        'res': 'Invalid Path'
    };
    callback(true, 404, response);
};
/**
 * Method to Ping the API.
 * @param dataObject
 * @param callback
 */
handlers.ping = function (dataObject, callback) {
    callback(false, 200, {'res': 'Welcome to HyperXchange API version 1.0.'});
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
    helpers.validateToken(queryString.key, function (isValid) {
        if (isValid) {
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
            } else {
                callback(false, 400, {'res': 'Invalid Request Method.'});
            }
        } else {
            callback(false, 403, {'res': messages.tokenExpiredMessage});
        }
    });

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
    var queryString = dataObject.queryString;
    helpers.validateToken(queryString.key, function (isValid) {
        if (isValid) {
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
        } else {
            callback(false, 403, {'res': messages.tokenExpiredMessage});
        }
    });
};
/**
 * Method to either INSERT new Phones or to check for old ones.
 * @param dataObject: The request data.
 * @param callback: The method callback.
 */
handlers.phone = function (dataObject, callback) {
    var method = dataObject.method;
    var response = {};
    const key = dataObject.queryString.key;
    helpers.validateToken(key, function (isValid) {
        if (isValid) {
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
            } else {
                callback(true, 400, {'res': messages.invalidRequestMessage});
            }
        } else {
            callback(false, 403, {'res': messages.tokenExpiredMessage});
        }
    });
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
                var orderId = messages.companyPrefix + paymentMethod + productType + pincode + autoIncrVal;
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
                                'res': 'Not Present',
                                'type': 'Visitor'
                            };
                            callback(false, 200, response);
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
            'res': messages.invalidRequestMessage
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
                    var query = "UPDATE visitor_details SET first_name='" +
                        firstName + "', last_name='" + lastName + "' " +
                        "WHERE mobile_number LIKE '" + mobileNumber + "'";
                    database.query(query, function (err, data) {
                        if (err) {
                            response = {
                                'res': 'Error'
                            };
                            callback(err, 500, response);
                        } else {
                            response = {
                                'res': 'Visitor may already Exist.'
                            };
                            callback(err, 200, response);
                        }
                    });
                } else {
                    response = {
                        'res': 'New visitor added.'
                    };
                    callback(false, 200, response);
                }
            });
        } else {
            response = {
                'res': messages.insufficientData
            };
            callback(false, 400, response);
        }
    } else {
        response = {
            'res': messages.invalidRequestMessage
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
                    'res': messages.errorMessage
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
            'res': messages.invalidRequestMessage
        };
        callback(false, 400, response);
    }
};
/**
 * Method to generate a new Token.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.token = function (dataObject, callback) {
    var response = {};
    if (dataObject.method === 'get') {
        var token = helpers.getRandomKey(16);
        var apiKey = dataObject.queryString.apikey.trim();
        apiKey = typeof(apiKey) === 'string' && apiKey.length === 32 ? apiKey : false;
        var validity = Date.now() + 6000 * 60 * 60;
        if (apiKey && token) {
            response = {
                'apikey': apiKey,
                'token': token,
                'validity': validity
            };
            var values = "'" + apiKey + "','" + token + "'," + validity;
            database.insert("api_token", values, function (err, data) {
                if (err) {
                    var query = "UPDATE api_token SET token = '" + token + "', validity = '" +
                        validity + "' WHERE api_key LIKE '" + apiKey + "'";
                    database.query(query, function (err, data) {
                        if (!err) {
                            callback(false, 200, response);
                        } else {
                            callback(err, 500, {'res': messages.errorMessage});
                        }
                    });
                } else {
                    callback(false, 200, response);
                }
            });
        } else {
            callback(true, 400, {'res': 'Missing Required Fields'});
        }
    } else if (dataObject.method === 'put') {
        var extend = dataObject.postData.extend;
        extend = typeof(extend) === 'boolean' ? extend : false;
        var apikey = dataObject.postData.apikey.trim();
        apikey = typeof(apikey) === 'string' && apikey.length === 32 ? apikey : false;
        if (apikey && extend) {
            var query = "SELECT * FROM api_token WHERE api_key LIKE '" + apikey + "'";
            database.query(query, function (err, data) {
                if (err) {
                    callback(err, 404, {'res': 'Invalid Api Key'});
                } else {
                    var validity = data[0].validity;
                    console.log(validity);
                    console.log(Date.now());
                    if (validity > Date.now()) {
                        var newValidity = Date.now() + 6000 * 60 * 60;
                        query = "UPDATE api_token SET validity= " + newValidity + " " +
                            "WHERE api_key LIKE '" + apikey + "'";
                        database.query(query, function (err, updateData) {
                            if (err) {
                                callback(err, 500, {'res': 'Error'});
                            } else {
                                var response = {
                                    'apikey': apikey,
                                    'token': data[0].token,
                                    'validity': newValidity
                                };
                                callback(false, 200, response);
                            }
                        });
                    } else {
                        callback(true, 409, {'res': messages.tokenExpiredMessage});
                    }
                }
            });
        } else {
            callback(true, 400, {'res': 'Missing Required Fields'});
        }
    }
    else {
        callback(false, 400, {'res': messages.invalidRequestMessage});
    }
};
/**
 * Method to get the Distinct Models and Count.
 * @param dataObject
 * @param callback
 */
handlers.getDistinctModel = function (dataObject, callback) {
    var response = {};
    var singleObject = {};
    var phone_details = [];
    var key = dataObject.queryString.key;
    if (dataObject.method === 'get') {
        helpers.validateToken(key, function (isValid) {
            if (isValid) {
                const query = "SELECT (model_name),count(model_name) as count FROM inventory group by model_name";
                database.query(query, function (err, data) {
                    if (!err) {
                        for (var i = 0; i < data.length; i++) {
                            singleObject = {
                                'model_name': data[i].model_name.trim(),
                                'count': data[i].count
                            };
                            phone_details.push(singleObject);
                        }
                        response = {
                            'res': phone_details
                        };
                        callback(false, 200, response);
                    } else {
                        callback(err, 500, {'res': messages.errorMessage});
                    }
                });
            } else {
                callback(true, 403, {'res': messages.tokenExpiredMessage});
            }
        });
    } else {
        callback(true, 400, {'res': messages.invalidRequestMessage});
    }
};
/**
 * Method to get the All the Employee Details.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.employee = function (dataObject, callback) {
    helpers.validateToken(dataObject.queryString.key, function (isValid) {
        if (dataObject.method === 'get') {
            if (isValid) {
                var query = "SELECT * FROM employee_details";
                database.query(query, function (err, data) {
                    if (err) {
                        callback(err, 500, {'res': messages.errorMessage});
                    } else {
                        var employee = [];
                        for (var i = 0; i < data.length; i++) {
                            employee.push(data[i]);
                        }
                        var response = {
                            'res': employee
                        };
                        callback(false, 200, response);
                    }
                });
            } else {
                callback(false, 403, {'res': messages.tokenExpiredMessage});
            }
        } else {
            callback(true, 400, {'res': messages.invalidRequestMessage});
        }
    });
};
/**
 * Method to get details of phones with Vendor names.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.inventoryPhone = function (dataObject, callback) {
    var key = dataObject.queryString.key;
    helpers.validateToken(key, function (isValid) {
        if (isValid) {
            if (dataObject.method === 'post') {
                var modelName = dataObject.postData.model_name;
                var query = "SELECT i.*,v.first_name as vendor_first_name,v.last_name as vendor_last_name, p.status " +
                    "FROM inventory i,vendor_details v ,phone_grade_details p " +
                    "WHERE i.vendor_id = v.vendor_id AND model_name LIKE '" + modelName + "' AND i.product_grade=p.id";
                console.log(query);
                database.query(query, function (err, phoneData) {
                    if (err) {
                        callback(err, 500, {'res': messages.errorMessage});
                    } else {
                        var array = [];
                        for (var i = 0; i < phoneData.length; i++) {
                            array.push(phoneData[i]);
                        }
                        var response = {
                            'res': array
                        };
                        callback(false, 200, response);
                    }
                });

            } else {
                callback(true, 400, {'res': messages.invalidRequestMessage});
            }
        } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
        }
    });
};
/**
 * Method to get the Vendor Details.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.getVendor = function (dataObject, callback) {
    var key = dataObject.queryString.key;
    var method = dataObject.method;
    if (method === 'get') {
        helpers.validateToken(key, function (isValid) {
            if (isValid) {
                var vendorId = dataObject.queryString.vendorid;
                var query = "SELECT * FROM vendor_details WHERE vendor_id = " + vendorId;
                database.query(query, function (err, data) {
                    if (err) {
                        callback(err, 500, {'res': messages.errorMessage});
                    } else {
                        callback(false, 200, {'res': data[0]});
                    }
                });
            } else {
                callback(true, 403, {'res': messages.tokenExpiredMessage});
            }
        });
    } else {
        callback(true, 403, {'res': messages.invalidRequestMessage});
    }
};
/**
 * Method to put the Attendance for the Employee.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.putAttendance = function (dataObject, callback) {
    var key = dataObject.queryString.key;
    if (dataObject.method === 'post') {
        helpers.validateToken(key, function (isValid) {
            if (isValid) {
                var postData = dataObject.postData;
                var id = Number(postData.id);
                var new_status = postData.new_status;
                var location = postData.location;
                var timestamp = postData.timestamp;
                var query = "UPDATE employee_details SET current_status = '" + new_status + "' WHERE id = " + id;
                database.query(query, function (err, data) {
                    if (!err) {
                        query = "INSERT INTO attendance_record VALUES (" + id + ",'" +
                            new_status + "','" + timestamp + "','" + location + "')";
                        database.query(query, function (err, insertData) {
                            if (!err) {
                                callback(false, 200, {
                                    'res': messages.attendancePut,
                                    'current_status': new_status
                                });
                            } else {
                                callback(err, 500, {'res': messages.errorMessage});
                            }
                        });
                    } else {
                        callback(err, 500, {'res': messages.errorMessage});
                    }
                });
            } else {
                callback(true, 403, {'res': messages.tokenExpiredMessage});
            }
        });
    } else {
        callback(true, 400, {'res': messages.invalidRequestMessage});
    }
};
/**
 * Method to get the Phone details with the IMEI from the Inventory.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.inventoryImei = function (dataObject, callback) {
    var key = dataObject.queryString.key;
    if (dataObject.method === 'get') {
        helpers.validateToken(key, function (isValid) {
            if (isValid) {
                var imei = typeof(dataObject.queryString.imei) === 'string' && dataObject.queryString.key.trim().length > 10 ? dataObject.queryString.imei : false;
                if (imei) {
                    var query = "SELECT * FROM inventory WHERE product_imei_1 LIKE '" + imei + "'";
                    database.query(query, function (err, data) {
                        if (err) {
                            callback(err, 500, {'res': 'Error'});
                        } else {
                            callback(false, 200, data[0]);
                        }
                    });
                } else {
                    callback(true, 400, {'res': messages.insufficientData});
                }
            } else {
                callback(true, 403, {'res': messages.tokenExpiredMessage});
            }
        });
    } else {
        callback(true, 400, {'res': messages.invalidRequestMessage});
    }
};
/**
 * Exporting the Handlers.
 */
module.exports = handlers;