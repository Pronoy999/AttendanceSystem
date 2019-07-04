const database = require('./databaseHandler');
const snsLib = require('./snsLib');
const helpers = require('./helpers');
const messages = require('./Constants');
const moment = require('moment');
const tz = require('moment-timezone');
const fs = require('fs');
/*const {exec} = require('child_process');
const java = require('./initJava');
const aws = require('./aws');
const fp_json_file_name = './fp_data.json';
const fp_json = require(fp_json_file_name);
const finger_names = ['left_index', 'right_index', 'left_thumb', 'right_thumb'];
const FingerprintTemplate = java.import("com.machinezoo.sourceafis.FingerprintTemplate");
const FingerprintMatcher = java.import("com.machinezoo.sourceafis.FingerprintMatcher");
const S3 = new aws.S3();*/
const handlers = {};
/**
 * Attendance for Pronoy,munish sir,kaisanba
 * @param dataObject
 * @param callback
 */
/*handlers.fuckAttendance = function (dataObject, callback) {
    const employeeID = dataObject.queryString.id > 0 ? dataObject.queryString.id : false;
    if (employeeID) {
        let query = "update employee_details set current_status = CASE " +
            "When current_status = 'signed_out' then 'signed_in'" +
            "when current_status = 'signed_in' then 'signed_out'" +
            "end where id =  " + employeeID;
        database.query(query, function (err, updateData) {
            if (err) {
                console.log(err);
                callback(err, 500, {'res': messages.errorMessage});
            } else {
                const timeDate = Math.floor((new Date().getTime()) / 1000);
                const formattedDate = (moment.unix(timeDate).tz('Asia/Kolkata')
                    .format(messages.dateFormat))
                    .split(' ');
                const date = formattedDate[0];
                const time = formattedDate[1];
                query = "INSERT INTO attendance_record VALUES(''," + employeeID + "," +
                    "(SELECT current_status FROM employee_details WHERE id=" + employeeID + ")," +
                    "'" + timeDate + "',(SELECT location FROM staging_diagnostic_app.employee_details WHERE id=" +
                    employeeID + "),'" + date + "','" + time + "')";
                console.log(query);
                database.query(query, function (err, insertData) {
                    if (err) {
                        console.log(err);
                        callback(err, 500, {'res': messages.errorMessage});
                    } else {
                        callback(false, 200, {'res': true});
                        notifyEmployeeAttendance(employeeID);
                    }
                });
            }
        });
    } else {
        callback(true, 400, {'res': messages.insufficientData});
    }
};*/
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
   let response = {};
   const method = dataObject.method;
   const queryString = dataObject.queryString;
   let phoneNumber;
   helpers.validateToken(queryString.key, function (isValid) {
      if (isValid) {
         if (method === 'get') {
            phoneNumber = queryString.phoneNumber;
            let otp;
            try {
               otp = Number(queryString.otp);
            } catch (e) {
               console.log(e);
               otp = 0;
            }
            const queryStatement = "SELECT * FROM otp WHERE mobile_number LIKE '" +
               phoneNumber + "' AND otp = " + otp;
            database.query(queryStatement, function (err, data) {
               if (err) {
                  console.log(err);
                  response = {
                     'res': 'ERROR'
                  };
                  callback(err, 500, response);
               } else {
                  if (data.length > 0) {
                     const serverOTP = data[0].otp;
                     if (serverOTP === otp) {
                        response = {
                           'res': true,
                           'data': data[0].random_data
                        };
                        callback(false, 200, response);
                     } else {
                        response = {
                           'res': false,
                        };
                        callback(false, 200, response);
                     }
                     //deleteOTP(otp);
                  } else {
                     callback(false, 400, {'res': false});
                  }
               }
            });
         } else if (method === 'post') {
            phoneNumber = dataObject.postData.phoneNumber;
            let randomData;
            try {
               randomData = dataObject.postData.randomData;
            } catch (e) {
               randomData = '';
            }
            snsLib.sendOTP(phoneNumber, function (err, randomOTP) {
               if (err) {
                  console.log(err);
                  response = {
                     'res': 'ERROR'
                  };
                  callback(err, 500, response);
               } else {
                  const values = "'" + phoneNumber + "'," + randomOTP + ",'" + randomData + "'";
                  database.insert("otp", values, function (err, data) {
                     if (err) {
                        //console.log(err);
                        //Updating the Old OTP.
                        const whereClause = "mobile_number LIKE '" + phoneNumber + "'";
                        database.update("otp", "otp", randomOTP,
                           whereClause, function (err, data) {
                              if (err) {
                                 console.log(err);
                                 response = {
                                    'res': 'ERROR'
                                 };
                                 callback(err, 500, response);
                              } else {
                                 response = {
                                    'res': 'New OTP Send.'
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
         } else if (dataObject.method === 'options') {
            callback(true, 200, {});//Accepting Options.
         } else {
            callback(false, 400, {'res': 'Invalid Request Method.'});
         }
      } else {
         callback(false, 403, {'res': messages.tokenExpiredMessage});
      }
   });

   /**
    * This is the method to get the otp once it has been verified.
    * @param otp: The otp that has been checked once.
    */
   function deleteOTP(otp) {
      const query = "DELETE FROM otp WHERE otp = " + otp;
      database.query(query, function (err) {
         if (err) {
            console.log(err);
         } else {
            console.log(otp + " deleted");
         }
      });
   }
};
/**
 * Handler to handle the normal text.
 * This is the method to send the normal text with one or multiple numbers separated by commas.
 * It tries to send the texts if any one fails it returns the 'overall' as false.
 * Even if one is successful it will send 'Message send'.
 * @param dataObject: The Data Object.
 * @param callback: The method callback.
 */
handlers.text = function (dataObject, callback) {
   let response = {};
   const phoneNumber = dataObject.postData.phoneNumber;
   let array = phoneNumber.split(',');
   let text = dataObject.postData.text;
   const method = dataObject.method;
   const queryString = dataObject.queryString;
   let counter = 0, overallStatus = true;

   /**
    * Method to send the Text.
    * @param number: The Phone number starting with +91.
    * @param msg: The Text message to be send.
    */
   function sendText(number, msg) {
      snsLib.sendMessage(number, msg, function (err) {
         if (err) {
            console.log(err);
            sendResponse(false);
            counter++;
         } else {
            sendResponse(true);
            counter++;
         }
      });
   }

   helpers.validateToken(queryString.key, function (isValid) {
      if (isValid) {
         if (method === 'post') {
            for (let i = 0; i < array.length; i++) {
               sendText(array[i], text);
            }
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

   /**
    * Method to send the Response back to the caller.
    * @param status: true if successfully send, else false.
    */
   function sendResponse(status) {
      if (!status) overallStatus = false;
      if (counter === array.length - 1) {
         callback(false, 200, {'res': 'Message Send', 'overall': overallStatus});
      }
   }
};
/**
 * Method to either INSERT new Phones or to check for old ones.
 * @param dataObject: The request data.
 * @param callback: The method callback.
 */
handlers.phone = function (dataObject, callback) {
   const method = dataObject.method;
   let response = {};
   const key = dataObject.queryString.key;
   helpers.validateToken(key, function (isValid) {
      if (isValid) {
         if (method === 'get') {
            const imei = dataObject.queryString.imei;
            const query = "SELECT * FROM phone_details WHERE imei LIKE '" + imei + "'";
            database.query(query, function (err, data) {
               if (err) {
                  response = {
                     'res': messages.errorMessage
                  };
                  callback(err, 500, response);
               } else {
                  if (data.length > 0) {
                     callback(false, 200, {res: true});
                  } else {
                     response = {
                        'res': false
                     };
                     callback(false, 202, response);
                  }
               }
            });
         } else if (method === 'post') {
            const postData = dataObject.postData;
            helpers.insertNewPhone(postData, function (err, data) {
               let response = {};
               if (err) {
                  callback(err, 202, {
                     'res': false,
                     'message': 'The Phone may already Exists.'
                  });
               } else {
                  response = {
                     'res': true,
                     'message': 'Successfully Inserted new phone'
                  };
                  callback(false, 200, response);
               }
            });
         } else if (method === 'put') {
            try {
               console.log(dataObject.postData);
               const imei = typeof (dataObject.postData.imei) === 'string' &&
               dataObject.postData.imei.length > 10 ? dataObject.postData.imei : false;
               const status = typeof (dataObject.postData.status) === 'string' &&
               dataObject.postData.status.length > 1 ? dataObject.postData.status : false;
               const isServiceReturn = typeof (dataObject.postData.service_return) === 'boolean' ?
                  dataObject.postData.service_return : false;


               if (imei && status) {
                  const query = "UPDATE phone_details p, service_stock_sold_details s" +
                     " SET p.status=s.id " +
                     "WHERE p.imei LIKE '" + imei + "' AND s.sold_stock_service LIKE '" + status + "'";
                  console.log(query);
                  database.query(query, function (err, updateData) {
                     if (err) {
                        console.error(err.stack);
                        callback(err, 500, {'res': messages.errorMessage});
                     } else {
                        callback(false, 200, {'res': true});
                        //updateQRTable(imei);
                        //deleteInventory(imei);
                        if (isServiceReturn) {
                           helpers.addServiceCost(dataObject);
                        }
                     }
                  });

               } else {
                  console.log("IMEI: ", imei);
                  console.log('STATUS: ', status);
                  callback(true, 400, {'res': messages.insufficientData});
               }
            } catch (e) {
               console.error(e.stack);
            }
         } else {
            callback(true, 400, {'res': messages.invalidRequestMessage});
         }
      } else {
         callback(false, 403, {'res': messages.tokenExpiredMessage});
      }
   });

   /**
    * Method to update the QR Table.
    * @param imei: The imei of the device.
    */
   function updateQRTable(imei) {
      const query = "UPDATE phone_details_qr SET phone_status = 5 WHERE imei LIKE '" + imei + "'";
      database.query(query, function (err, updateData) {
         if (err) {
            console.error(err.stack);
         } else {
            console.log("QR Updated.");
         }
      })
   }

   /**
    * Method to delete from the inventory.
    * @param imei: The IMEI of the device.
    */
   function deleteInventory(imei) {
      const query = "DELETE FROM inventory WHERE product_imei_1 LIKE '" + imei + "'";
      database.query(query, function (err, deleteData) {
         if (err) {
            console.error(err.stack);
         } else {
            console.log("Deleted from Inventory.");
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
   //const method = dataObject.method;
   let response = {};

   if (dataObject.method === 'get') {
      const query = "SELECT product_imei_1 as imei , model_name as model FROM inventory WHERE is_video_taken = -1 union " +
         "select channel_order_id as imei , product_details as model from order_details where is_video_taken = -1";
      database.query(query, function (err, data) {
         if (err) {
            response = {
               'res': messages.errorMessage
            };
            callback(err, 500, response);
         } else {
            callback(false, 200, {'res': data});

         }
      });
   } else if (dataObject.method === 'post') {
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
   } else if (dataObject.method === 'put') {
      helpers.updatePhoneReport(dataObject.postData, function (err) {
         if (err) {
            callback(err, 500, {'res': messages.errorMessage});
         } else {
            callback(false, 200, {'res': true});
         }
      });
   } else {
      callback(true, 400, {'res': dataObject.method});
   }
};
/**
 * Method to get the Order ID.
 * @param dataObject: The object containing the REQUEST.
 * @param callback: The Method callback.
 */
handlers.orderId = function (dataObject, callback) {
   let paymentMethod, productType, pincode, autoIncrVal;
   let response = {};
   if (dataObject.method === 'post') {
      let isResponded = false;
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
            const orderId = messages.companyPrefix + paymentMethod + productType + pincode + autoIncrVal;
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
   let response = {};
   if (dataObject.method === 'get') {
      const mobileNumber = dataObject.queryString.mobileNumber;
      let query = "SELECT * FROM employee_details " +
         "WHERE mobile_number LIKE '" + mobileNumber + "' AND current_status NOT LIKE 'inactive'";
      database.query(query, function (err, data) {
         if (typeof (data[0]) === 'undefined') {
            query = "SELECT * FROM visitor_details " +
               "WHERE mobile_number LIKE '" + mobileNumber + "'";
            database.query(query, function (err, data) {
               if (err) {
                  response = {
                     'res': 'Error'
                  };
                  callback(err, 500, response);
               } else {
                  if (typeof (data[0]) === 'undefined') {
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
   let response = {};
   if (dataObject.method === 'post') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            let firstName = dataObject.postData.first_name;
            let lastName = dataObject.postData.last_name;
            let mobileNumber = dataObject.postData.mobile_number;
            const isParking = dataObject.postData.is_parking;
            firstName = typeof (firstName) === 'string' ? firstName : false;
            lastName = typeof (lastName) === 'string' ? lastName : false;
            const company = typeof (dataObject.postData.company) === 'string' ? dataObject.postData.company : false;
            mobileNumber = typeof (mobileNumber) === 'string' && mobileNumber.length === 13 ? mobileNumber : false;
            const emailAddress = typeof (dataObject.postData.email_address) === 'string' &&
            helpers.validateEmail(dataObject.postData.email_address) ? dataObject.postData.email_address : false;
            if (firstName && lastName && mobileNumber) {
               const values = "'','" + firstName + "','" + lastName + "','" +
                  mobileNumber + "'," + emailAddress + "'," + company + "'," + isParking;
               database.insert("visitor_details", values, function (err, data) {
                  if (err) {
                     const query = "UPDATE visitor_details SET first_name='" +
                        firstName + "', last_name='" + lastName + "', email_address='" + emailAddress + "', company='" + company + "', is_parking= " + isParking +
                        " WHERE mobile_number LIKE '" + mobileNumber + "'";
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
               callback(true, 403, {'res': messages.tokenExpiredMessage});
            }
         } else {
            response = {
               'res': messages.insufficientData
            };
            callback(false, 400, response);
         }
      });

   } else if (dataObject.method === 'get') {

   } else {
      response = {
         'res': messages.invalidRequestMessage
      };
      callback(false, 400, response);
   }
}
;
/**
 * Method to get the Visit Log.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.visitLog = function (dataObject, callback) {
   const method = dataObject.method;
   let response = {};
   const log = {};
   if (method === 'post') {
      const postData = dataObject.postData;
      const employeeID = postData.employee_id;
      const vistorID = postData.visitor_id;
      const location = postData.location;
      const timeStamp = postData.timeStamp;
      const status = postData.status;
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
   } else if (dataObject.method === 'get') {
      let employeeID = dataObject.queryString.id > -1 ? dataObject.queryString.id : false;
      if (employeeID) {
         employeeID = Number(employeeID);
      }
      if (employeeID > 0) {
         helpers.validateToken(dataObject.queryString.key, function (isValid) {
            if (isValid) {
               const query = "SELECT v.first_name as v_fName, v.last_name as v_lName, v.mobile_number as v_mobile_number" +
                  ", v.company as v_company, v.email_address as v_email_address," +
                  "v.is_parking, vi.time_stamp ,vi.status,vi.purpose, e.* FROM visitor_details v , " +
                  "employee_details e, visit_details vi, visit_status_details s " +
                  "WHERE vi.employee_id=8 AND s.id=vi.status AND v.id in" +
                  " (SELECT visitor_id FROM visit_details WHERE employee_id=" + employeeID + ") AND " +
                  "e.id in (SELECT id FROM staging_diagnostic_app.employee_details WHERE id=" + employeeID + ")";
               database.query(query, function (err, visitData) {
                  if (err) {
                     console.log(err);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': visitData});
                  }
               });
            } else {
               callback(true, 403, {'res': messages.tokenExpiredMessage});
            }
         });
      } else if (employeeID === 0) {
         helpers.validateToken(dataObject.queryString.key, function (isValid) {
            if (isValid) {
               const query = "SELECT v.first_name as v_fName, v.last_name as v_lName, v.mobile_number as v_mobile_number" +
                  ", v.company as v_company, v.email_address as v_email_address," +
                  ",v.is_parking, vi.time_stamp ,vi.status,vi.purpose, e.* FROM " +
                  "visitor_details v , employee_details e," +
                  " visit_details vi, visit_status_details s WHERE  s.id=vi.status AND" +
                  " v.id in (SELECT visitor_id FROM visit_details) AND " +
                  "e.id in (SELECT id FROM employee_details WHERE id=vi.employee_id) ";
               database.query(query, function (err, visitData) {
                  if (err) {
                     console.log(err);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': visitData});
                  }
               });
            } else {
               callback(true, 403, {'res': messages.tokenExpiredMessage});
            }
         });
      } else {
         console.log(employeeID);
         callback(true, 400, {'res': messages.insufficientData});
      }
   } else {
      response = {
         'res': messages.invalidRequestMessage
      };
      callback(false, 400, response);
   }

   function getLog(where) {
      const query = "SELECT * FROM visit_details WHERE " + where;
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
   const postData = dataObject.postData;
   let response = {};
   if (dataObject.method === 'post') {
      const modelName = postData.model_name;
      const newModel = postData.new_model;
      const color = postData.color;
      const storage = Number(postData.storage);
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
 * Method to generate a new Token or update the validity of an existing token with PUT REQUEST.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.token = function (dataObject, callback) {
   let response = {};
   if (dataObject.method === 'get') {
      const token = helpers.getRandomKey(16);
      let apiKey = dataObject.queryString.apikey.trim();
      apiKey = typeof (apiKey) === 'string' && apiKey.length === 32 ? apiKey : false;
      var validity = Date.now() + 6000 * 60 * 60;
      if (apiKey && token) {
         response = {
            'apikey': apiKey,
            'token': token,
            'validity': validity
         };
         const values = "'" + apiKey + "','" + token + "'," + validity;
         database.insert("api_token", values, function (err, data) {
            if (err) {
               const query = "UPDATE api_token SET token = '" + token + "', validity = '" +
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
      let extend = dataObject.postData.extend;
      extend = typeof (extend) === 'boolean' ? extend : false;
      let apikey = dataObject.postData.apikey.trim();
      apikey = typeof (apikey) === 'string' && apikey.length === 32 ? apikey : false;
      if (apikey && extend) {
         var query = "SELECT * FROM api_token WHERE api_key LIKE '" + apikey + "'";
         database.query(query, function (err, data) {
            if (err) {
               callback(err, 404, {'res': 'Invalid Api Key'});
            } else {
               const validity = data[0].validity;
               console.log(validity);
               console.log(Date.now());
               if (validity > Date.now()) {
                  const newValidity = Date.now() + 6000 * 60 * 60;
                  query = "UPDATE api_token SET validity= " + newValidity + " " +
                     "WHERE api_key LIKE '" + apikey + "'";
                  database.query(query, function (err, updateData) {
                     if (err) {
                        callback(err, 500, {'res': 'Error'});
                     } else {
                        const response = {
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
   } else {
      callback(false, 400, {'res': messages.invalidRequestMessage});
   }
};
/**
 * Method to get the Distinct Models and Count for all the phones present in the inventory.
 * POST method to get the details of a Phone with respect to IMEI.
 * POST Method {imei:""} To get the details of the device with IMEI.
 * PUT to update the status of a device in Inventory.
 * @param dataObject
 * @param callback
 */
handlers.inventoryData = function (dataObject, callback) {
   let response = {};
   let inventory, phone, report, service, order, qr;
   let singleObject = {};
   let isPhone, isReport, isInventory, isService, isOrder, isQr;
   let isReponded = false;
   const phone_details = [];
   const key = dataObject.queryString.key;

   if (dataObject.method === 'get') {
      helpers.validateToken(key, function (isValid) {
         if (isValid) {
            const query = "SELECT (model_name),count(model_name) as count " +
               "FROM inventory WHERE service_stock=2 group by model_name";
            database.query(query, function (err, data) {
               if (!err) {
                  for (let i = 0; i < data.length; i++) {
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
   } else if (dataObject.method === 'post') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            let imei = "", flag = "";
            try {
               imei = typeof (dataObject.postData.imei) === 'string'
               && dataObject.postData.imei.length > 0 ? dataObject.postData.imei : false;
               flag = typeof (dataObject.postData.flag) === 'string' &&
               dataObject.postData.flag.length > 1 ? dataObject.postData.flag : false;
            } catch (e) {
               console.log(e);
            }
            if (!flag) {
               const query = "SELECT * FROM inventory WHERE product_imei_1 LIKE '" + imei + "'";
               database.query(query, function (err, selectData) {
                  if (err) {
                     console.log(err);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': selectData});
                  }
               });
            } else if (flag === 'all') {
               //console.log("ALL FLAG.");
               let query = "SELECT * FROM phone_details WHERE imei LIKE '" + imei + "'";
               database.query(query, function (err, phoneData) {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     isPhone = true;
                     phone = phoneData;
                     sendResponse();
                  }
               });
               query = "SELECT * FROM report_details WHERE imei LIKE '" + imei + "'";
               database.query(query, function (err, reportData) {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     isReport = true;
                     report = reportData;
                     sendResponse();
                  }
               });
               query = "SELECT * FROM inventory WHERE product_imei_1 LIKE '" + imei + "'";
               database.query(query, function (err, inventoryData) {
                  if (err) {
                     console.error(err.stack);
                  } else {
                     isInventory = true;
                     inventory = inventoryData;
                     sendResponse();
                  }
               });
               query = "SELECT * FROM service_center_cost WHERE imei LIKE '" + imei + "'";
               database.query(query, function (err, serviceData) {
                  if (err) {
                     isService = false;
                     console.error(err.stack);
                     isReponded = true;
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     isService = true;
                     service = serviceData;
                     sendResponse();
                  }
               });
               query = "SELECT * FROM order_details WHERE imei_number LIKE '" + imei + "'";
               database.query(query, (err, orderData) => {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     isOrder = true;
                     order = orderData;
                     sendResponse();
                  }
               });
               query = "SELECT * FROM phone_details_qr WHERE imei LIKE '" + imei + "'";
               database.query(query, (err, qrData) => {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     isQr = true;
                     qr = qrData;
                     sendResponse();
                  }
               })
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   } else if (dataObject.method === 'put') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            let imei = false, status = false, orderId = false, query = "";
            try {
               imei = typeof (dataObject.queryString.imei) === 'string' &&
               dataObject.queryString.imei.length > 0 ? dataObject.queryString.imei : false;
               status = typeof (dataObject.queryString.status) === 'string' &&
               dataObject.queryString.status.length > 0 ? dataObject.queryString.status : false;
               orderId = typeof (dataObject.queryString.orderid) === 'string' &&
                  dataObject.queryString.orderid;
               false;
            } catch (e) {
               console.log(e);
            }
            console.log(imei, status);

            if (imei && status && orderId) {
               updateInventory(imei, "Queued");
            } else if (imei && status && !orderId) {
               updateInventory(imei, status);
            } else {
               callback(true, 404, {'res': messages.insufficientData});
            }
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   } else {
      callback(true, 400, {'res': messages.invalidRequestMessage});
   }

   /**
    * Method to send the response once executed.
    */
   function sendResponse() {
      if (!isReponded && isPhone && isReport && isInventory && isService && isOrder && isQr) {
         isReponded = true;
         response = {
            phone,
            report,
            inventory,
            service,
            order,
            qr
         };
         callback(false, 200, {'res': response});
      }
   }

   function updateInventory(imei, status) {
      const query = "UPDATE inventory i, service_stock_sold_details s " +
         "SET i.service_stock=s.id WHERE i.product_imei_1 LIKE '" + imei +
         "' AND s.sold_stock_service LIKE '" + status + "'";
      database.query(query, function (err, updateData) {
         if (err) {
            console.log(err);
            callback(err, 500, {'res': messages.errorMessage});
         } else {
            callback(false, 200, {'res': true});
         }
      });
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
            const id = typeof (dataObject.queryString.id) === 'string' &&
            dataObject.queryString.id.length > 0 ? dataObject.queryString.id : false;
            let query;
            if (id) {
               query = "SELECT * FROM employee_details WHERE id = " + id;
            } else {
               query = "SELECT * FROM employee_details";
            }
            database.query(query, function (err, data) {
               if (err) {
                  callback(err, 500, {'res': messages.errorMessage});
               } else {
                  const employee = [];
                  for (let i = 0; i < data.length; i++) {
                     employee.push(data[i]);
                  }
                  const response = {
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
 * Method to get details of phones with Vendor names for a particular model name.
 * It is also used to get the details of the Dead phones by model name.
 * It is used to Update the Service Center Data for an existing phone by model name.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.inventoryPhone = function (dataObject, callback) {
   const key = dataObject.queryString.key;
   helpers.validateToken(key, function (isValid) {
      if (isValid) {
         if (dataObject.method === 'post') {
            const modelName = dataObject.postData.model_name;
            const flag = typeof (dataObject.postData.flag) === 'string' ? dataObject.postData.flag : false;
            let query;
            if (flag === 'dead') {
               query = "SELECT d.*, s.service_center FROM dead_phone d, service_center_details s" +
                  " WHERE model_name LIKE '" + modelName + "' AND d.service_center = s.id";
            } else if (flag === 'repair') {
               query = "SELECT i.*, s.service_center FROM inventory i,service_center_details s WHERE " +
                  "i.model_name LIKE '" + modelName + "' AND i.service_stock = 3 AND s.id=i.service_center";
               database.query(query, function (err, repairData) {
                  if (err) {
                     console.log(err);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': repairData});
                  }
               });
            } else if (flag === 'lost') {
               query = "SELECT * FROM inventory WHERE model_name LIKE '" + modelName + "' AND service_stock = 6";
               console.log(query);
            } else if (flag === 'procurement') {

               const productType = typeof (dataObject.postData.product_type) === "string" &&
               dataObject.postData.product_type.length > 0 ? dataObject.postData.product_type : false;

               const productOs = typeof (dataObject.postData.os) === "string" &&
               dataObject.postData.os.length > 0 ? dataObject.postData.os : false;

               const productBrand = typeof (dataObject.postData.brand) === "string" &&
               dataObject.postData.brand.length > 0 ? dataObject.postData.brand : false;

               const modelName = typeof (dataObject.postData.model_name) === "string" &&
               dataObject.postData.model_name.length > 0 ? dataObject.postData.model_name : false;

               const modelStorage = typeof (dataObject.postData.storage) === "string" &&
               dataObject.postData.storage.length > 0 ? dataObject.postData.storage : false;

               const procurementPrice = typeof (dataObject.postData.procurement_price) === "string" &&
               dataObject.postData.procurement_price.length > 0 ? dataObject.postData.procurement_price : false;

               const vendorId = typeof (dataObject.postData.vendor_id) === "string" &&
               dataObject.postData.vendor_id.length > 0 ? dataObject.postData.vendor_id : false;

               query = "SELECT * FROM procurement_price_master WHERE brand LIKE '" + productBrand + "' AND " +
                  " model_name LIKE '" + modelName + "' AND storage = " + modelStorage;
               database.query(query, (err, procurementPriceDetails) => {
                  if (err) {
                     console.log(err);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     if (procurementPriceDetails.length > 0 && procurementPriceDetails[0].is_active === 1) {
                        const id = procurementPriceDetails[0].id;
                        query = "UPDATE procurement_price_master SET is_active=0 WHERE id=" + id;
                        database.query(query, (err, updateData) => {
                           if (err) {
                              callback(err, 500, {'res': messages.errorMessage});
                           } else {
                              insertData(productType, productOs, productBrand, modelName, modelStorage, procurementPrice,
                                 vendorId, (err, result) => {
                                    if (err) {
                                       callback(err, 500, {'res': messages.errorMessage});
                                    } else {
                                       callback(false, 200, {'res': true});
                                    }
                                 });
                           }
                        });
                     } else {
                        insertData(productType, productOs, productBrand, modelName, modelStorage, procurementPrice,
                           vendorId, (err, result) => {
                              if (err) {
                                 callback(err, 500, {'res': messages.errorMessage});
                              } else {
                                 callback(false, 200, {'res': true});
                              }
                           });
                     }
                  }
               });
               return;

            } else {
               query = "SELECT i.*,v.first_name as vendor_first_name,v.last_name as vendor_last_name, p.status " +
                  "FROM inventory i,vendor_details v ,phone_grade_details p " +
                  "WHERE i.vendor_id = v.vendor_id AND model_name LIKE '" + modelName + "' AND i.product_grade=p.id AND i.service_stock=2";
               console.log(query);
            }
            database.query(query, function (err, phoneData) {
               if (err) {
                  callback(err, 500, {'res': messages.errorMessage});
               } else {
                  const array = [];
                  for (let i = 0; i < phoneData.length; i++) {
                     array.push(phoneData[i]);
                  }
                  const response = {
                     'res': array
                  };
                  callback(false, 200, response);
               }
            });

         } else if (dataObject.method === 'put') {
            const imei = typeof (dataObject.postData.imei) === 'string' &&
            dataObject.postData.imei.length > 0 ? dataObject.postData.imei : false;
            const serviceCenter = dataObject.postData.service_center > 0 ? dataObject.postData.service_center : false;
            if (imei && serviceCenter) {
               const query = "UPDATE inventory SET service_center = " + serviceCenter + " WHERE product_imei_1 LIKE '" + imei + "'";
               database.query(query, function (err, updateData) {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': true});
                  }
               });
            }
         } else if (dataObject.method === 'get') {
            const query = "select product_type, os, brand, model_name, storage, procurement_price from" +
               " procurement_price_master where is_active = 1 order by product_type, os, brand, model_name, storage";
            database.query(query, (err, priceData) => {
               if (err) {
                  console.error(err.stack);
                  callback(err, 500, {'res': messages.errorMessage});
               } else {
                  callback(false, 200, {'res': priceData});
               }
            });
         } else {
            callback(true, 400, {'res': messages.invalidRequestMessage});
         }
      } else {
         callback(true, 403, {'res': messages.tokenExpiredMessage});
      }
   });

   /**
    * Method to insert the data to the Price master table.
    * @param type: The model type.
    * @param os: The OS.
    * @param brand: The brand.
    * @param model: The model.
    * @param storage: The storage.
    * @param price:  The price.
    * @param vendorId: The vendor id.
    * @param callback
    */
   function insertData(type, os, brand, model, storage, price, vendorId, callback) {
      const query = "INSERT INTO diagnostic_app.procurement_price_master (product_type, os, brand, " +
         "model_name, storage, procurement_price, vendor_id, is_active) VALUES ('" + type + "','" + os + "','" + brand + "','" + model
         + "','" + storage + "','" + price + "','" + vendorId + "',1)";
      database.query(query, (err, result) => {
         if (err) {
            callback(err, false);
         } else {
            callback(false, true);
         }
      });
   }
};
/**
 * Method to insert or update the Dead phones or Lost or Dispute phones.
 * It is also used get the list of dead phones with GET method.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.inventoryDead = function (dataObject, callback) {
   if (dataObject.method === 'post') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            let imei = helpers.getRandomImei(16);
            const brand = typeof (dataObject.postData.brand) === 'string' &&
            dataObject.postData.brand.length > 0 ? dataObject.postData.brand : false;
            const model = typeof (dataObject.postData.model) === 'string' &&
            dataObject.postData.model.length > 0 ? dataObject.postData.model : false;
            const serviceCenter = dataObject.postData.service_center.length > 0 ? dataObject.postData.service_center : false;
            const remarks = typeof (dataObject.postData.remarks) === 'string' &&
            dataObject.postData.remarks.length > 0 ? dataObject.postData.remarks : false;
            if (brand && model && serviceCenter && remarks) {
               const query = "INSERT INTO dead_phone VALUES('','" + imei + "','" + brand + "','"
                  + model + "','" + serviceCenter + "','" + remarks + "')";
               database.query(query, function (err, insertData) {
                  if (err) {
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': imei});
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   } else if (dataObject.method === 'get') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            const query = "SELECT model_name, count(model_name) as count FROM dead_phone group by model_name union " +
               "select  model_name";
            database.query(query, function (err, deadData) {
               if (err) {
                  callback(err, 500, {'res': messages.errorMessage});
               } else {
                  callback(false, 200, {'res': deadData});
               }
            });
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   } else if (dataObject.method === 'put') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            const imei = typeof (dataObject.postData.imei) === 'string' &&
            dataObject.postData.imei.length > 10 ? dataObject.postData.imei : false;
            const remarks = typeof (dataObject.postData.remarks) === 'string' &&
            dataObject.postData.remarks.length > 0 ? dataObject.postData.remarks : false;
            if (imei && dataObject) {
               const query = "UPDATE inventory i, service_stock_sold_details s" +
                  " SET i.service_stock =s.id , i.remarks= '" + remarks + "'" +
                  " WHERE s.sold_stock_service='Lost-dispute' AND i.product_imei_1 LIKE '" + imei + "'";
               database.query(query, function (err, updateData) {
                  if (err) {
                     console.log(err);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': true});
                  }
               });
            }
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   }
};
/**
 * Method to get the Vendor Details.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.getVendor = function (dataObject, callback) {
   const key = dataObject.queryString.key;
   const method = dataObject.method;
   if (method === 'post') {
      helpers.validateToken(key, function (isValid) {
         if (isValid) {
            let vendorId = Number(dataObject.postData.vendor_id);
            vendorId = typeof (vendorId) === 'number' ? vendorId : false;
            if (vendorId) {
               const query = "SELECT * FROM vendor_details WHERE vendor_id = " + vendorId;
               database.query(query, function (err, data) {
                  if (err) {
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, data[0]);
                  }
               });
            } else {
               const firstName = typeof (dataObject.postData.first_name) === 'string' ? dataObject.postData.first_name : false;
               const lastName = typeof (dataObject.postData.last_name) === 'string' ? dataObject.postData.last_name : false;
               const phone = typeof (dataObject.postData.vendor_phone_number) === 'string' ? dataObject.postData.vendor_phone_number : false;
               const address = typeof (dataObject.postData.vendor_address) === 'string' ? dataObject.postData.vendor_address : false;
               const panNumber = typeof (dataObject.postData.vendor_pan_number) === 'string' ? dataObject.postData.vendor_pan_number : false;
               const email = typeof (dataObject.postData.vendor_email) === 'string' ? dataObject.postData.vendor_email : false;
               const gstNumber = typeof (dataObject.postData.gst_number) === 'string' ? dataObject.postData.gst_number : false;
               const bankName = typeof (dataObject.postData.bank_name) === 'string' ? dataObject.postData.bank_name : false;
               const branchName = typeof (dataObject.postData.branch_name) === 'string' ? dataObject.postData.branch_name : false;
               const ifscCode = typeof (dataObject.postData.ifsc_code) === 'string' ? dataObject.postData.ifsc_code : false;
               const accountNumber = typeof (dataObject.postData.account_number) === 'string' ? dataObject.postData.account_number : false;
               const accountName = typeof (dataObject.postData.account_holder_name) === 'string' ? dataObject.postData.account_holder_name : false;
               const values = "'','" + firstName + "','" + lastName + "','" + address +
                  "','" + panNumber + "','" + phone + "','" + email + "','" + gstNumber + "','" +
                  bankName + "','" + branchName + "','" + ifscCode + "','" + accountNumber + "','" + accountName + "'";
               database.insert("vendor_details", values, function (err, insertData) {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': false, 'msg': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': true});
                  }
               });
            }
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   } else if (dataObject.method === 'get') {
      console.log("VENDOR GET ", dataObject.queryString);
      const id = dataObject.queryString.vendor_id > 0 ? dataObject.queryString.vendor_id : false;
      const type = typeof (dataObject.queryString.type) === 'string' ? dataObject.queryString.type : false;
      if (id && type === 'spare') {
         const query = "SELECT c.spare_part_id, d.part_name,c.cost, s.stock " +
            "FROM spare_part_cost c, spare_part_details d, spare_part_stock s" +
            " WHERE c.vendor_id =" + id + " AND d.id =c.spare_part_id AND s.spare_part_id = c.spare_part_id";
         database.query(query, function (err, spareDate) {
            if (err) {
               console.error(err.stack);
               callback(err, 500, {'res': messages.errorMessage});
            } else {
               callback(false, 200, {'res': spareDate});
            }
         });
      } else if (id && type === 'device') {
         const query = "SELECT i.*,s.sold_stock_service as status " +
            "FROM service_stock_sold_details s , inventory i " +
            "WHERE i.vendor_id  = " + id + " AND s.id = i.service_stock";
         database.query(query, function (err, deviceData) {
            if (err) {
               console.error(err.stack);
               callback(err, 400, {'res': messages.errorMessage});
            } else {
               callback(false, 200, {'res': deviceData});
            }
         });
      } else {
         callback(true, 400, {'res': messages.insufficientData});
      }
   } else {
      callback(true, 403, {'res': messages.invalidRequestMessage});
   }
};
/**
 * This is the method to get the count of distinct model based on the state.
 * It returns count and model name based on a particular state, referred to 'service_stock_sold' table.
 * PUT Request to update the state of the phone with IMEI and Remarks.
 * @param dataObject: The Request Object. GET Method ?state=''
 * @param callback: The method callback.
 */
handlers.inventoryState = function (dataObject, callback) {
   if (dataObject.method === 'get') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            let state;
            try {
               state = dataObject.queryString.state.trim();
               state = typeof (state) === 'string' && state.length > 1 ? state : false;
            } catch (e) {
               state = false;
            }
            if (state) {
               const query = "SELECT i.*, count(i.model_name) as count " +
                  "FROM inventory i, service_stock_sold_details s " +
                  "WHERE s.sold_stock_service LIKE '" + state + "' AND s.id = i.service_stock group by (i.model_name)";
               database.query(query, function (err, serviceData) {
                  if (err) {
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': serviceData});
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   } else if (dataObject.method === 'put') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            let imei, remarks, state;
            try {
               imei = typeof (dataObject.postData.imei) === 'string' && dataObject.postData.imei.length > 0 ? dataObject.postData.imei : false;
               remarks = typeof (dataObject.postData.remarks) === 'string' && dataObject.postData.remarks.length > 0 ? dataObject.postData.remarks : false;
               state = typeof (dataObject.postData.state) === 'string' && dataObject.postData.state.length > 0 ? dataObject.postData.state : false;
            } catch (e) {
               console.log(e);
               imei = "";
               remarks = "";
               state = "";
            }
            const query = "UPDATE inventory i, service_stock_sold_details s " +
               "SET i.remarks= '" + remarks + "' , i.service_stock = s.id WHERE i.product_imei_1= '" + imei + "' AND s.sold_stock_service= '" + state + "'";
            database.query(query, function (err, updateData) {
               if (err) {
                  console.error(err.stack);
                  callback(err, 500, {'res': messages.errorMessage});
               } else {
                  callback(false, 200, {'res': true});
               }
            });
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      })
   } else if (dataObject.method === 'post') {
      helpers.validateToken(dataObject.queryString.key, (isValid) => {
         if (isValid) {
            const imei = typeof (dataObject.postData.imei_number) === 'string' ? dataObject.postData.imei_number : false;
            let batteryPercentage = Number(dataObject.postData.battery) > 0 ? dataObject.postData.battery : false;
            if (imei) {
               if (!batteryPercentage) {
                  batteryPercentage = 0;
               }
               const query = "UPDATE inventory SET is_video_taken=1, battery_percentage = " + batteryPercentage +
                  " WHERE product_imei_1 LIKE '" + imei + "'";
               database.query(query, (err, updateData) => {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': true});
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
 * Method to put the Attendance for the Employee.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.attendance = function (dataObject, callback) {
   const key = dataObject.queryString.key;
   if (dataObject.method === 'post') {
      helpers.validateToken(key, function (isValid) {
         if (isValid) {
            const postData = dataObject.postData;
            const id = Number(postData.id);
            const new_status = postData.new_status;
            const location = postData.location;
            const timestamp = postData.timestamp;
            let query = "UPDATE employee_details SET current_status = '" + new_status + "' WHERE id = " + id + " AND current_status NOT LIKE 'inactive'";
            database.query(query, function (err, data) {
               if (!err) {
                  const timeDate = Math.floor((new Date().getTime()) / 1000);
                  const formattedDate = (moment.unix(timeDate).tz('Asia/Kolkata')
                     .format(messages.dateFormat))
                     .split(' ');
                  const date = formattedDate[0];
                  const time = formattedDate[1];
                  query = "INSERT INTO attendance_record VALUES (''," + id + ",'" +
                     new_status + "','" + timestamp + "','" + location + "','" + date + "','" + time + "')";
                  console.log(query);
                  database.query(query, function (err, insertData) {
                     if (!err) {
                        callback(false, 200, {
                           'res': messages.attendancePut,
                           'current_status': new_status
                        });
                        notifyEmployeeAttendance(id, new_status);
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
   } else if (dataObject.method === 'get') {
      const token = dataObject.queryString.key;
      helpers.validateToken(token, function (isValid) {
         if (isValid) {
            let employeeID;
            try {
               employeeID = Number(dataObject.queryString.employeeid);
               employeeID = typeof (employeeID) === 'number' ? employeeID : false;

            } catch (e) {
               employeeID = false;
               callback(e, 400, {'res': messages.errorMessage});
            }
            if (employeeID) {
               const query = "SELECT * FROM attendance_record WHERE employee_id = " + employeeID;
               database.query(query, function (err, empData) {
                  if (err) {
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     const attendanceRecord = [];
                     for (let i = 0; i < empData.length; i++) {
                        attendanceRecord.push(empData[i]);
                     }
                     callback(false, 200, {'res': attendanceRecord});
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   } else if (dataObject.method === 'put') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
            if (isValid) {
               const employeeID = dataObject.queryString.id > 0 ? dataObject.queryString.id : false;
               if (employeeID) {
                  let query = "update employee_details set current_status = CASE " +
                     "When current_status = 'signed_out' then 'signed_in'" +
                     "when current_status = 'signed_in' then 'signed_out'" +
                     "end where id =  " + employeeID;
                  database.query(query, function (err, updateData) {
                     if (err) {
                        console.log(err);
                        callback(err, 500, {'res': messages.errorMessage});
                     } else {
                        const timeDate = Math.floor((new Date().getTime()) / 1000);
                        const formattedDate = (moment.unix(timeDate).tz('Asia/Kolkata')
                           .format(messages.dateFormat))
                           .split(' ');
                        const date = formattedDate[0];
                        const time = formattedDate[1];
                        query = "INSERT INTO attendance_record VALUES(''," + employeeID + "," +
                           "(SELECT current_status FROM employee_details WHERE id=" + employeeID + ")," +
                           "'" + timeDate + "',(SELECT location FROM staging_diagnostic_app.employee_details WHERE id=" +
                           employeeID + "),'" + date + "','" + time + "')";
                        console.log(query);
                        database.query(query, function (err, insertData) {
                           if (err) {
                              console.log(err);
                              callback(err, 500, {'res': messages.errorMessage});
                           } else {
                              callback(false, 200, {'res': true});
                              notifyEmployeeAttendance(employeeID);
                           }
                        });
                     }
                  });
               } else {
                  callback(true, 400, {'res': messages.insufficientData});
               }
            } else {
               callback(true, 403, {'res': messages.tokenExpiredMessage});
            }
         }
      );
   } else {
      callback(true, 400, {'res': messages.invalidRequestMessage});
   }

   /**
    * Method to send the notification to the Employee for the Attendance.
    * @param employeeID: The Employee ID.
    * @param status: The New status.
    */
   function notifyEmployeeAttendance(employeeID, status) {
      const query = "SELECT * FROM employee_details WHERE id=" + employeeID;
      database.query(query, function (err, employeeData) {
         if (err) {
            console.error(err.stack);
         } else {
            const deviceToken = employeeData[0].device_token;
            const content = "Attendance";
            status = employeeData[0].current_status;
            helpers.sendFirebaseNotification(deviceToken, status, content, "", function (err) {
               if (err) {
                  console.error(err.stack);
               } else {
                  console.log("Employee Notified for Attendance.");
               }
            });
         }
      });
   }
}
;
/**
 * Method to get the Phone details with the IMEI from the Inventory.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.inventoryImei = function (dataObject, callback) {
   const key = dataObject.queryString.key;
   if (dataObject.method === 'post') {
      helpers.validateToken(key, function (isValid) {
         if (isValid) {
            const imei = typeof (dataObject.postData.imei) === 'string' &&
            dataObject.postData.imei.trim().length > 10 ?
               dataObject.postData.imei.trim() : false;
            if (imei) {
               const query = "SELECT i.*,v.first_name as vendor_first_name, v.last_name as vendor_last_name FROM " +
                  "inventory i , vendor_details v " +
                  "WHERE i.product_imei_1 LIKE '" + imei + "' AND i.vendor_id = v.vendor_id ";
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
 * Method to get the Pending phones from the Phone Table.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.inventoryPendingPhones = function (dataObject, callback) {
   if (dataObject.method === 'get') {
      const key = dataObject.queryString.key;
      helpers.validateToken(key, function (isValid) {
         if (isValid) {
            const query = "SELECT * FROM phone_details WHERE status = 5 AND is_customer=0";
            database.query(query, function (err, phoneData) {
               if (err) {
                  callback(err, 500, {'res': messages.errorMessage});
               } else {
                  callback(false, 200, {'res': phoneData});
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
 * Method to add the new Visit.
 * @param dataObject: The Request Object.
 * @param callback: the method callback.
 */
handlers.visit = function (dataObject, callback) {
   if (dataObject.method === 'post') {
      let visitorID;
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            const visitorPhone = typeof (dataObject.postData.visitor_phone) === 'string' ? dataObject.postData.visitor_phone.trim() : false;
            console.log(visitorPhone);
            if (visitorPhone) {
               let query = "SELECT * FROM visitor_details WHERE mobile_number LIKE '" + visitorPhone + "'";
               database.query(query, function (err, visitorData) {
                  console.log(visitorPhone);
                  if (!err) {
                     visitorID = visitorData[0].id;
                     console.log(visitorID);
                     const employeeId = dataObject.postData.id;
                     const timeDate = Math.floor((new Date().getTime()) / 1000);
                     const timeStamp = (moment.unix(timeDate).tz('Asia/Kolkata').format(messages.dateFormat)).split(' ');
                     const location = dataObject.postData.location;
                     const purpose = dataObject.postData.purpose;
                     const values = "''," + employeeId + "," + visitorID + ",'" + location + "','" + timeStamp + "',3,'" + purpose + "'";
                     database.insert("visit_details", values, function (err, insertVisitData) {
                        if (!err) {
                           callback(false, 200, {'res': true});
                           getTokenAndNotify(employeeId, insertVisitData.insertId);
                        } else {
                           callback(err, 500, {'res': messages.errorMessage});
                           console.log(err);
                        }
                     });
                  } else {
                     console.error(err, err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }

         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   } else if (dataObject.method === 'put') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            const postData = dataObject.postData;
            const employeeId = postData.id > 0 ? postData.id : false;
            const time = typeof (postData.time) === 'string' && postData.time.length > 2 ? postData.time : false;
            const date = typeof (postData.date) === 'string' && postData.date.length > 2 ? postData.date : false;
            const visitorPhone = typeof (postData.visitor_phone) === 'string' && postData.visitor_phone.length > 2 ? postData.visitor_phone : false;
            const status = typeof (postData.status) === 'string' && postData.status.length > 1 ? postData.status : false;
            console.log(postData);
            if (employeeId && time && date) {
               const dateTime = date + "," + time;
               const query = "UPDATE visit_details v,visit_status_details s,visitor_details d " +
                  "SET v.status=s.id " +
                  "WHERE s.status LIKE '" + status + "' AND v.employee_id= " + employeeId +
                  " AND  d.mobile_number LIKE '" + visitorPhone +
                  "' AND v.visitor_id= d.id AND v.time_stamp LIKE '" + dateTime + "'";
               console.log(query);
               database.query(query, function (err, updateData) {
                  if (err) {
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': true});
                     notifyVisitor(visitorPhone, status, employeeId);
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

   /**
    * Method to send FCM.
    * @param employeeID: The Employee ID.
    * @param visitId: The Visit Id.
    */
   function getTokenAndNotify(employeeID, visitId) {
      let query = "SELECT * FROM employee_details WHERE id = " + employeeID;
      database.query(query, function (err, employeeData) {
         //console.log(employeeData[0]);
         if (err) {
            console.log(err);
         } else {
            query = "SELECT * FROM visit_details WHERE id = " + visitId;
            database.query(query, function (err, visitData) {
               //console.log(visitData[0]);
               if (err) {
                  console.log(err);
               } else {
                  query = "SELECT * FROM visitor_details WHERE id = " + visitData[0].visitor_id;
                  database.query(query, function (err, visitorData) {
                     if (err) {
                        console.error(err.stack);
                     } else {
                        const msg = new Buffer(JSON.stringify(employeeData[0])).toString('base64');
                        const content = new Buffer(JSON.stringify(visitData[0])).toString('base64');
                        const extra = new Buffer((JSON.stringify(visitorData[0]))).toString('base64');
                        if (employeeData[0].device_token.length > 0) {
                           helpers.sendFirebaseNotification(employeeData[0].device_token, msg, content, extra, function (err) {
                              if (err) {
                                 console.log(err);
                              } else {
                                 console.log("Notification send.");
                              }
                           });
                        } else {
                           console.log("No device Token found.");
                        }
                     }
                  });
               }
            });
         }
      });
   }

   /**
    * Method to send the sms to the visitor.
    * @param phone: The Phone number of the Visitor.
    * @param status: the status of the visit.
    */
   function notifyVisitor(phone, status, employeeID) {
      let msg = status === 'Accepted' ? messages.acceptVistMessage : messages.rejectVisitMessage;
      snsLib.sendMessage(phone, msg, function (err) {
         if (err) {
            console.log(err);
         } else {
            console.log('Visitor Notified.');
            notifySecurity(phone, status, employeeID);
         }
      });
   }

   /**
    * Method to send a notification to the security that a visit status has been updated.
    */
   function notifySecurity(visitorPhone, status, employeeID) {
      let query = "SELECT *  FROM employee_details WHERE designation LIKE 'security'";
      database.query(query, function (err, secrityData) {
         if (err) {
            console.log(err);
         } else {
            let deviceToken = "";
            try {
               deviceToken = secrityData[0].device_token;
            } catch (e) {
               console.log(e);
            }
            const msg = status;
            const content = "security";
            const extraObj = new Buffer(JSON.stringify({
               "visitor_phone": visitorPhone,
               "id": employeeID
            })).toString('base64');
            helpers.sendFirebaseNotification(deviceToken, msg, content, extraObj, function (err) {
               if (err)
                  console.log(err);
               else {
                  console.log("Security Notified.");
               }
            });
         }
      });
   }
};
/**
 * Method to insert the New phone to the Inventory.
 * GET to get the devices in Transit.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.inventoryAdd = function (dataObject, callback) {
   if (dataObject.method === 'post') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            const type = dataObject.queryString.type;
            if (type === 'business') {
               helpers.addInventoryPhone(dataObject.postData, function (err, data) {
                  if (err) {
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': messages.phoneInserted});
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   } else if (dataObject.method === 'get') {
      helpers.validateToken(dataObject.queryString.key, (isValid) => {
         if (isValid) {
            const type = typeof (dataObject.queryString.type) === 'string' ? dataObject.queryString.type : false;
            if (type) {
               let query;
               switch (type) {
                  case "order":
                     query = "SELECT * FROM inventory WHERE service_stock = 11";
                     break;
                  case "service":
                     query = "SELECT * FROM inventory WHERE service_stock = 10";
                     break;
                  case "queued":
                     query = "SELECT * FROM inventory WHERE service_stock = 4";
                     break;
               }
               database.query(query, (err, queuedData) => {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': queuedData});
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
 * Method to generate the Inventory OTP.
 * @param dataObject: the request object.
 * @param callback: The Method callback.
 */
handlers.inventoryPin = function (dataObject, callback) {
   helpers.validateToken(dataObject.queryString.key, function (isValid) {
      if (isValid) {
         if (dataObject.method === 'post') {
            console.log(dataObject.postData);
            let emailId = dataObject.postData.email.trim();
            emailId = typeof (emailId) === 'string' && emailId.length >= 5 ? emailId : false;
            if (emailId) {
               const pin = helpers.createOTP();
               console.log(pin);
               let query = "SELECT * FROM login_pin WHERE email LIKE '" + emailId + "'";
               database.query(query, function (err, selectData) {
                  if (selectData.length > 0) {
                     query = "UPDATE login_pin SET passcode = " + pin + " WHERE email LIKE '" + emailId + "'";
                     database.query(query, function (err, updateData) {
                        if (err) {
                           console.log(err);
                           callback(err, 500, {'res': messages.errorMessage});
                        } else {
                           callback(false, 200, {'res': pin});
                        }
                     });
                  } else {
                     const values = "'" + emailId + "'," + pin;
                     database.insert("login_pin", values, function (err, insertData) {
                        if (!err) {
                           callback(false, 200, {'res': pin});
                        } else {
                           callback(true, 500, {'res': messages.errorMessage});
                        }
                     });
                  }
               });
            } else {
               callback(false, 400, {'res': messages.insufficientData});
            }
         } else if (dataObject.method === 'get') {
            const userPin = dataObject.queryString.pin;
            query = "SELECT * FROM login_pin WHERE passcode=" + userPin;
            database.query(query, function (err, Data) {
               if (err) {
                  callback(err, 404, {'res': messages.errorMessage});
               } else {
                  if (Data.length > 0) {
                     callback(false, 200, {'res': true, 'email': Data[0].email});
                  } else {
                     callback(false, 200, {'res': false});
                  }
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
 * This is the method to create a login pin and check login status of a user.
 * This will create a OTP for inventory on successful login.
 * This will also update the session id of the user using the PUT Request.
 * This will also delete the login pin while logging out with GET request.
 * @param dataObject: The Request Object.
 * @param callback: The method callback.
 */
handlers.inventoryAuth = function (dataObject, callback) {
   let isLoggedIn = true, isPasswordValid = false;
   helpers.validateToken(dataObject.queryString.key, function (isValid) {
      if (isValid) {
         if (dataObject.method === 'post') {
            var email, password, isSessionDeleted, isOTPDeleted;
            try {
               email = typeof (dataObject.postData.email) === 'string' && dataObject.postData.email.length > 0 ?
                  dataObject.postData.email.trim() : false;
               password = typeof (dataObject.postData.password) === 'string' && dataObject.postData.password.length > 0 ?
                  dataObject.postData.password.trim() : false;
            } catch (e) {
               email = false;
               password = false;
            }
            if (email && password) {
               checkLoggedIn(email);
               checkValidity(email, password);
            } else {
               callback(true, 400, {'res': messages.insufficientData, 'msg': false});
            }
         } else if (dataObject.method === 'get') {
            try {
               email = typeof (dataObject.queryString.email) === 'string' && dataObject.queryString.email.length > 0 ?
                  dataObject.queryString.email.trim() : false;
            } catch (e) {
               email = false;
            }
            query = "DELETE FROM login_pin WHERE email LIKE '" + email + "'";
            console.log(query);
            database.query(query, function (err, deleteData) {
               if (err) {
                  callback(err, 500, {'res': messages.errorMessage});
                  isOTPDeleted = false;
               } else {
                  isOTPDeleted = true;
                  sendResponse();
               }
            });
            query = "UPDATE people set sessionid='' WHERE email LIKE '" + email + "'";
            database.query(query, function (err, updateData) {
               if (err) {
                  isSessionDeleted = false;
                  callback(err, 500, {'res': messages.errorMessage});
               } else {
                  isSessionDeleted = true;
                  sendResponse();
               }
            });

            /**
             * Method to send the response after delete.
             */
            function sendResponse() {
               if (isOTPDeleted && isSessionDeleted) {
                  callback(false, 200, {'res': true});
               }
            }
         } else if (dataObject.method === 'put') {
            let session;
            try {
               email = typeof (dataObject.postData.email) === 'string' && dataObject.postData.email.length > 0 ?
                  dataObject.postData.email.trim() : false;
               session = typeof (dataObject.postData.sessionid) === 'string' && dataObject.postData.sessionid.length > 0 ?
                  dataObject.postData.sessionid.trim() : false;
            } catch (e) {
               email = false;
               session = false;
            }
            if (email && session) {
               var query = "UPDATE people set sessionid='" + session + "' WHERE email LIKE '" + email + "'";
               database.query(query, function (err, sessionData) {
                  if (err) {
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': true});
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else {
            callback(true, 400, {'res': messages.invalidRequestMessage});
         }
      } else {
         callback(true, 403, {'res': messages.tokenExpiredMessage});
      }
   });

   /**
    * This is the method to check whether the user is already logged in or not.
    * @param email: The email of the user.
    */
   function checkLoggedIn(email) {
      const query = "SELECT * FROM login_pin WHERE email LIKE '" + email + "'";
      database.query(query, function (err, pinData) {
         if (err) {
            callback(err, 500, {'res': messages.errorMessage});
         } else {
            if (pinData.length === 0) {
               isLoggedIn = false;
            } else {
               callback(false, 202, {'res': messages.alreadyLoggedIn});
            }
            sendResponse(email);
         }
      });
   }

   /**
    * This is the method to check whether the email and the password is valid or not.
    * @param email: The Email of the user.
    * @param password: the password.
    */
   function checkValidity(email, password) {
      const query = "SELECT * FROM people WHERE email LIKE '" + email + "'";
      database.query(query, function (err, loginData) {
         if (err) {
            callback(err, 500, {'res': messages.errorMessage});
         } else {
            if (loginData.length > 0) {
               if (loginData[0].email === email && loginData[0].password === password) {
                  isPasswordValid = true;
                  sendResponse(email);
               } else {
                  callback(true, 403, {'res': false, 'message': messages.invalidPassword});
               }
            } else {
               callback(true, 403, {'res': false, 'message': messages.invalidPassword});
            }
         }
      });
   }

   /**
    * Method to create the OTP and then insert it into the table.
    * @param email: The Email of the user.
    */
   function sendResponse(email) {
      if (!isLoggedIn && isPasswordValid) {
         const otp = helpers.createOTP();
         console.log('otp', otp);
         const query = "INSERT INTO login_pin VALUES('" + email + "'," + otp + ")";
         database.query(query, function (err, pinData) {
            if (err) {
               callback(err, 500, {'res': messages.errorMessage});
            } else {
               callback(false, 200, {'res': true, 'otp': otp, 'email': email});
            }
         });
      }
   }
};
/**
 * Method to insert the Sell your phone Order and send sms and also to get Order Details and Update status
 * of the existing Order.
 * @param dataObject: The Request Object.
 * @param callback: The method callback.
 */
handlers.sellPhoneOrder = function (dataObject, callback) {
   if (dataObject.method === 'options') {
      callback(false, 200, {});
   } else if (dataObject.method === 'post') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            const postData = dataObject.postData;
            console.log(postData);
            helpers.addSellPhoneOrder(postData, function (err) {
               if (err) {
                  callback(err, 500, {'res': false});
               } else {
                  callback(false, 200, {'res': true});
               }
            });
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   } else if (dataObject.method === 'get') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            const imei = dataObject.queryString.imei;
            const query = "SELECT * FROM buy_back_phone_order WHERE imei LIKE '" + imei + "'";
            database.query(query, function (err, sellData) {
               if (err) {
                  callback(err, 500, {'res': messages.errorMessage});
               } else {
                  callback(false, 200, {'res': sellData[0]});
               }
            });
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   } else if (dataObject.method === 'put') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            const imei = dataObject.postData.imei;
            const orderId = dataObject.postData.orderid;
            const query = "UPDATE buy_back_phone_order SET status = 4 WHERE imei LIKE '" + imei + "' " +
               "AND order_id = " + orderId;
            database.query(query, function (err, updateData) {
               if (err) {
                  callback(err, 500, {'res': false});
               } else {
                  callback(false, 200, {'res': true});
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
 * Method to get the brand and other details for SellYourPhone.
 * @param dataObject: the request Object.
 * @param callback: The Method callback.
 */
handlers.sellPhone = function (dataObject, callback) {
   let query;
   helpers.validateToken(dataObject.queryString.key, function (isValid) {
      if (isValid) {
         if (dataObject.method === 'post') {
            const postData = dataObject.postData;
            const brandName = typeof (postData.brand) === 'string' && postData.brand.trim().length > 0 ?
               postData.brand.trim() : false;
            const modelName = typeof (postData.model) === 'string' && postData.model.trim().length > 0 ?
               postData.model.trim() : false;
            if (brandName && !modelName) {
               query = "SELECT model FROM buy_back_phone WHERE brand LIKE '" + brandName + "'";
               database.query(query, function (err, modelData) {
                  if (err) {
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     const arr = [];
                     for (let i = 0; i < modelData.length; i++) {
                        arr[i] = modelData[i].model;
                     }
                     callback(false, 200, {'res': arr});
                  }
               });
            } else if (brandName && modelName) {
               query = "SELECT id FROM buy_back_phone WHERE model LIKE '" + modelName +
                  "' AND brand LIKE '" + brandName + "'";
               database.query(query, function (err, phoneIdData) {
                  if (err) {
                     callback(true, 500, {'res': messages.errorMessage});
                  } else {
                     const id = phoneIdData[0].id;
                     query = "SELECT storage,price FROM buy_back_phone_price WHERE phoneId = " + id;
                     database.query(query, function (err, phoneData) {
                        if (err) {
                           callback(true, 500, {'res': messages.errorMessage});
                        } else {
                           callback(false, 200, {'res': phoneData});
                        }
                     });
                  }
               });
            } else if (!brandName && !modelName) {
               query = "SELECT distinct(brand) FROM buy_back_phone";
               database.query(query, function (err, brandData) {
                  if (err) {
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     const arr = [];
                     for (let i = 0; i < brandData.length; i++) {
                        arr[i] = brandData[i].brand;
                     }
                     callback(false, 200, {'res': arr});
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else if (dataObject.method === 'options') {
            callback(false, 200, {});//Accepting Options Request.
         } else {
            callback(false, 400, {'res': messages.invalidRequestMessage});
         }
      } else {
         callback(true, 403, {'res': messages.tokenExpiredMessage});
      }
   });
};
/**
 * Method to get the Phone Price for the Diagnostic App.
 * @param dataObject: The Request Object.
 * @param callback: The method callback.
 */
handlers.phonePrice = function (dataObject, callback) {
   if (dataObject.method === 'post') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            const postData = dataObject.postData;
            const brand = typeof (postData.brand) === 'string' && postData.brand.trim().length > 0 ? postData.brand.trim() : false;
            const model = typeof (postData.model) === 'string' && postData.model.trim().length > 0 ? postData.model.trim() : false;
            const storage = postData.storage > 0 ? postData.storage : false;
            if (brand && model && storage) {
               let query = "SELECT * FROM buy_back_phone WHERE brand LIKE '" + brand + "' AND model LIKE '" + model + "'";
               database.query(query, function (err, phoneData) {
                  if (err) {
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     try {
                        const id = phoneData[0].id;
                        query = "SELECT * FROM buy_back_phone_price WHERE phoneId = " + id;
                        database.query(query, function (err, priceData) {
                           if (err) {
                              callback(err, 500, {'res': messages.errorMessage});
                           } else {
                              const response = {
                                 'storage': priceData[0].storage,
                                 'ram': priceData[0].ram,
                                 'price': priceData[0].price
                              };
                              callback(false, 200, {'res': response});
                           }
                        });
                     } catch (e) {
                        callback(true, 400, {'res': "Phone doesn't exists."});
                     }
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      })
   } else if (dataObject.method === 'put') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            const model = typeof (dataObject.postData.model) === 'string' &&
            dataObject.postData.model.length > 0 ? dataObject.postData.model : false;
            const storage = Number(dataObject.postData.storage) > 0 ? Number(dataObject.postData.storage) : false;
            const price = Number(dataObject.postData.price) > 0 ? Number(dataObject.postData.price) : false;
            const brand = typeof (dataObject.postData.brand) === 'string' &&
            dataObject.postData.brand.length > 0 ? dataObject.postData.brand : false;
            let query = "SELECT id FROM buy_back_phone WHERE model LIKE '" + model + "'";
            database.query(query, function (err, modelData) {
               if (err) {
                  console.error(err.stack);
                  callback(err, 500, {'res': messages.errorMessage});
               } else {
                  if (modelData.length > 0) {
                     query = "UPDATE buy_back_phone_price SET price = " + price + " " +
                        "WHERE phoneId = " + modelData[0].id + " AND storage = " + storage;
                     database.query(query, function (err, updateData) {
                        if (err) {
                           console.error(err.stack);
                           callback(err, 500, {'res': messages.errorMessage});
                        } else {
                           callback(false, 200, {'res': true});
                        }
                     });
                  } else {
                     //console.log(modelData);
                     query = "INSERT INTO buy_back_phone VALUES ('','" + brand + "','" + model + "')";
                     database.query(query, function (err, insertData) {
                        if (err) {
                           console.error(err.stack);
                           callback(err, 500, {'res': messages.errorMessage});
                        } else {
                           const id = insertData.insertId;
                           query = "INSERT INTO buy_back_phone_price VALUES (" + id + ",0," + storage + ",''," + price + ")";
                           database.query(query, function (err, priceInsertData) {
                              if (err) {
                                 console.error(err.stack);
                                 callback(err, 500, {'res': messages.errorMessage});
                              } else {
                                 callback(false, 200, {'res': true});
                              }
                           });
                        }
                     });
                  }
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
 * Method to get the Returned Order.
 * This method joins the Order table and the Order status table to fetch the data.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.orderReturned = function (dataObject, callback) {
   const key = dataObject.queryString.key;
   if (dataObject.method === 'get') {
      helpers.validateToken(key, function (isValid) {
         if (isValid) {
            const query = "SELECT * FROM order_details WHERE channel_order_id in " +
               "(SELECT distinct return_order_id FROM report_details WHERE length(return_order_id) > 9)";
            database.query(query, function (err, returnedData) {
               if (err) {
                  callback(err, 500, {'res': messages.errorMessage});
               } else {
                  const array = [];
                  for (let i = 0; i < returnedData.length; i++) {
                     array.push(returnedData[i]);
                  }
                  callback(false, 200, {'res': array});
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
 * Method to get all the order Details.
 * Either you can get all the order for a channel, or based on a particular status.
 * Based on a particular date, or hxOrderID.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.orderDetails = function (dataObject, callback) {
   const key = dataObject.queryString.key;
   if (dataObject.method === 'get') {
      helpers.validateToken(key, function (isValid) {
         if (isValid) {
            let status = dataObject.queryString.status;
            const date = typeof (dataObject.queryString.date) === 'string' &&
            dataObject.queryString.date.length > 1 ? dataObject.queryString.date : false;
            const channelname = typeof (dataObject.queryString.channel) === 'string' &&
            dataObject.queryString.channel.length > 1 ? dataObject.queryString.channel : false;
            status = typeof (status) === 'string' && status.length > 1 ? status : false;
            const hxOrderId = typeof (dataObject.queryString.orderid) === 'string' &&
            dataObject.queryString.orderid.length > 0 ? dataObject.queryString.orderid : false;
            const imei = typeof (dataObject.queryString.imei) === 'string' &&
            dataObject.queryString.imei.length > 0 ? dataObject.queryString.imei : false;
            let query;
            if (!status && date && channelname) {
               query = "SELECT * FROM order_details WHERE channel_name LIKE '" + channelname + "'  AND insertion_date " +
                  "LIKE '" + date + "'";
            } else if (status && !date && !channelname) {
               query = "SELECT o.* FROM order_details o,order_status_details s " +
                  "WHERE s.status LIKE '" + status + "' " + "AND o.order_status=s.id";
            } else if (channelname) {
               query = "SELECT * FROM order_details WHERE channel_name LIKE '" + channelname + "'";
            } else if (date) {
               query = "SELECT * FROM order_details WHERE order_date LIKE '" + date + "'";
            } else if (hxOrderId) {
               query = "SELECT * FROM order_details WHERE hx_order_id = " + hxOrderId;
            } else if (imei) {
               query = "SELECT * FROM order_details WHERE imei_number LIKE '" + imei + "'";
            } else {
               query = "SELECT * FROM order_details";
            }
            console.log(query);
            database.query(query, function (err, orderData) {
               if (err) {
                  callback(err, 500, {'res': orderData});
               } else {
                  const array = [];
                  for (let i = 0; i < orderData.length; i++) {
                     array.push(orderData[i]);
                  }
                  callback(false, 200, {'res': array});
               }
            });
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   } else if (dataObject.method === 'post') {
      helpers.insertOrder(dataObject.postData, function (err) {
         if (err) {
            callback(err, 500, {'res': messages.errorMessage});
         } else {
            callback(false, 200, {'res': true});
         }
      });
   } else {
      callback(false, 400, {'res': messages.invalidRequestMessage});
   }
};
/**
 * This is the method to update the order status based on the condition.
 * GET to get the order status details.
 * @param dataObject: The Request Object.
 * @param callback: the method callback.
 */
handlers.orderStatus = function (dataObject, callback) {
   if (dataObject.method === 'put') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            let type = false, channelOrderID = false, hxorderid = false, status = false, value = false;
            try {
               type = typeof (dataObject.queryString.type) === 'string' &&
               dataObject.queryString.type.length > 1 ? dataObject.queryString.type : false;
               channelOrderID = typeof (dataObject.queryString.orderid) === 'string' &&
               dataObject.queryString.orderid.length > 1 ? dataObject.queryString.orderid : false;
               hxorderid = typeof (dataObject.queryString.hxorderid) === 'string' &&
               dataObject.queryString.hxorderid.length > 0 ? dataObject.queryString.hxorderid : false;
               status = typeof (dataObject.queryString.status) === 'string' &&
               dataObject.queryString.status.length > 1 ? dataObject.queryString.status : false;
               value = typeof (dataObject.queryString.value) === 'string' &&
               dataObject.queryString.value.length > 0 ? dataObject.queryString.value : false;
            } catch (e) {
               console.log(e);
            }
            if (type === 'video') {
               const query = "UPDATE order_details SET is_video_taken = 1" +
                  " WHERE channel_order_id LIKE '" + channelOrderID + "'";
               database.query(query, function (err, updateData) {
                  if (err) {
                     console.log(err);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': true});
                  }
               });
            } else if (type === 'status') {
               if (status) {
                  const remarks = typeof (dataObject.postData.remarks) === 'string' &&
                  dataObject.postData.remarks.length > 0 ? dataObject.postData.remarks : false;
                  const imei = typeof (dataObject.postData.imei) === 'string' &&
                  dataObject.postData.imei.length > 10 ? dataObject.postData.imei : false;
                  let query;
                  if (remarks) {
                     query = "UPDATE order_details o, order_status_details s " +
                        "SET o.order_status = s.id, o.remarks= '" + remarks + "'" +
                        " WHERE s.status= '" + status +
                        "' AND o.hx_order_id= " + hxorderid;
                  } else if (imei && status === 'Ready-to-Invoice') {
                     query = "UPDATE order_details o, order_status_details s " +
                        "SET o.order_status = s.id, o.imei_number= '" + imei + "'" +
                        " WHERE s.status= '" + status +
                        "' AND o.hx_order_id= " + hxorderid;
                     console.log(query);
                     updateOrderVideoStatus(imei, hxorderid);
                     updatePhoneAndInventory(imei);
                  } else {
                     query = "UPDATE order_details o, order_status_details s " +
                        "SET o.order_status = s.id WHERE s.status= '" + status +
                        "' AND o.hx_order_id= " + hxorderid;
                  }
                  database.query(query, function (err, updateData) {
                     if (err) {
                        console.log(err);
                        callback(err, 500, {'res': messages.errorMessage});
                     } else {
                        callback(false, 200, {'res': true});
                     }
                  });
               } else {
                  callback(true, 400, {'res': messages.insufficientData});
               }
            } else if (type === 'invoice') {
               if (hxorderid && value) {
                  const query = "UPDATE order_details o, order_status_details s" +
                     " SET o.invoice_number='" + value + "', " +
                     "o.order_status=s.id WHERE o.hx_order_id= " + hxorderid +
                     " AND s.status='Ready-to-Pack'";
                  database.query(query, function (err, updateData) {
                     console.log(updateData);
                     if (err) {
                        callback(err, 500, {'res': messages.errorMessage});
                     } else {
                        callback(false, 200, {'res': true});
                     }
                  });
               } else {
                  callback(type, 400, {'res': messages.insufficientData});
               }
            } else if (type === 'pack') {
               if (hxorderid && value) {
                  const query = "UPDATE order_details o, order_status_details s" +
                     " SET o.battery_before_ship='" + value + "', " +
                     "o.order_status=s.id WHERE o.hx_order_id= " + hxorderid +
                     " AND s.status='Ready-to-Ship' AND o.is_video_taken=1";
                  database.query(query, function (err, updateData) {
                     if (err) {
                        callback(err, 500, {'res': messages.errorMessage});
                     } else {
                        if (updateData.affectedRows > 0) {
                           callback(false, 200, {'res': true});
                        } else {
                           callback(false, 200, {'res': messages.noVideo});
                        }
                     }
                  });
               } else {
                  callback(true, 400, {'res': messages.insufficientData});
               }
            } else if (type === 'ship') {
               if (hxorderid && value) {
                  const query = "UPDATE order_details o, order_status_details s" +
                     " SET o.awb_number='" + value + "', " +
                     "o.order_status=s.id WHERE o.hx_order_id= " + hxorderid +
                     " AND s.status='Shipped' AND o.order_status=4";
                  updateQRTable(hxorderid, 5);
                  database.query(query, function (err, updateData) {
                     if (err) {
                        callback(err, 500, {'res': messages.errorMessage});
                     } else {
                        callback(false, 200, {'res': true});
                     }
                  });
               } else {
                  callback(true, 400, {'res': messages.insufficientData});
               }
            } else if (type === 'Delivered') {
               if (hxorderid) {
                  const query = "UPDATE order_details SET o.order_status = 6 WHERE hx_order_id = " + hxorderid;
                  database.query(query, function (err, updateData) {
                     if (err) {
                        console.error(err.stack);
                        callback(err, 500, {'res': messages.errorMessage});
                     } else {
                        callback(false, 200, {'res': true});
                        updateQRTable(hxorderid, 6);
                     }
                  });
               } else {
                  callback(true, 400, {'res': messages.insufficientData});
               }
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   } else if (dataObject.method === 'get') {
      helpers.validateToken(dataObject.queryString.key, isValid => {
         if (isValid) {
            const query = "SELECT * FROM order_status_details";
            database.query(query, (err, statusData) => {
               if (err) {
                  console.error(err.stack);
                  callback(err, 500, {'res': messages.errorMessage});
               } else {
                  callback(false, 200, {'res': statusData});
               }
            });
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   } else if (dataObject.method === 'post') {
      helpers.validateToken(dataObject.queryString.key, (isValid) => {
         if (isValid) {
            const imei = typeof (dataObject.postData.imei) === 'string' ? dataObject.postData.imei : false;
            if (imei) {
               const query = "UPDATE inventory SET is_video_taken=1 WHERE product_imei_1 LIKE '" + imei + "'";
               database.query(query, (err, updateData) => {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': true});
                  }
               });
            }
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   } else {
      callback(true, 400, {'res': messages.invalidRequestMessage});
   }

   /**
    * Method to update order_status in the QR Table.
    * @param hxOrderId: The HX Order ID.
    * @param updateStatus: The new Order Status.
    */
   function updateQRTable(hxOrderId, updateStatus) {
      let query = "SELECT imei_number FROM order_details WHERE hx_order_id = " + hxOrderId;
      database.query(query, function (err, imeiData) {
         if (err) {
            console.error(err.stack);
         } else {
            const imei = imeiData[0].imei_number;
            query = "UPDATE phone_details_qr SET order_status = " + updateStatus + " WHERE imei LIKE '" + imei + "'";
            database.query(query, function (err, updateData) {
               if (err) {
                  console.error(err.stack);
               } else {
                  console.log("imei in QR updated.");
               }
            });
         }
      });
   }

   /**
    * Method to update the Phone and Inventory status for the IMEI.
    * @param imei: The IMEI number of the device.
    */
   function updatePhoneAndInventory(imei) {
      let query = "UPDATE inventory SET service_stock = 1 WHERE product_imei_1 LIKE '" + imei + "'";
      database.query(query, function (err, inventoryUpdateData) {
         if (err) {
            console.error(err.stack);
         } else {
            console.log("Inventory Updated.");
         }
      });
      query = "UPDATE phone_details SET status = 1 WHERE imei LIKE '" + imei + "'";
      database.query(query, function (err, phoneUpdateData) {
         if (err) {
            console.error(err.stack);
         } else {
            console.log("Phone_details updated.");
         }
      });
      query = "UPDATE phone_details_qr SET phone_status=1 WHERE imei LIKE '" + imei + "'";
      database.query(query, (err, updateData) => {
         if (err) {
            console.error(err.stack);
         } else {
            console.log("QR Updated.");
         }
      })
   }

   /**
    * Update the Order status.
    * @param imei: The Imei of the device.
    * @param hxOrderID: The HX Order update.
    */
   function updateOrderVideoStatus(imei, hxOrderID) {
      let query = "SELECT * FROM inventory WHERE product_imei_1 LIKE '" + imei + "'";
      database.query(query, (err, inventoryData) => {
         if (err) {
            console.error(err.stack);
            console.log("Could not update the Video status for Order.");
         } else {
            console.log(inventoryData);
            if (inventoryData.length > 0 && inventoryData[0].is_video_taken === 1) {
               query = "UPDATE order_details SET is_video_taken =1," +
                  " battery_before_ship= " + inventoryData[0].battery_percentage +
                  " WHERE hx_order_id = " + hxOrderID;
               database.query(query, (err, updateData) => {
                  if (err) {
                     console.error(err.stack);
                  } else {
                     console.log("Order status Updated.");
                  }
               });
            } else {
               console.log("Not in Inventory ", imei);
            }
         }
      });
   }
};
/**
 * This is the method to get the Details of certain tables or the mapped values.
 * Such as Grade, service stock, courier.
 * @param dataObject: The Request Method.
 * @param callback: The Method callback.
 */
handlers.details = function (dataObject, callback) {
   let query;
   if (dataObject.method === 'get') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            let type;
            try {
               type = typeof (dataObject.queryString.type) === 'string' &&
               dataObject.queryString.type.length > 1 ? dataObject.queryString.type.trim() : false;
            } catch (e) {
               console.log(e);
               type = false;
            }
            if (type === 'vendor') {
               query = "SELECT * FROM vendor_details";
               database.query(query, function (err, vendorData) {
                  if (err) {
                     console.log(err);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': vendorData});
                  }
               });
            } else if (type === 'productGrade') {
               query = "SELECT * FROM phone_grade_details";
               database.query(query, function (err, gradeData) {
                  if (err) {
                     console.log(err);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': gradeData});
                  }
               });
            } else if (type === 'serviceStock') {
               query = "SELECT * FROM service_stock_sold_details";
               database.query(query, function (err, serviceData) {
                  if (err) {
                     console.log(err);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': serviceData});
                  }
               });
            } else if (type === 'orderStatus') {
               query = "SELECT * FROM order_status_details";
               database.query(query, function (err, orderData) {
                  if (!err) {
                     callback(false, 200, {'res': orderData});
                  } else {
                     callback(err, 500, {'res': messages.errorMessage});
                  }
               });
            } else if (type === 'courier') {
               query = "SELECT * FROM courier_details";
               database.query(query, function (err, courierData) {
                  if (err) {
                     console.log(err);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': courierData});
                  }
               });
            } else if (type === 'sku') {
               query = "SELECT * FROM sku_master";
               database.query(query, function (err, skuData) {
                  if (err) {
                     console.log(err);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': skuData});
                  }
               });
            } else if (type === 'serviceCenter') {
               query = "SELECT * FROM service_center_details";
               database.query(query, function (err, serviceCenterData) {
                  if (err) {
                     console.log(err);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': serviceCenterData});
                  }
               });
            } else if (type === 'services') {
               query = "SELECT i.*,s.service_center FROM diagnostic_app.inventory i," +
                  " service_center_details s " +
                  "WHERE s.id=i.service_center AND i.service_center <> 2 " +
                  "AND i.service_stock=3";
               database.query(query, (err, serviceData) => {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': serviceData});
                  }
               });
            } else if (type === 'service') {
               query = "SELECT i.*,s.service_center FROM diagnostic_app.inventory i," +
                  " service_center_details s " +
                  "WHERE s.id=i.service_center  " +
                  "AND i.service_stock=3";
               database.query(query, (err, serviceData) => {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': serviceData});
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
 * Method to Upload, generate and verify the fingerprint data for employee.
 * @param data
 * @param callback: The Method callback.
 */
handlers.bioAuth = function (data, callback) {
   helpers.validateToken(data.queryString.key, valid => {
      if (!valid) {
         callback(true, 403, {'res': 'Token expired or invalid'});
         console.log('error token invalid');
         return
      }

      if (data.method === 'put') {
         let id = data.queryString.id;

         if (data.queryString.type === 'enroll') {
            let offsets = data.queryString.offsets;

            if (!id || !offsets) {
               callback(true, 400, {'res': 'insuccfient data'});
               console.log('error no id or offsets');
               return
            }

            let fp_data_raw = data.data;

            offsets = JSON.parse(offsets);

            if (Object.values(offsets).some(isNaN)) {
               callback(true, 400, {'res': 'invalid offset data'});
               console.log('error invalid offsets');
               return
            }

            finger_names.forEach(n => {
               if (!Object.keys(offsets).includes(n)) {
                  callback(true, 400, {'res': `fingerprint not found: ${n}`});
                  console.log(`error fingerprint not found: ${n}`);

               }
            });

            offsets = Object.keys(offsets).map((key) => {
               const x = {};

               x.key = key;
               x.value = offsets[key];

               return x
            }).sort((a, b) => a.value - b.value);

            fp_json[id] = {};

            try {
               for (let i = 0; i < offsets.length; i++) {
                  let off = offsets[i].value;

                  let end = (i === offsets.length - 1) ? fp_data_raw.byteLength : offsets[i + 1].value - 1;

                  if (off > fp_data_raw.length || end > fp_data_raw.length) {
                     callback(true, 400, {'res': 'invalid offset data'});
                     console.log('error invalid offsets');
                     return
                  }

                  let fpd = fp_data_raw.slice(off, end);
                  let filename = `${id}_${offsets[i].key}.png`;

                  let fpT = new FingerprintTemplate().dpiSync(500).createSync(java.newArray("byte", Array.prototype.slice.call(fpd)));

                  fp_json[id][offsets[i].key] = fpT.serializeSync();

                  let params = {Bucket: messages.bucketName, Key: filename, Body: fpd};

                  const upromise = S3.putObject(params).promise();
                  upromise.then(d => {
                     console.log("Successfully uploaded data to " + messages.bucketName + "/" + filename)
                  }).catch(e => {
                     console.log("Error uploading data: " + messages.bucketName + "/" + filename);
                     console.err(e, e.stack)
                  })
               }

               fs.writeFile(fp_json_file_name, JSON.stringify(fp_json, null, 2), err => {
                  if (err) return console.log(err)
               });

               callback(false, 200, {'res': 'successfully inserted fingerprint into database'});

            } catch (error) {
               console.log(error);
               callback(true, 400, {'res': 'invalid fingerprint'});
               console.log('error invalid fp');

            }
         } else if (data.queryString.type === 'check') {
            if (!id) {
               callback(true, 400, {'res': messages.insufficientData});
               console.log('error no id or offsets');
               return
            }

            let fp_id = fp_json[id];

            if (fp_id && fp_id.length < /* != */ 4) {
               fp_id = null
            }

            if (fp_id) {
               finger_names.forEach(x => {
                  if (!Object.keys(fp_id).includes(x)) {
                     fp_id = null;

                  }
               })
            }

            if (fp_id) {
               callback(false, 200, {res: fp_id})
            } else {
               callback(false, 200, {res: {}})
            }

         } else {
            callback(true, 400, {'res': 'invalid type'});
            console.log('error invalid type')
         }
      } else if (data.method === 'post') {
         if (!data.queryString.type) {
            callback(true, 400, {'res': messages.insufficientData});
            console.log('error no type');
            return
         }

         let fp_probe = new FingerprintTemplate();

         try {
            fp_probe = fp_probe.dpiSync(500).createSync(java.newArray("byte", Array.prototype.slice.call(data.data, 0)))
         } catch (err) {
            callback(true, 400, {'res': 'invalid fingerprint'});
            console.log('error invalid fp');
            console.error(err, err.stack);
            return
         }
         if (!fp_probe) {
            callback(true, 400, {'res': 'invalid fingerprint'});
            console.log('error invalid fp');
            return
         }

         if (data.queryString.type === 'generate') {
            callback(false, 200, {res: fp_probe.serializeSync()})
         } else if (data.queryString.type === 'verify') {
            let finger = data.queryString.finger;
            let fingerParam = finger;
            let matcher = new FingerprintMatcher().indexSync(fp_probe);

            let high = 0;
            let match = null;

            matchFinger = (f, fps, id) => {
               let fp = fps[f];
               let fp_template = new FingerprintTemplate().deserializeSync(fp);

               let score = matcher.matchSync(fp_template);
               if (score > high) {
                  high = score;
                  match = id;
                  finger = f
               }
            };

            for (let id in fp_json) {
               let fps = fp_json[id];

               if (fingerParam) {
                  if (!finger_names.includes(finger) || !fps[finger]) {
                     callback(true, 400, {'res': 'invalid finger specified'});
                     console.log('error invalid finger');
                     return
                  }
                  matchFinger(finger, fps, id);
                  continue;
               }

               for (let f in fps) {
                  matchFinger(f, fps, id)
               }
            }

            callback(false, 200, {res: high, match, finger})
         } else {
            callback(true, 400, {'res': 'invalid type'});
            console.log('error invalid type')
         }
      } else {
         callback(true, 400, {'res': 'invalid request method'});
         console.log('error invalid method')
      }
   });
};
/**
 * Method to update the Firebase token.
 * @param dataObject: The Request Object.
 * @param callback: The method callback.
 */
handlers.firebaseToken = function (dataObject, callback) {
   if (dataObject.method === 'put') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            const token = typeof (dataObject.postData.token) === 'string' &&
            dataObject.postData.token.length > 10 ? dataObject.postData.token : false;
            const employeeid = typeof (dataObject.postData.id) === 'string' &&
            dataObject.postData.id.length > 0 ? dataObject.postData.id : false;
            if (employeeid && token) {
               const query = "UPDATE employee_details SET device_token = '" + token + "' WHERE id= " + employeeid;
               database.query(query, function (err, updateData) {
                  if (err) {
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': true});
                  }
               });
            }
         } else {
            callback(true, 400, {'res': messages.insufficientData});
         }
      });
   } else {
      callback(true, 400, {'res': messages.invalidRequestMessage})
   }
};
/**
 * Method to get the permitted version for a package name.
 * @param dataObject: The Data Object.
 * @param callback: The Method callback.
 */
handlers.permittedVersions = function (dataObject, callback) {
   helpers.validateToken(dataObject.queryString.key, function (isValid) {
      if (isValid) {
         if (dataObject.method === 'post') {
            const packageName = typeof (dataObject.postData.package) === 'string' &&
            dataObject.postData.package.length > 0 ? dataObject.postData.package : false;
            const version = dataObject.postData.version > 0 ? dataObject.postData.version : false;
            if (packageName && version) {
               const query = "SELECT * FROM permitted_versions WHERE package_name LIKE '" + packageName + "'";
               database.query(query, function (err, versionData) {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     if (version >= versionData[0].version) {
                        callback(false, 200, {'res': true});
                     } else {
                        callback(false, 200, {'res': false});
                     }
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else if (dataObject.method === 'get') {
            const query = "SELECT * FROM permitted_versions";
            database.query(query, (err, versionData) => {
               if (err) {
                  console.error(err.stack);
                  callback(err, 500, {'res': messages.errorMessage});
               } else {
                  callback(false, 200, {'res': versionData});
               }
            });
         } else if (dataObject.method === 'put') {
            callback(false, 200, {'res': "https://www.hyperxchange.com/about-hx-store"});
         } else {
            callback(true, 400, {'res': messages.invalidRequestMessage});
         }
      } else {
         callback(true, 403, {'res': messages.tokenExpiredMessage});
      }
   });
};
/**
 *  GET Method to generate the Serial Number and also to get the details of the current phone.
 *  POST Method to get the QR codes for order status shipped.
 *  PUT Method to update the status of the QR code based on condition.
 * @param dataObject: The Data object.
 * @param callback: The method callback.
 */
handlers.qr = function (dataObject, callback) {
   helpers.validateToken(dataObject.queryString.key, function (isValid) {
      if (isValid) {
         if (dataObject.method === 'get') {
            let num, id, query;
            try {
               num = Number(dataObject.queryString.num);
            } catch (e) {
               num = false;
            }
            if (num) {
               query = "SELECT max(id) as id FROM phone_details_qr";
               database.query(query, function (err, maxData) {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     let start = maxData[0].id;
                     query = "INSERT INTO phone_details_qr VALUES (" + Number(start + 1) + ",'','7','14')";
                     console.log(start);
                     console.log(num);
                     for (let i = start + 2; i <= (start + num); i++) {
                        query += ",";
                        query += "(" + i + ",'','7','14')";
                     }
                     query += ";";
                     console.log(query);
                     database.query(query, function (err, insertData) {
                        if (err) {
                           console.error(err.stack);
                           callback(err, 500, {'res': messages.errorMessage});
                        } else {
                           callback(false, 200, {'res': start + 1});
                        }
                     })
                  }
               });
            } else {
               id = Number(dataObject.queryString.id);
               const security = Number(dataObject.queryString.security) === 0 ? dataObject.queryString.security : false;
               query = "SELECT * FROM phone_details_qr WHERE id = " + id;
               console.log(query);
               database.query(query, function (err, qrData) {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     if (!security) {
                        if (qrData[0].phone_status === 7) {
                           callback(false, 200, {'res': false, 'msg': messages.notAssigned});
                        } else if (qrData[0].phone_status === 4 && qrData[0].imei.length < 0) {
                           callback(false, 200, {'res': false, 'msg': messages.imeiNotLinked});
                        } else if (qrData[0].imei.length > 0) {
                           //query = "SELECT * FROM inventory WHERE product_imei_1 LIKE '" + qrData[0].imei + "'";
                           query = "SELECT * FROM inventory i, phone_details p WHERE i.product_imei_1 LIKE '" +
                              qrData[0].imei + "' AND p.imei=i.product_imei_1";
                           console.log(query);
                           database.query(query, function (err, selectData) {
                              if (err) {
                                 console.error(err.stack);
                                 callback(err, 500, {'res': messages.errorMessage});
                              } else {
                                 query = "SELECT * FROM order_details" +
                                    " WHERE imei_number LIKE '" + qrData[0].imei + "' AND order_status <> 8 " +
                                    "AND order_status <> 12 AND order_status <>5";
                                 database.query(query, (err, orderData) => {
                                    if (err) {
                                       console.error(err.stack);
                                       callback(err, 500, {'res': messages.errorMessage});
                                    } else {
                                       callback(false, 200, {
                                          'res': true,
                                          'msg': selectData,
                                          'order': orderData
                                       });
                                    }
                                 });
                              }
                           });
                        }
                     } else {
                        query = "SELECT * FROM order_details WHERE imei_number LIKE '" + qrData[0].imei +
                           "' AND order_status = 4";
                        database.query(query, (err, orderData) => {
                           if (err) {
                              console.error(err.stack);
                              callback(err, 500, {'res': messages.errorMessage});
                           } else {
                              if (orderData.length > 0) {
                                 callback(false, 200, {'res': true, 'msg': orderData, 'isPos': false});
                                 updateOrderStatus(orderData[0].hx_order_id);
                                 helpers.logOrder(orderData[0].channel_order_id, orderData[0].order_status,
                                    orderData[0].imei_number, "AUTH");
                              } else {
                                 //callback(false, 200, {'res': false, 'msg': orderData,'isPos':false});
                                 query = "SELECT * FROM inventory WHERE is_video_taken = 1 and product_imei_1 LIKE '" + qrData[0].imei + "'";
                                 database.query(query, (err, inventoryData) => {
                                    if (err) {
                                       console.error(err.stack);
                                       callback(err, 500, {'res': messages.errorMessage});
                                    } else {
                                       if (inventoryData.length > 0) {
                                          if (inventoryData[0].service_stock === 12 || inventoryData[0].service_stock === 17
                                             || inventoryData[0].service_stock === 19 || inventoryData[0].service_stock === 21
                                             || inventoryData[0].service_stock === 23) {
                                             callback(false, 200, {'res': true, 'isPos': true});
                                             updateInventory(inventoryData[0].product_imei_1, ((inventoryData[0].service_stock) + 1));
                                             helpers.logOrder("POS ORDER", 1,
                                                qrData[0].imei, "AUTH");
                                          } else {
                                             callback(false, 200, {'res': false, 'isPos': true});
                                          }
                                       } else {
                                          callback(false, 200, {'res': false, 'isPos': true});

                                       }
                                    }
                                 });
                              }
                           }
                        });
                     }
                  }
               });

            }
         } else if (dataObject.method === 'put') {
            let query = "";
            console.log(dataObject.postData);
            const type = typeof (dataObject.postData.type) === 'string' &&
            dataObject.postData.type.length > 0 ? dataObject.postData.type.trim() : false;
            const id = dataObject.postData.id > 0 ? dataObject.postData.id : false;
            const imei = typeof (dataObject.postData.imei) === 'string' ? dataObject.postData.imei : false;
            const serviceCenter = Number(dataObject.postData.service_center) > 0 ? dataObject.postData.service_center : false;
            console.log(serviceCenter);
            if (type && type === 'New') {
               query = "SELECT * FROM phone_details_qr WHERE id = " + id;
               database.query(query, function (err, selectData) {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     if (Number(selectData[0].phone_status) === 7) {
                        query = "UPDATE phone_details_qr SET phone_status = 4 WHERE id = " + id;
                        database.query(query, function (err, updateData) {
                           if (err) {
                              console.error(err.stack);
                              callback(err, 500, {'res': messages.errorMessage});
                           } else {
                              callback(false, 200, {'res': true});
                           }
                        });
                     } else {
                        callback(false, 202, {'res': false});
                     }
                  }
               });
            } else if (type && type === 'imei') {
               if (imei.length < 10 || imei === false) {
                  query = "SELECT * FROM phone_details_qr WHERE id = '" + imei + "'";
                  console.log(query);
                  database.query(query, (err, qrData) => {
                     if (err) {
                        console.error(err.stack);
                        callback(err, 500, {'res': messages.errorMessage});
                     } else {
                        console.log(qrData);
                        query = "UPDATE phone_details_qr SET imei = '" + qrData[0].imei +
                           "',phone_status = 4 WHERE id = " + id + " AND phone_status = 4 OR phone_status=14";
                        console.log(query);
                        database.query(query, (err, updateData) => {
                           if (err) {
                              console.error(err, 500, {'res': messages.errorMessage});
                           } else {
                              callback(false, 200, {'res': true});
                           }
                        })
                     }
                  });
               } else {
                  query = "UPDATE phone_details_qr SET imei = '" + imei + "', phone_status = 4 " +
                     "WHERE id = " + id + " AND (phone_status = 4 OR phone_status=14)";
                  console.log(query);
                  database.query(query, function (err, updateData) {
                     if (err) {
                        console.error(err.stack);
                        callback(err, 500, {'res': messages.errorMessage});
                     } else {
                        if (updateData.affectedRows > 0) {
                           callback(false, 200, {'res': true});
                        } else {
                           callback(false, 202, {'res': false});
                        }
                     }
                  });
               }
            } else if (type && type === 'service') {
               query = "SELECT * FROM phone_details_qr WHERE id = " + id;
               database.query(query, function (err, selectData) {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     let query = "SELECT * FROM inventory WHERE product_imei_1 LIKE '" + selectData[0].imei + "'";
                     database.query(query, (err, inventoryData) => {
                        if (err) {
                           console.error(err.stack);
                           callback(err, 500, {'res': messages.errorMessage});
                        } else {
                           if (inventoryData[0].service_stock === 3) {
                              query = "INSERT INTO service_center (imei, service_center, `current_time`,`current_status`) " +
                                 "VALUES('" + selectData[0].imei + "'," + serviceCenter + ",NOW(),'out')";
                              database.query(query, function (err, insertData) {
                                 if (err) {
                                    console.error(err.stack);
                                    callback(err, 500, {'res': messages.errorMessage});
                                 } else {
                                    callback(false, 200, {'res': true});
                                 }
                              });
                           } else {
                              callback(true, 202, {'res': false, 'msg': 'Not Authorized'});
                           }
                        }
                     });
                  }
               });
            } else if (type && type === 'return') {
               query = "SELECT * FROM phone_details_qr WHERE id=" + id;
               database.query(query, (err, qrData) => {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     query = "UPDATE inventory SET service_stock =2 WHERE product_imei_1 = '" + qrData[0].imei + "'";
                     database.query(query, (err, updateData) => {
                        if (err) {
                           console.error(err.stack);
                           callback(err, 400, {'res': messages.errorMessage});
                        } else {
                           callback(false, 200, {'res': true});
                           updateOrderAndPhoneDetails(qrData[0].imei);
                        }
                     });
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else if (dataObject.method === 'post') {
            let query = "";
            const type = typeof (dataObject.postData.type) === 'string' &&
            dataObject.postData.type.length > 0 ? dataObject.postData.type.trim() : false;
            const id = dataObject.postData.id.length > 0 ? dataObject.postData.id : false;
            if (type === 'Shipping') {
               query = "SELECT * FROM phone_details_qr WHERE id = " + id + " AND order_status = 5";
               database.query(query, function (err, queryData) {
                  if (err) {
                     callback(err, 500, {'res': messages.errorMessage});
                     console.error(err.stack);
                  } else {
                     if (queryData.length > 0) {
                        callback(false, 200, {'res': true});
                     } else {
                        callback(false, 200, {'res': false});
                     }
                  }
               });
            } else if (type === 'sell') {
               const qrId = Number(dataObject.postData.id) > 0 ? dataObject.postData.id : false;
               let query = "SELECT * FROM phone_details_qr WHERE id = " + qrId;
               const serviceStockId = Number(dataObject.postData.service_id) > 0 ?
                  dataObject.postData.service_id : false;
               database.query(query, (err, qrData) => {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     if (serviceStockId) {
                        query = "UPDATE inventory SET service_stock= " + serviceStockId +
                           " WHERE product_imei_1 = '" + qrData[0].imei + "'";
                        database.query(query, (err, updateData) => {
                           if (err) {
                              console.error(err.stack);
                              callback(err, 500, {'res': messages.errorMessage});
                           } else {
                              updatePhoneDetails(qrData[0].imei, serviceStockId);
                              callback(false, 200, {'res': true});
                           }
                        });
                     } else {
                        callback(true, 400, {'res': messages.insufficientData});
                     }
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else {
            callback(true, 400, {'res': messages.invalidRequestMessage});
         }
      } else {
         callback(true, 403, {'res': messages.tokenExpiredMessage});
      }
   });

   /**
    * Method to update the Order status as Shipped once the security Scans it.
    * @param hxOrderId: The Order ID to be updated.
    */
   function updateOrderStatus(hxOrderId) {
      const query = "UPDATE order_details SET order_status=5 WHERE hx_order_id = " + hxOrderId;
      database.query(query, (err, result) => {
         if (err) {
            console.error(err.stack);
         } else {
            console.log("Order Status Updated as Shipped By security.");
         }
      });
   }

   /**
    * Method to update the Phone details and order status.
    * @param imei: The Imei number.
    */
   function updateOrderAndPhoneDetails(imei) {
      let query = "UPDATE order_details SET order_status=8 WHERE imei_number ='" + imei + "' AND order_status in (4,5,10,11,3)";
      database.query(query, (err, updateOrderData) => {
         if (err) {
            console.error(err.stack);
         } else {
            query = "UPDATE phone_details SET status = 2 WHERE imei = '" + imei + "'";
            database.query(query, (err, phoneUpdateData) => {
               if (err) {
                  console.error(err.stack);
               } else {
                  console.log('Updated Order and phone data.');
               }
            });
         }
      });
      query = "SELECT * FROM order_details WHERE imei_number = '" + imei + "' AND order_status =5";
      database.query(query, (err, orderData) => {
         if (err) {
            console.error(err.stack);
         } else {
            query = "UPDATE order_status_log SET is_shipped = 0 WHERE channel_order_id = '" + orderData[0].channel_order_id + "'";
            database.query(query, (err, updateOrder) => {
               if (err) {
                  console.error(err.stack);
               }
               console.log('Updated');
            });
         }
      });
   }

   /**
    * Method to update the Phone details.
    * @param imei: The Imei number of the device.
    * @param status
    */
   function updatePhoneDetails(imei, status) {
      const query = "UPDATE phone_details SET status = " + status + " WHERE imei LIKE '" + imei + "'";
      database.query(query, (err, updateData) => {
         if (err) {
            console.error(err.stack);
         } else {
            console.log("Phone details Updated.");
         }
      })
   }

   /**
    * Method to update the Inventory.
    * @param imei: The imei.
    * @param status: The status.
    */
   function updateInventory(imei, status) {
      const query = "UPDATE inventory SET service_stock = " + status + " WHERE product_imei_1 LIKE '" + imei + "'";
      database.query(query, (err, updateData) => {
         if (err) {
            console.error(err.stack);
         } else {
            console.log('Inventory updated to', status);
         }
      });
   }
};
/**
 * Method to deactivate the QR Code.
 * @param dataObject: The Request Object.
 * @param callback: the Method callback.
 */
handlers.qrDeactivate = function (dataObject, callback) {
   if (dataObject.method === 'get') {
      helpers.validateToken(dataObject.queryString.key, function (isValid) {
         if (isValid) {
            const id = Number(dataObject.queryString.id) > 0 ? dataObject.queryString.id : false;
            if (id) {
               let query = "SELECT * FROM phone_details_qr WHERE id = " + id + " AND phone_status <> 14";
               database.query(query, (err, qrData) => {
                  if (err) {
                     console.error(err.stack);
                  } else {
                     if (qrData.length > 0) {
                        query = "UPDATE phone_details_qr SET phone_status = 7, order_status=14 , imei = ''" +
                           " WHERE id = '" + qrData[0].id + "'";
                        database.query(query, (err, updateData) => {
                           if (err) {
                              console.error(err.stack);
                              callback(err, 500, {'res': messages.errorMessage});
                           } else {
                              callback(false, 200, {'res': true});
                           }
                        });
                     } else {
                        callback(false, 202, {'res': false});
                     }
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else {
            callback(true, 403, {'res': messages.tokenExpiredMessage});
         }
      });
   }
};
/**
 * Method to notify and Log breach Orders.
 * GET to log service or Order return products.
 * @param dataObject: The Request object.
 * @param callback: The Method callback.
 */
handlers.qrSecurity = function (dataObject, callback) {
   helpers.validateToken(dataObject.queryString.key, (isValid) => {
      if (isValid) {
         if (dataObject.method === 'post') {
            const qrID = Number(dataObject.postData.qr) > 0 ? dataObject.postData.qr : false;
            let query = "SELECT * FROM phone_details_qr WHERE id = " + qrID;
            database.query(query, (err, qrData) => {
               if (err) {
                  console.error(err.stack);
                  callback(err, 500, {'res': messages.errorMessage});
               } else {
                  query = "SELECT * FROM order_details " +
                     "WHERE imei_number LIKE '" + qrData[0].imei + "' AND order_status <> 8 AND order_status <> 12";
                  database.query(query, (err, orderData) => {
                     if (err) {
                        console.error(err.stack);
                        callback(err, 500, {'res': messages.errorMessage});
                     } else {
                        let auth;
                        if (orderData[0].order_status === 4) {
                           auth = "AUTH";
                        } else {
                           auth = "NOT_AUTH";
                           helpers.notifyBreachOrder(orderData[0].channel_order_id);
                        }
                        helpers.logOrder(orderData[0].channel_order_id,
                           orderData[0].order_status, orderData[0].imei_number, auth);
                        updateOrderStatus(orderData[0].hx_order_id);
                        callback(false, 200, {'res': true});
                     }
                  });
               }
            });
         } else if (dataObject.method === 'get') {
            const qrId = Number(dataObject.queryString.id) > 0 ? dataObject.queryString.id : false;
            const type = typeof (dataObject.queryString.type) === 'string' ? dataObject.queryString.type : false;
            if (qrId && type) {
               let promise;
               switch (type) {
                  case "order":
                     promise = helpers.updateReturnPhoneStatus(qrId, true);
                     break;
                  case "service":
                     promise = helpers.updateReturnPhoneStatus(qrId, false);
                     break;
               }
               promise.then(err => {
                  callback(false, 200, {'res': true});
               }).catch(err => {
                  callback(err, 500, {'res': messages.errorMessage});
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         }
      } else {
         callback(true, 403, {'res': messages.tokenExpiredMessage});
      }
   });

   /**
    * Method to update the Order status as Shipped once the security Scans it.
    * @param hxOrderId: The Order ID to be updated.
    */
   function updateOrderStatus(hxOrderId) {
      const query = "UPDATE order_details SET order_status=5 WHERE hx_order_id = " + hxOrderId;
      database.query(query, (err, result) => {
         if (err) {
            console.error(err.stack);
         } else {
            console.log("Order Status Updated as Shipped By security.");
         }
      });
   }
};
/**
 * Method to handle the meeting requests.
 * POST to get the avaiable Slots.
 * PUT to make the requests.
 * It stores the temp slots allocated to a temp table.
 * After the Request is Completed then it deletes the temp data.
 * GET to cancel the Request.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.meeting = function (dataObject, callback) {
   helpers.validateToken(dataObject.queryString.key, (isValid) => {
      if (isValid) {
         if (dataObject.method === 'get') {
            const requestID = typeof (dataObject.queryString.request_id) === 'string' ?
               dataObject.queryString.request_id : false;
            const empID = dataObject.queryString.employee_id > 0 ? dataObject.queryString.employee_id : false;
            console.log(empID);
            if (requestID) {
               deleteTemp(requestID);
               callback(false, 200, {'res': true});
            } else if (empID < 100) {
               const query = "SELECT m.*, r.room_name, s.slot_start_time,s.slot_end_time " +
                  "FROM meeting_request_details m,meeting_slot_details s ,meeting_room_details r " +
                  "WHERE m.employee_id=" + empID + " AND s.id=m.slot_id AND r.id=m.roomID";
               database.query(query, (err, meetingData) => {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': meetingData});
                  }
               });
            } else if (Number(empID) > Number(100)) {
               const timeDate = Math.floor((new Date().getTime()) / 1000);
               const formattedDate = (moment.unix(timeDate).tz('Asia/Kolkata').format(messages.dateFormat)).split(' ')[0];
               const query = "SELECT m.*,e.first_name FROM meeting_request_details m, employee_details e " +
                  "WHERE meeting_date LIKE '" + formattedDate + "' AND e.id=m.employee_id";
               database.query(query, (err, meetingData) => {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {'res': meetingData});
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else if (dataObject.method === 'post') {
            const room = typeof (dataObject.postData.room_name) === 'string' ? dataObject.postData.room_name : false;
            const meetingDate = typeof (dataObject.postData.start_date) === 'string' ? dataObject.postData.start_date : false;
            console.log(room, meetingDate);
            if (room && meetingDate) {
               const query = "SELECT * FROM meeting_slot_details " +
                  "WHERE id NOT IN (SELECT slot_id FROM " + room +
                  " WHERE meeting_date LIKE '" + meetingDate + "') " +
                  "AND id NOT IN (SELECT slot_id FROM meeting_temp_lock " +
                  "WHERE roomID = (SELECT id FROM meeting_room_details " +
                  "WHERE table_name LIKE '" + room + "'))";
               database.query(query, (err, slotData) => {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     const requestID = helpers.getRandomKey(16);
                     callback(false, 200, {'res': slotData, 'request_id': requestID});
                     insertTempLock(meetingDate, slotData, requestID, room);
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else if (dataObject.method === 'put') {
            const slot = typeof (dataObject.postData.slot_id) === 'string' ? dataObject.postData.slot_id : false;
            const room = typeof (dataObject.postData.room_name) === 'string' ? dataObject.postData.room_name : false;
            const meetingDate = typeof (dataObject.postData.start_date) === 'string' ? dataObject.postData.start_date : false;
            const requestID = typeof (dataObject.postData.request_id) === 'string' ? dataObject.postData.request_id : false;
            const empId = Number(dataObject.postData.employee_id) > 0 ? dataObject.postData.employee_id : false;
            if (slot && room && meetingDate && requestID && empId) {
               let slotIDs = slot.split(",");
               let values = "";
               for (let i = 0; i < slotIDs.length; i++) {
                  values += "(" + slotIDs[i] + ",'" + meetingDate + "'),";
               }
               values = values.substr(0, values.length - 1);
               let query = "INSERT INTO " + room + " VALUES " + values;
               console.log(query);
               database.query(query, (err, insertData) => {
                  if (err) {
                     console.error(err.stack);
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 201, {'res': true});
                     insertRequest(room, empId, requestID, slotIDs, meetingDate);
                     deleteTemp(requestID);
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         }
      } else {
         callback(true, 403, {'res': messages.tokenExpiredMessage});
      }
   });

   /**
    * Method to insert the booking request to the master request table.
    * @param room: the Room ID.
    * @param empID: the Employee Booking.
    * @param requestID: The Request ID.
    * @param slotIDs: The Slot ID.
    * @param meetingDate: The Meeting date.
    */
   function insertRequest(room, empID, requestID, slotIDs, meetingDate) {
      let value = "";
      let roomID;
      switch (room) {
         case "meeting_room_1":
            roomID = 1;
            break;
         case "meeting_room_2":
            roomID = 2;
            break;
         case "meeting_room_3":
            roomID = 3;
            break;
      }
      for (let i = 0; i < slotIDs.length; i++) {
         value += "('" + requestID + "'," + roomID + "," + empID + "," + slotIDs[i] + ",'" + meetingDate + "'),";
      }
      value = value.substr(0, value.length - 1);
      const query = "INSERT INTO meeting_request_details VALUES " + value;
      database.query(query, (err, insertData) => {
         if (err) {
            console.error(err.stack);
         } else {
            console.log("Meeting Booked. ");
         }
      });
   }

   /**
    * Method to delete the temp lock table.
    * @param requestID: The request Id.
    */
   function deleteTemp(requestID) {
      const query = "DELETE FROM meeting_temp_lock WHERE request_id LIKE '" + requestID + "'";
      database.query(query, (err, deleteData) => {
         if (err) {
            console.error(err.stack);
         } else {
            console.log("DELETED.");
         }
      });
   }

   /**
    * Method to insert the TEMP Lock table.
    * @param date: the date.
    * @param slotId: The Slot which are temporarily blocked.
    * @param requestId: the request ID.
    */
   function insertTempLock(date, slotId, requestId, room) {
      let values = "";
      let roomID;
      switch (room) {
         case "meeting_room_1":
            roomID = 1;
            break;
         case "meeting_room_2":
            roomID = 2;
            break;
         case "meeting_room_3":
            roomID = 3;
            break;
      }
      for (let i = 0; i < slotId.length; i++) {
         values += "('" + requestId + "','" + date + "'," + slotId[i].id + "," + roomID + "),";
      }
      values = values.substr(0, values.length - 1);
      const query = "INSERT INTO meeting_temp_lock VALUES " + values;
      database.query(query, function (err, insertData) {
         if (err) {
            console.error(err.stack);
         } else {
            console.log("Inserted into temp.")
         }
      });
   }
};
/**
 * Method to get the S3 URL for the neuro tags images.
 * @param dataObject: The request Object.
 * @param callback
 */
handlers.prokotags = function (dataObject, callback) {
   helpers.validateToken(dataObject.queryString.key, (isValid) => {
      if (isValid) {
         callback(false, 200, {'res': "https://s3.ap-south-1.amazonaws.com/neuro-tag/"});
      } else {
         callback(true, 403, {'res': messages.tokenExpiredMessage});
      }
   });
};
/**
 * Method to get the device name.
 * @param dataObject: the request object.
 * @param callback: the method callback.
 */
handlers.devNames = function (dataObject, callback) {
   helpers.validateToken(dataObject.queryString.key, (isValid) => {
      if (isValid) {
         if (dataObject.method === 'post') {
            const type = typeof (dataObject.postData.type) === 'string' ? dataObject.postData.type.toLowerCase() : false;
            const code = typeof (dataObject.postData.code) === 'string' ? dataObject.postData.code : false;
            const model = typeof (dataObject.postData.model) === 'string' ? dataObject.postData.model : false;
            if (type) {
               let promise;
               switch (type) {
                  case "ios": {
                     if (code && model) {
                        promise = helpers.getiOSDeviceName(model, code);
                     } else {
                        callback(true, 400, {'res': messages.insufficientData});
                     }
                     break;
                  }
                  case "android": {
                     if (code) {
                        promise = helpers.getAndroidDeviceName(code);
                     } else {
                        callback(true, 400, {'res': messages.insufficientData});
                     }
                     break;
                  }
                  default:
                     callback(true, 400, {'res': messages.invalidRequestMessage});
               }
               promise.then(response => {
                  callback(false, 200, {'res': response});
               }).catch(err => {
                  console.error(err);
                  callback(err, 500, {'res': err});
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else if (dataObject.method === 'put') {
            const {type, name, model, code, color} = dataObject.postData;
            if (type) {
               switch (type.toLowerCase()) {
                  case 'ios': {
                     if (!name || (!model && !code)) {
                        callback(true, 400, {'res': messages.insufficientData});
                        break;
                     }
                     let code_done = !code, model_done = !model;

                     if (code) {
                        // insert into ios_device_codes
                        let query = `INSERT INTO ios_device_codes VALUES (null,'${name}','${code}')`
                        database.query(query, (err, insertData) => {
                           if (err) {
                              console.error(err.stack);
                              callback(err, 500, {'res': messages.errorMessage});
                           } else {
                              code_done = true;

                              if (code_done && model_done) {
                                 callback(false, 200, {'res': true});
                              }
                           }
                        });
                     }

                     if (model) {
                        // insert into ios_device_names
                        let query = `INSERT INTO ios_device_names VALUES (null,'${name}','${model}'${color && `,'${color}'`})`;
                        database.query(query, (err, insertData) => {
                           if (err) {
                              console.error(err.stack);
                              callback(err, 500, {'res': messages.errorMessage});
                           } else {
                              model_done = true;

                              if (code_done && model_done) {
                                 callback(false, 200, {'res': true});
                              }
                           }
                        });
                     }
                     break;
                  }
                  case 'android': {
                     if (!name || !model || !code) {
                        callback(true, 400, {'res': messages.insufficientData});
                        break;
                     }

                     // insert into android_device_names
                     let query = `INSERT INTO android_device_names VALUES (null,'${name}','${model}','${code}')`

                     database.query(query, (err, insertData) => {
                        if (err) {
                           console.error(err.stack);
                           callback(err, 500, {'res': messages.errorMessage});
                        } else {
                           callback(false, 200, {'res': true});
                        }
                     });

                     break;
                  }
               }
            }
         } else {
            callback(true, 400, {'res': messages.invalidRequestMessage});
         }
      } else {
         callback(true, 403, {'res': messages.tokenExpiredMessage});
      }
   });
};
/**
 * method to read error log from apache2
 * @param dataObject
 * @param callback
 */
handlers.errorLog = function (dataObject, callback) {
   helpers.validateToken(dataObject.queryString.key, (isValid) => {
      if (isValid) {
         exec("sudo chmod 777 /var/log/apache2/error.log", (err, stdOut, stdErr) => {
            if (err) {
               console.error(err.stack);
            } else {
               console.log(`stdout: ${stdOut}`);
               if (dataObject.method === 'get') {
                  fs.readFile('/var/log/apache2/error.log', 'utf8',
                     (err, data) => {
                        if (err) {
                           console.error(err.stack);
                           callback(err, 500, {'res': messages.errorMessage});
                        } else {
                           callback(false, 200, {'res': data});
                        }
                     });
               }
            }
         });
      } else {
         callback(true, 403, {'res': messages.tokenExpiredMessage});
      }
   });
};
/**
 * Method to insert into PHONE DUMP for ELVIS STOCK MATCHING.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.fuckops = function (dataObject, callback) {
   helpers.validateToken(dataObject.queryString.key, (isValid) => {
      if (isValid) {
         if (dataObject.method === 'post') {
            const brand = typeof (dataObject.postData.brand) === 'string' &&
            dataObject.postData.brand.length > 0 ? dataObject.postData.brand : false;
            const model = typeof (dataObject.postData.model) === 'string' &&
            dataObject.postData.model.length > 0 ? dataObject.postData.model : false;
            const imei = typeof (dataObject.postData.imei) === 'string' &&
            dataObject.postData.imei.length > 10 ? dataObject.postData.imei : false;
            const storage = Number(dataObject.postData.storage) > 0 ? dataObject.postData.storage : false;
            const color = typeof (dataObject.postData.color) === 'string' &&
            dataObject.postData.color.length > 0 ? dataObject.postData.color : "NA";
            if (brand && model && imei) {
               const timeDate = Math.floor((new Date().getTime()) / 1000);
               const formattedDate = (moment.unix(timeDate).tz('Asia/Kolkata').format(messages.dateFormat));
               const query = "INSERT INTO phone_dump VALUES ('" + brand + "','"
                  + model + "','" + imei + "'," + storage + ",'" + color + "','" +
                  formattedDate + "','" + timeDate + "')";
               database.query(query, (err, insertData) => {
                  if (err) {
                     callback(err, 200, {'res': false});
                  } else {
                     callback(false, 200, {'res': true});
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else {
            callback(true, 400, {'res': messages.invalidRequestMessage});
         }
      } else {
         callback(true, 403, {'res': messages.tokenExpiredMessage});
      }
   });
};
/**
 * Method to get the details for the next board meeting.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.boardMeeting = (dataObject, callback) => {
   helpers.validateToken(dataObject.queryString.key, (isValid) => {
      if (isValid) {
         if (dataObject.method === 'get') {
            // const query = `SELECT d.*,e.* FROM board_meeting_details d, board_meeting_entries e WHERE d.id=e.entry_id AND d.meeting_date LIKE ${dataObject.queryString.meeting_date}`;
            // get details for attendees
            let query = `SELECT * FROM board_meeting_details WHERE meeting_date LIKE '${dataObject.queryString.meeting_date}'`;
            database.query(query, (err, board_meeting_data) => {
               if (err) {
                  console.error(err.stack);
                  callback(err, 500, {'res': messages.errorMessage});
               } else {
                  // callback(true, 200, { res: board_meeting_data });
                  if (board_meeting_data.length === 0) {
                     callback(true, 200, {res: {attendees: 0, details: []}});
                  }
                  let details = [];
                  board_meeting_data.forEach(x => {
                     query = `SELECT * FROM board_meeting_entries WHERE entry_id LIKE '${x.id}'`;
                     database.query(query, (err, board_meeting_entries) => {
                        if (err) {
                           console.error(err.stack);
                           callback(err, 500, {'res': messages.errorMessage});
                        } else {
                           x.entries = board_meeting_entries;
                           details.push(x);
                           if (details.length === board_meeting_data.length) {
                              callback(true, 200, {res: {attendees: details.length, details}});
                           }
                        }
                     });
                  })
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
 * Handler for Franchise.
 * @param dataObject: The request object.
 * @param callback: The method callback.
 */
handlers.franchise = (dataObject, callback) => {
   helpers.validateToken(dataObject.queryString.key, (isValid) => {
      if (isValid) {
         //TODO: Send the email after inserting and the body of the email would be in HTML.
         //TODO: use helpers.sendEmail method.
      } else {
         //TODO: Not Valid.
      }
   });
};
/**
 * Handler for sending email.
 * @param dataObject: The request Object.
 * @param callback: The method callback.
 */
handlers.email = (dataObject, callback) => {
   helpers.validateToken(dataObject.queryString.key, (isValid) => {
      if (isValid) {
         if (dataObject.method === 'post') {
            const targetAddress = typeof (dataObject.postData.email) === 'string' ? dataObject.postData.email : false;
            const subject = typeof (dataObject.postData.subject) === 'string' ? dataObject.postData.subject : false;
            const body = typeof (dataObject.postData.body) === 'string' ? dataObject.postData.body : false;
            if (targetAddress && subject && body) {
               helpers.sendEmail(targetAddress, subject, body).then(() => {
                  callback(false, 200, {'res': true});
               }).catch(err => {
                  callback(true, 500, {'res': messages.errorMessage});
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else {
            callback(true, 400, {'res': messages.invalidRequestMessage});
         }
      } else {
         callback(true, 403, {'res': messages.tokenExpiredMessage});
      }
   });
};
/**
 * Method to get the All the Service Requester Details.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.serviceRequester = (dataObject, callback) => {
   helpers.validateToken(dataObject.queryString.key, isValid => {
      if (dataObject.method === 'get') {
         if (isValid) {
            const id = typeof (dataObject.queryString.id) === 'string' &&
            dataObject.queryString.id.length > 0 ? dataObject.queryString.id : false;
            let query;
            if (id) {
               query = "SELECT * FROM service_requester_details WHERE id = " + id;
            } else {
               query = "SELECT * FROM service_requester_details";
            }
            database.query(query, (err, data) => {
               if (err) {
                  callback(err, 500, {'res': messages.errorMessage});
               } else {
                  const requester = [];
                  for (let i = 0; i < data.length; i++) {
                     requester.push(data[i]);
                  }
                  const response = {
                     'res': requester
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
 * Method to get the service request details for specific id.
 * @param dataObject: The Request Object.
 * @param callback: The Method callback.
 */
handlers.serviceRequest = (dataObject, callback) => {
   helpers.validateToken(dataObject.queryString.key, isValid => {
      if (isValid) {
         let query;
         if (dataObject.method === 'get') {
            const id = typeof (dataObject.queryString.id) === 'string' &&
            dataObject.queryString.id.length > 0 ? dataObject.queryString.id : false;

            const model_name = typeof (dataObject.queryString.model_name) === 'string' &&
            dataObject.queryString.model_name.length > 0 ? dataObject.queryString.model_name : false;

            if (id) {
               query = "SELECT * FROM service_requester_details WHERE id = " + id + " LIMIT 1";
               database.query(query, (err, data) => {
                  if (err || !data.length) {
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     const requester = data[0];
                     query = `SELECT * from service_request${id || model_name ? ` WHERE ` : ''}${!requester.employee_id ? `service_center_id = ${id}${model_name ? ` AND ` : ''}` : ''}${model_name ? `imei IN (SELECT product_imei_1 FROM inventory WHERE model_name like '${model_name}')` : ''}`;
                     database.query(query, (err, data) => {
                        const fetchIssues = r_id => new Promise((resolve, reject) => {
                           query = `SELECT * from service_issues WHERE request_id = '${x.id}'`;
                           database.query(query, (err, data) => {
                              if (err) {
                                 reject(err);
                              } else {
                                 resolve(data);
                              }
                           });
                        });
                        if (err) {
                           callback(err, 500, {'res': messages.errorMessage});
                        } else {
                           const requests = data;
                           Promise.all(data.map(x => fetchIssues(x.id))).then(datas => {
                              for (let i = 0; i < datas.length; i++) {
                                 requests[i].issues = datas[i];
                              }

                              callback(false, 200, requests);
                           }).catch(err => {
                              callback(err, 500, {'res': messages.errorMessage});
                           });
                        }
                     });
                  }
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else if (dataObject.method === 'post') {
            const timestamp = (moment.unix(timeDate).tz('Asia/Kolkata').format(messages.dateFormat)).split(' ');
            const {id, imei, requester_id, service_center_id, request_status, issues} = dataObject.postData;

            const updateIssue = issue => new Promise((resolve, reject) => {
               query =
                  `UPDATE service_issues SET
                  request_id=${issue.request_id},
                  issue_details=${issue.issue_details},
                  repair_cost=${issue.repair_cost},
                  issue_status=${issue.issue_status},
                  requester_id=${issue.requester_id},
                  timestamp=${timestamp}`;
               database.query(query, (err, data) => {
                  if (err) {
                     console.log(err);
                     reject(err);
                  } else {
                     resolve(data);
                  }
               });
            });

            const updateIssues = (issues, r_id) => {
               query = "SELECT * from service_issues WHERE request_id = " + id;
               database.query(query, (err, data) => {
                  if (data && data.length) {
                     const issuesToBeCreated = [];
                     const issuesToBeUpdatedPromises = [];
                     for (let i = 0; i < issues.length; i++) {
                        const oldIssues = issues[i].id ? data.filter(x => x.id === issues[i].id) : [];
                        if (oldIssues.length) {
                           if (!helpers.isEquivalent(oldIssues[0], issues[i])) {
                              issuesToBeUpdatedPromises.push(updateIssue(issues[i]));
                           }
                        } else {
                           issuesToBeCreated.push(issues[i]);
                        }
                     }

                     if (issuesToBeUpdatedPromises.length) {
                        Promise.all(issuesToBeUpdatedPromises).then(x => {
                        }).catch(err => {
                           callback(err, 500, {'res': messages.errorMessage});
                        })
                     }

                     if (issuesToBeCreated.length) {
                        createIssues(issuesToBeCreated, r_id);
                     } else {
                        callback(false, 200, {res: true});
                     }
                  } else {
                     createIssues(issues, r_id);
                  }
               });
            };

            const createIssues = (iss, r_id) => {
               query = `INSERT INTO service_issues(id,request_id,issue_details,repair_cost,issue_status,requester_id,timestamp)
                VALUES ${iss.map(i => `('','${r_id}','${i.issue_details}','${i.repair_cost}','${i.issue_status}','${i.requester_id}','${timestamp}')`).join(',')}`;
               database.query(query, (err, data) => {
                  if (err) {
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     callback(false, 200, {res: true});
                  }
               });
            };

            const createRequest = () => {
               query = `INSERT INTO service_request(id,imei,requester_id,timestamp,request_status,service_center_id)
                VALUES('','${imei}','${requester_id}','${timestamp}','${request_status}','${service_center_id}')`;
               database.query(query, (err, data) => {
                  if (err) {
                     callback(err, 500, {'res': messages.errorMessage});
                  } else {
                     createIssues(issues, data.insertId);
                  }
               });
            };

            const updateRequest = request => {
               if (!helpers.isEquivalent({...dataObject.postData, issues: null}, {...request, issues: null})) {
                  // update the request actually
                  query =
                     `UPDATE service_request 
                     SET imei=${imei},
                     requester_id=${requester_id},
                     timestamp=${request.timestamp || timestamp},
                     request_status=${request_status},
                     service_center_id=${service_center_id}
                     WHERE id=${id}`;
                  database.query(query, (err, data) => {
                     if (err) {
                        callback(err, 500, {'res': messages.errorMessage});
                     } else {
                        updateIssues(issues, request.id);
                     }
                  });
               } else {
                  updateIssues(issues, request.id);
               }
            };

            if (imei && requester_id && request_status && service_center_id && issues && issues.length) {
               if (id) {
                  // update table row
                  query = "SELECT * from service_request WHERE id = " + id;
                  database.query(query, (err, data) => {
                     if (err) {
                        callback(err, 500, {'res': messages.errorMessage});
                     } else {
                        if (data.length) {
                           const request = data[0];
                           updateRequest(request);
                        } else {
                           createRequest();
                        }
                     }
                  });
               } else {
                  createRequest();
               }
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else {
            callback(true, 400, {'res': messages.invalidRequestMessage});
         }
      } else {
         callback(false, 403, {'res': messages.tokenExpiredMessage});
      }
   });
};

/**
 * Handler for sending email FOR NDA.
 * @param dataObject: The request Object.
 * @param callback: The method callback.
 */
handlers.ndaEmail = (dataObject, callback) => {
   helpers.validateToken(dataObject.queryString.key, (isValid) => {
      if (isValid) {
         if (dataObject.method === 'post') {
            const target = typeof (dataObject.postData.email) === 'string' ? dataObject.postData.email : false;
            const vName = typeof (dataObject.postData.name) === 'string' ? dataObject.postData.name : false;
            const company = typeof (dataObject.postData.company) === 'string' ? dataObject.postData.company : false;
            const sign = typeof (dataObject.postData.sign) === 'string' ? dataObject.postData.sign : false;
            if (target && vName && company) {
               const pdf = helpers.generatePDF(vName, company, sign, moment().tz('Asia/Kolkata').format("DD/MM/YYYY"));
               helpers.sendEmail(target,
                  messages.NDA_SUBJECT,
                  messages.NDA_EMAIL_BODY,
                  'dipanjan@hyperxchange.com',
                  [{
                     filename: `NDA_${vName.replace(' ', '_')}_${moment().tz('Asia/Kolkata').format("DD_MM_YYYY")}.pdf`,
                     content: pdf,
                  }]
               ).then(done => {
                  if (done) {
                     callback(false, 200, {'res': true});
                  }
               }).catch(err => {
                  callback(true, 500, {'res': messages.errorMessage});
               });
            } else {
               callback(true, 400, {'res': messages.insufficientData});
            }
         } else {
            callback(true, 400, {'res': messages.invalidRequestMessage});
         }
      } else {
         callback(true, 403, {'res': messages.tokenExpiredMessage});
      }
   });
};
/**
 * Exporting the Handlers.
 */
module.exports = handlers;
