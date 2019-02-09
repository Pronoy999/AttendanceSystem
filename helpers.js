const helpers = {};
const database = require('./databaseHandler');
const moment = require('moment');
const tz = require('moment-timezone');
const messages = require('./Constants');
const snsLib = require('./snsLib');
const admin = require('firebase-admin');
/**
 * Method to parse JSON to Objects.
 * @param data
 * @returns {*}
 */
helpers.parseJsonToObjects = function (data) {
    let obj = {};
    try {
        obj = JSON.parse(data);
        return obj;
    } catch (e) {
        return {};
    }
};
/**
 * Method to validate the Token.
 * @param key: the Token.
 * @param callback: The Method callback.
 */
helpers.validateToken = function (key, callback) {
    try {
        key = typeof ('string') && key.trim().length === 16 ? key.trim() : false;
    } catch (e) {
        key = false;
    }
    if (key) {
        const query = "SELECT * FROM api_token WHERE token LIKE '" + key + "'";
        database.query(query, function (err, data) {
            if (err) {
                callback(false);
            } else {
                if (typeof (data[0]) !== 'undefined') {
                    if (Number(data[0].validity) === -1) {
                        callback(true);
                    } else if (data[0].token === key && Number(data[0].validity) > Date.now()) {
                        callback(true);
                    } else {
                        callback(false);
                    }
                } else {
                    callback(false);
                }
            }
        });
    } else {
        callback(false);
    }
};
/**
 * Method to insert new phones into the table.
 * @param data: The Data containing the phone details.
 * @param callback: The Method callback.
 */
helpers.insertNewPhone = function (data, callback) {
    const manufacturer = data.manufacturer;
    const model = data.model;
    const serial_number = data.serial_number;
    const imei = data.imei;
    const bssid = data.bssid;
    const region = data.region;
    const uuid = data.uuid;
    const storage = data.storage;
    const actual_battery_capacity = data.actual_battery_capacity;
    const battery_wear_capacity = data.battery_wear_capacity;
    const color = data.color;
    const status = data.status;
    const is_customer = data.is_customer;
    //var time_stamp = data.time_stamp;
    const timeDate = Math.floor((new Date().getTime()) / 1000);
    const formattedDate = (moment.unix(timeDate).tz('Asia/Kolkata').format(messages.dateFormat));
    const location = data.location;
    console.log(location);
    const values = "'" + manufacturer + "','" + model + "','" + serial_number + "','" +
        imei + "','" + bssid + "','" + region + "','" + uuid + "','" + storage + "','" +
        actual_battery_capacity + "','" + battery_wear_capacity + "','" + color + "','" +
        status + "','" + is_customer + "','" + formattedDate + "','" + location + "'";
    database.insert("phone_details_duplicate", values, function (err, data) {
        if (err) {
            console.error(err.stack);
            callback(err);
        } else {
            database.insert("phone_details", values, function (err, data) {
                callback(err, data);
            });
        }
    });
};
/**
 * Method to insert new report.
 * @param data: Report Details.
 * @param callback: The method callback.
 */
