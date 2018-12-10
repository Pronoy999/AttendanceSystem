var helpers = {};
const database = require('./databaseHandler');
const moment = require('moment');
const tz = require('moment-timezone');
const messages = require('./Constants');
const snsLib = require('./snsLib');
/**
 * Method to parse JSON to Objects.
 * @param data
 * @returns {*}
 */
helpers.parseJsonToObjects = function (data) {
    var obj = {};
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
        var query = "SELECT * FROM api_token WHERE token LIKE '" + key + "'";
        database.query(query, function (err, data) {
            if (err) {
                callback(false);
            } else {
                if (typeof(data[0]) !== 'undefined') {
                    if (Number(data[0].validity) === -1) {
                        callback(true);
                    }
                    else if (data[0].token === key && Number(data[0].validity) > Date.now()) {
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
    var manufacturer = data.manufacturer;
    var model = data.model;
    var serial_number = data.serial_number;
    var imei = data.imei;
    var bssid = data.bssid;
    var region = data.region;
    var uuid = data.uuid;
    var storage = data.storage;
    var actual_battery_capacity = data.actual_battery_capacity;
    var battery_wear_capacity = data.battery_wear_capacity;
    var color = data.color;
    var status = data.status;
    var is_customer = data.is_customer;
    //var time_stamp = data.time_stamp;
    var timeDate = Math.floor((new Date().getTime()) / 1000);
    var formattedDate = (moment.unix(timeDate).tz('Asia/Kolkata').format(messages.dateFormat));
    var values = "'" + manufacturer + "','" + model + "','" + serial_number + "','" +
        imei + "','" + bssid + "','" + region + "','" + uuid + "','" + storage + "','" +
        actual_battery_capacity + "','" + battery_wear_capacity + "','" + color + "','" +
        status + "','" + is_customer + "','" + formattedDate + "'";
    database.insert("phone_details_duplicate", values, function (err, data) {
        if (err) {
            console.log(err);
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
    var imei = data.imei;
    var ram = data.ram;
    var battery = data.battery;
    var wifi = data.wifi;
    var bluetooth = data.bluetooth;
    var nfc = data.nfc;
    var flash = data.flash;
    var acclerometer = data.acclerometer;
    var gyroscope = data.gyroscope;
    var external_storage = data.external_storage;
    var touch = data.touch;
    var speaker = data.speaker;
    var volume_up = data.volume_up;
    var volume_down = data.volume_down;
    var proximity = data.proximity;
    var rear_camera = data.rear_camera;
    var front_camera = data.front_camera;
    var back_button = data.back_button;
    var power_button = data.power_button;
    var home_button = data.home_button;
    var vibration = data.vibration;
    var charger = data.charger;
    var headphone = data.headphone;
    var rgb = data.rgb;
    var microphone = data.microphone;
    var screen_brightness = data.screen_brightness;
    var fingerprint = data.fingerprint;
    var overall_status = data.overall_status;
    var report_uuid = data.report_uuid;
    var report_date = data.report_date;
    var email = data.email;
    var values = "'" + imei + "','" + ram + "','" + battery + "','" + wifi + "','" + bluetooth + "','" + nfc + "','" +
        flash + "','" + acclerometer + "','" + gyroscope + "','" + external_storage + "','" + touch + "','" +
        speaker + "','" + volume_up + "','" + volume_down + "','" + proximity + "','" + rear_camera + "','" +
        front_camera + "','" + back_button + "','" + home_button + "','" + power_button + "','" +
        vibration + "','" + charger + "','" + headphone + "','" + rgb + "','" + microphone + "','" +
        screen_brightness + "','" + fingerprint + "','" + overall_status + "','" + report_uuid + "','" +
        report_date + "','" + email + "'";
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
    var query = "SELECT value FROM payment_method_details WHERE payment_methods LIKE '" + data + "'";
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
    var query = "SELECT value FROM product_type_details WHERE product_type LIKE '" + data + "'";
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
    var query = "SELECT max(value) as value FROM order_incremented_value";
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
    var query = "SELECT id FROM employee_details WHERE mobile_number LIKE '" + mobileNumber + "'";
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
    var query = "SELECT id FROM visit_status_details WHERE status LIKE '" + status + "'";
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
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    len = typeof(len) === 'number' && len > 0 ? len : 16;
    var key = '';
    for (var i = 1; i <= len; i++) {
        key += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
    }
    return key;
};
/**
 * Method to add the Phone to the Inventory and update the status of phone_details.
 * @param data: The Post Data.
 * @param callback: The Method callback.
 */
helpers.addInventoryPhone = function (data, callback) {
    var model_name = data.model_name;
    var imei_1 = data.product_imei_1;
    var imei_2 = data.product_imei_2;
    var color = data.product_color;
    var time = data.product_add_time;
    var date = data.product_add_date;
    var price = data.product_price;
    var grade = data.product_grade;
    var vendorId = data.vendor_id;
    var email = data.operations_email;
    var service_stock = data.service_stock;
    var isApproved = data.is_approved;
    var storage = data.storage;
    var charger = data.charger;
    var head_phone = data.head_phone;
    var ejectorTool = data.ejector_tool;
    var back_cover = data.back_cover;
    var manual = data.manual;
    var connector = data.connector;
    var values = "'','" + model_name + "'," + imei_1 + "'," + imei_2 + "'," + color + "'," + time + "'," + date + "'," +
        price + "'," + grade + "'," + vendorId + "'," + email + "'," + service_stock + "'," +
        isApproved + "'," + storage + "'," + charger + "'," + head_phone + "'," + ejectorTool + "'," + back_cover + "'," +
        manual + "'," + connector + "'";
    database.insert("inventory", values, function (err, insertData) {
        var where = "imei LIKE '" + imei_1 + "'";
        if (!err) {
            database.update("phone_details", "status", service_stock, where, function (err, updateData) {
                callback(err, updateData);
            });
        } else {
            callback(err, {});
        }
    });
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
    var firstName = postData.seller_first_name;
    var lastName = postData.seller_last_name;
    var email = postData.seller_email;
    var phone = postData.seller_phone_number;
    var address = postData.seller_address;
    var modelName = postData.model_name;
    var imei = postData.imei;
    var price = postData.buy_back_price_offered;
    var timeDate = Math.floor((new Date().getTime()) / 1000);
    var formattedDate = (moment.unix(timeDate).tz('Asia/Kolkata').format(messages.dateFormat)).split(' ');
    var date = formattedDate[0];
    var time = formattedDate[1];
    var touch = postData.touch_not_working;
    var screen = postData.screen_not_working;
    var camera = postData.camera_not_working;
    var volume = postData.volume_button_not_working;
    var power = postData.power_button_not_working;
    var home = postData.home_button_not_working;
    var headphone = postData.headphone_port_damaged;
    var wifi = postData.wifi_damaged;
    var speaker = postData.speaker_damaged;
    var microphone = postData.microphone_damaged;
    var charging = postData.charging_defect;
    var battery = postData.battery_damaged;
    var wallCharger = postData.wall_charger;
    var box = postData.box;
    var usbCable = postData.usb_cable;
    var earphones = postData.earphones;
    var status = postData.status;
    var values = "'','" + firstName + "','" + lastName + "','" + email + "','" + phone + "','" + address + "','" +
        modelName + "','" + imei + "','" + price + "','" + date + "','" + time + "','" + touch + "','" + screen + "','" + camera +
        "','" + volume + "','" + power + "','" + home + "','" + headphone + "','" + wifi + "','" + speaker + "','" +
        microphone + "','" + charging + "','" + battery + "','" + wallCharger + "','" + box + "','" + usbCable +
        "','" + earphones + "','" + status + "'";
    database.insert("buy_back_phone_order", values, function (err, insertData) {
        if (!err) {
            var msg = "Hi " + firstName + ", " + messages.sellPhoneMessage;
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
 * Exporting the module.
 */
module.exports = helpers;