helpers.insertNewReport = function (data, callback) {
    const imei = data.imei;
    const ram = data.ram;
    const battery = data.battery;
    const wifi = data.wifi;
    const bluetooth = data.bluetooth;
    const nfc = data.nfc;
    const flash = data.flash;
    const acclerometer = data.acclerometer;
    const gyroscope = data.gyroscope;
    const external_storage = data.external_storage;
    const touch = data.touch;
    const speaker = data.speaker;
    const volume_up = data.volume_up;
    const volume_down = data.volume_down;
    const proximity = data.proximity;
    const rear_camera = data.rear_camera;
    const front_camera = data.front_camera;
    const back_button = data.back_button;
    const power_button = data.power_button;
    const home_button = data.home_button;
    const vibration = data.vibration;
    const charger = data.charger;
    const headphone = data.headphone;
    const rgb = data.rgb;
    const microphone = data.microphone;
    const screen_brightness = data.screen_brightness;
    const fingerprint = data.fingerprint;
    const actualBattery = data.actual_battery_capacity;
    const batteryWear = data.battery_wear_capacity;
    const matchIMEI = data.match_imei;
    const scratches = data.scratches;
    const dents = data.dents;
    const appleId = data.apple_id_logout;
    const temperedGlass = data.tempered_glass_removed;
    const pasting = data.pasting;
    const marks = data.marks;
    const softSleeve = data.soft_sleeve;
    const plasticWrap = data.plastic_wrap;
    const overall_status = data.overall_status;
    const report_uuid = data.report_uuid;
    const timeDate = Math.floor((new Date().getTime()) / 1000);
    const formattedDate = (moment.unix(timeDate).tz('Asia/Kolkata').format(messages.dateFormat));
    const email = data.email;
    const isUpdated = data.is_updated;
    const orderIdReturn = typeof (data.return_order_id) === 'string' ? data.return_order_id : "NA";
    const values = "'" + imei + "','" + ram + "','" + battery + "','" + wifi + "','" + bluetooth + "','" + nfc + "','" +
        flash + "','" + acclerometer + "','" + gyroscope + "','" + external_storage + "','" + touch + "','" +
        speaker + "','" + volume_up + "','" + volume_down + "','" + proximity + "','" + rear_camera + "','" +
        front_camera + "','" + back_button + "','" + home_button + "','" + power_button + "','" +
        vibration + "','" + charger + "','" + headphone + "','" + rgb + "','" + microphone + "','" +
        screen_brightness + "','" + fingerprint + "','" + actualBattery + "','" + batteryWear + "','" +
        matchIMEI + "','" + scratches + "','" + dents + "','" + appleId + "','" + temperedGlass + "','" +
        pasting + "','" + marks + "','" + softSleeve + "','" + plasticWrap + "','" + overall_status + "','" + report_uuid + "','" +
        formattedDate + "','" + email + "'," + isUpdated + ",'" + orderIdReturn + "'";
    database.insert("report_details", values, function (err, data) {
        callback(err, data);
    });
};
/**
 * Method to get the Payment Method.
 * @param data: The payment Method.
 * @param callback: The method callback.
 */
helpers.getPaymentMethod = function (data, callback) {
    const query = "SELECT value FROM payment_method_details WHERE payment_methods LIKE '" + data + "'";
    database.query(query, function (err, data) {
        if (err) {
            callback(err, {});
        } else {
            callback(false, data[0].value);
        }
    });
};
/**
 * Method to get the Product Type.
 * @param data: The product type.
 * @param callback: The method callback.
 */
helpers.getProductType = function (data, callback) {
    const query = "SELECT value FROM product_type_details WHERE product_type LIKE '" + data + "'";
    database.query(query, function (err, data) {
        if (err) {
            callback(err, {});
        } else {
            callback(false, data[0].value);
        }
    });
};
/**
 * Method to get the Auto incremented value.
 * @param callback: The method callback.
 */
helpers.getAutoIncrementedValue = function (callback) {
    const query = "SELECT max(value) as value FROM order_incremented_value";
    database.query(query, function (err, data) {
        if (err) {
            callback(err, {});
        } else {
            callback(false, data[0].value);
        }
    });
};
/**
 * Method to get the Employee ID.
 * @param mobileNumber: The mobile Number of the Employee.
 */
helpers.getEmployeeID = function (mobileNumber) {
    const query = "SELECT id FROM employee_details WHERE mobile_number LIKE '" + mobileNumber + "'";
    database.query(query, function (err, data) {
        if (err) {
            return {};
        } else {
            return data[0].id;
        }
    });
};
/**
 * Method to get the status value.
 * @param status: The Status.
 * @param callback: The Method callback.
 */
helpers.getStatusValue = function (status, callback) {
    const query = "SELECT id FROM visit_status_details WHERE status LIKE '" + status + "'";
    database.query(query, function (err, data) {
        if (err) {
            callback(-1);
        } else {
            try {
                callback(data[0].id);
            } catch (e) {
                callback(-1);
            }
        }
    });
};
/**
 * Method to get the Random Token.
 * @param len
 * @returns {string}
 */
helpers.getRandomKey = function (len) {
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    len = typeof (len) === 'number' && len > 0 ? len : 16;
    let key = '';
    for (let i = 1; i <= len; i++) {
        key += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
    }
    return key;
};
/**
 * Method to generate a random IMEI.
 * @param len: The length of the IMEI to be generated.
 * @returns {string}: The Random IMEI.
 */
helpers.getRandomImei = function (len) {
    let possibleCharacters = '123456789xxxxxxxx01234567890xxxxxx';
    len = typeof (len) === 'number' && len >= 15 ? len : 15;
    let imei = '';
    for (let i = 0; i < len; i++) {
        imei += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
    }
    return imei;
};
/**
 * Method to add the Phone to the Inventory and update the status of phone_details.
 * @param data: The Post Data.
 * @param callback: The Method callback.
 */
helpers.addInventoryPhone = function (data, callback) {
    console.log(data);
    const brand = data.brand.trim();
    const model_name = data.model_name.trim();
    const imei_1 = data.product_imei_1.trim();
    const imei_2 = data.product_imei_2.trim();
    const color = data.product_color.trim();
    const timeDate = Math.floor((new Date().getTime()) / 1000);
    const formattedDate = (moment.unix(timeDate).tz('Asia/Kolkata').format(messages.dateFormat)).split(' ');
    const time = formattedDate[1];
    const date = formattedDate[0];
    const price = data.product_price.trim();
    const grade = data.product_grade;
    const vendorId = data.vendor_id;
    const email = data.operations_email;
    const service_stock = data.service_stock;
    const isApproved = data.is_approved;
    const storage = data.storage;
    let charger = data.charger.trim();
    let head_phone = data.head_phone.trim();
    let ejectorTool = data.ejector_tool.trim();
    let back_cover = data.back_cover.trim();
    let manual = data.manual;
    let connector = data.connector;
    const remarks = data.remarks.trim();
    let isManual = checkValid(data.is_manual);
    isManual = typeof (isManual) === 'string' ? isManual : "no";
    charger = checkValid(charger);
    head_phone = checkValid(head_phone);
    ejectorTool = checkValid(ejectorTool);
    back_cover = checkValid(back_cover);
    manual = checkValid(manual);
    connector = checkValid(connector);

    const sku_query = "select * from sku_master where brand LIKE '%" + brand + "%' and lower(model) LIKE lower('%" + model_name
        + "%') and storage = " + storage + " and color LIKE '%" + color + "%' or grade LIKE '%" + grade + "%'";
    console.log(sku_query);
    database.query(sku_query, function (err, skuData) {
        let sku;
        if (!err) {
            try {
                sku = skuData[0].sku;
                console.log(sku);
            } catch (e) {
                console.log("NO SKU FOUND");
                sku = "";
            }
            const values = "'" + model_name + "','" + sku + "','" + imei_1 + "','" + imei_2 + "','" + color + "','" + time + "','" + date + "','" +
                price + "','" + grade + "','" + vendorId + "','" + email + "','" + service_stock + "',2," +
                isApproved + ",'" + storage + "','" + charger + "','" + head_phone + "','" + ejectorTool + "','" + back_cover + "','" +
                manual + "','" + connector + "','" + remarks + "','" + isManual + "'";
            database.insert("inventory", values, function (err, insertData) {
                if (!err) {
                    callback(false);
                    updatePhoneDetails(imei_1, service_stock);
                    updateQRTable(imei_1, service_stock);
                } else if (err) {
                    //If the phone is already present in inventory then the status will be updated.
                    const query = "UPDATE inventory SET service_stock = " + service_stock +
                        ", remarks = '" + remarks + "' WHERE product_imei_1 LIKE '" + imei_1 + "'";
                    database.query(query, function (err, updateData) {
                        if (err) {
                            console.error(err.stack);
                            callback(err);
                        } else {
                            if (updateData.affectedRows > 0) {
                                updatePhoneDetails(imei_1, service_stock);
                                updateQRTable(imei_1, service_stock);
                                callback(false);
                            } else {
                                callback(err);
                            }
                        }
                    });
                }
            });
        } else {
            console.log(err);
            callback(err);
        }
    });


    /**
     * Method to check the validity of the accessories.
     * @param value
     * @returns {string}
     */
    function checkValid(value) {
        return typeof (value) === 'string' ? value : 'no';
    }

    /**
     * Method to update the Phone Details.
     * @param imei: The Imei of the device.
     * @param serviceStock: The new status of the device.
     */
    function updatePhoneDetails(imei, serviceStock) {
        const where = "imei LIKE '" + imei + "'";
        database.update("phone_details", "status",
            serviceStock, where, function (err, updateData) {
                if (err) {
                    console.error(err.stack);
                } else {
                    console.log("Updated Phone_details.");
                }
            });
    }

    /**
     * Method to update the QR table Query.
     * @param imei: The imei of the device.
     * @param serviceStock: the new service Stock status.
     */
    function updateQRTable(imei, serviceStock) {
        let query = "SELECT * FROM phone_details_qr WHERE imei LIKE '" + imei + "'";
        database.query(query, function (err, qrData) {
            if (err) {
                console.error(err.stack);
            } else {
                const id = qrData[qrData.length - 1].id;
                query = "UPDATE phone_details_qr SET phone_status = " + serviceStock +
                    " WHERE id = " + id + " AND imei LIKE '" + imei + "'";
                database.query(query, function (err, updateData) {
                    console.log(err);
                    console.log("Rows affected in QR: " + updateData.affectedRows);
                });
            }
        });
    }
};
/**
 * Method to get a Random OTP.
 * @returns {number}
 */
helpers.createOTP = function () {
    return Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
};
/**
 * Method to extract the Details for Sell phone Order.
 * @param postData: The POST Request Data.
 */
helpers.addSellPhoneOrder = function (postData, callback) {
    const firstName = postData.seller_first_name;
    const lastName = postData.seller_last_name;
    const email = postData.seller_email;
    const phone = postData.seller_phone_number;
    const address = postData.seller_address;
    const modelName = postData.model_name;
    const imei = postData.imei;
    const price = postData.buy_back_price_offered;
    const timeDate = Math.floor((new Date().getTime()) / 1000);
    const formattedDate = (moment.unix(timeDate).tz('Asia/Kolkata').format(messages.dateFormat)).split(' ');
    const date = formattedDate[0];
    const time = formattedDate[1];
    const touch = postData.touch_not_working;
    const screen = postData.screen_not_working;
    const camera = postData.camera_not_working;
    const volume = postData.volume_button_not_working;
    const power = postData.power_button_not_working;
    const home = postData.home_button_not_working;
    const headphone = postData.headphone_port_damaged;
    const wifi = postData.wifi_damaged;
    const speaker = postData.speaker_damaged;
    const microphone = postData.microphone_damaged;
    const charging = postData.charging_defect;
    const battery = postData.battery_damaged;
    const wallCharger = postData.wall_charger;
    const box = postData.box;
    const usbCable = postData.usb_cable;
    const earphones = postData.earphones;
    const status = postData.status;
    const values = "'','" + firstName + "','" + lastName + "','" + email + "','" + phone + "','" + address + "','" +
        modelName + "','" + imei + "','" + price + "','" + date + "','" + time + "','" + touch + "','" + screen + "','" + camera +
        "','" + volume + "','" + power + "','" + home + "','" + headphone + "','" + wifi + "','" + speaker + "','" +
        microphone + "','" + charging + "','" + battery + "','" + wallCharger + "','" + box + "','" + usbCable +
        "','" + earphones + "','" + status + "'";
    database.insert("buy_back_phone_order", values, function (err, insertData) {
        if (!err) {
            const msg = "Hi " + firstName + ", " + messages.sellPhoneMessage;
            snsLib.sendMessage(phone, msg, function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback(false);
                }
            });
        } else {
            //console.log(err);
            callback(err);
        }
    });
};
/**
 * Method to update the Report details table.
 * @param postData: The Post Body data.
 * @param callback: The Method Callback. If err, calls back the err else false.
 */
helpers.updatePhoneReport = function (postData, callback) {
    const imei = postData.imei;
    let set = "UPDATE report_details SET ";
    delete postData.imei;
    for (let x in postData) {
        set += x + " = '" + postData[x] + '\',';
    }
    set = set.substr(0, set.length - 1);
    set = set + " , is_updated = 1 WHERE imei LIKE '" + imei + "' AND is_updated = 0";
    console.log(set);
    database.query(set, function (err, updateData) {
        if (err) {
            callback(err);
        } else {
            callback(false);
        }
    });
};
/**
 * Method to insert the new Order.
 * Calls back false if inserted, else false.
 * @param postData: the POST body.
 * @param callback: The method callback.
 */
helpers.insertOrder = function (postData, callback) {
    const awbNumber = postData.awb_number;
    const channelOrderId = postData.channel_order_id;
    const channelName = postData.channel_name;
    const productDetails = postData.product_details;
    const customerName = postData.customer_name;
    const customerEmail = postData.customer_email;
    const customerPhone = postData.customer_phone;
    const address = postData.shipping_address;
    const courierId = postData.courier_id;
    const orderDate = postData.order_date;
    const orderTime = postData.order_time;
    const timeDate = Math.floor((new Date().getTime()) / 1000);
    const formattedDate = (moment.unix(timeDate).tz('Asia/Kolkata').format(messages.dateFormat)).split(' ')[0];
    const dispatchBefore = postData.dispatch_before;
    const invoiceNumber = postData.invoice_number;
    const invoiceDate = postData.invoice_date;
    const paymentMethod = postData.payment_method;
    const productPrice = postData.product_price;
    const orderStatus = postData.order_status;
    const isVideoTaken = postData.is_video_taken;
    const productGrade = postData.product_grade;
    const imei = postData.imei_number;
    const remarks = postData.remarks;
    const values = "'','" + awbNumber + "','" + channelOrderId + "','" + channelName + "','" + productDetails + "','" +
        customerName + "','" + customerEmail + "','" + customerPhone + "','" + address + "','" + courierId + "','" +
        orderDate + "','" + orderTime + "','" + formattedDate + "','" + dispatchBefore + "','" + invoiceNumber + "','" + invoiceDate + "','" +
        paymentMethod + "','" + productPrice + "','" + orderStatus + "','" + isVideoTaken + "','" +
        productGrade + "','" + imei + "','" + remarks + "',''";
    database.insert("order_details", values, function (err, insertData) {
        if (err) {
            callback(err);
        } else {
            callback(false);
        }
    });
    /*const query = "INSERT INTO order_details VALUES (" + values + ")";
    database.query(query, function (err, orderData) {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            callback(false);
        }
    });*/

};
/**
 * Method to send the firebase notification.
 * @param token: The Device token.
 * @param msg: The Message to be send.
 * @param content: The Content of the Message.
 * @param callback: The method callback.
 */
helpers.sendFirebaseNotification = function (token, msg, content, extra, callback) {
    const serviceAccount = require('./firebaseService.json');
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://hyperxchange-api.firebaseio.com"
        });
    } catch (e) {
        console.log("Firebase app already initialized.");
    }
    const message = {
        data: {
            res: msg,
            content: content,
            extra: extra
        },
        token: token
    };
    admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
            callback(false, response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
            callback(error);
        });
};
/**
 * Method to add the service repair cost.
 * @param dataObject: The DataObject.
 */
helpers.addServiceCost = function (dataObject) {
    console.log(dataObject);
    const imei = dataObject.postData.imei;
    const body = dataObject.postData.Body;
    const screen = dataObject.postData.Screen;
    const battery = dataObject.postData.Battery;
    const pasting = dataObject.postData.Pasting;
    const fingerprint = dataObject.postData.Fingerprint;
    const cleaning = dataObject.postData.Cleaning;
    const camera = dataObject.postData.Camera;
    const speaker = dataObject.postData.Speaker;
    const buttons = dataObject.postData.Buttons;
    const microphone = dataObject.postData.Microphone;
    const cost = dataObject.postData.cost;
    let query = "SELECT service_center FROM service_center WHERE id in (SELECT max(id) as id FROM service_center WHERE imei LIKE '" + imei + "')";
    console.log(query);
    database.query(query, function (err, selectData) {
        if (err) {
            console.error(err.stack);
        } else {
            const serviceCenter = selectData[0].service_center;
            console.log(serviceCenter);
            query = "INSERT INTO service_center_cost VALUES ('" + imei + "'," + serviceCenter + "," + body + "," + screen + "," + battery + "," +
                pasting + "," + fingerprint + "," + cleaning + "," + camera + "," + speaker + "," + buttons + "," + microphone + "," + cost + ")";
            console.log(query);
            database.query(query, function (err, insertData) {
                if (err) {
                    console.error(err.stack);
                } else {
                    console.log("Inserted into the service Cost.");
                }
            });
        }
    });
};
/**
 * Exporting the module.
 */
module.exports = helpers;