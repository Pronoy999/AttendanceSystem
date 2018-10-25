var helpers = {};
const database = require('./databaseHandler');
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
    var query = "SELECT * FROM api_token WHERE token LIKE '" + key + "'";
    database.query(query, function (err, data) {
        if (err) {
            callback(false);
        } else {
            if(typeof(data[0])!=='undefined') {
                if (data[0].token === key) {
                    callback(true);
                } else {
                    callback(false);
                }
            }else{
                callback(false);
            }
        }
    });
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
    var time_stamp = data.time_stamp;
    var values = "'" + manufacturer + "','" + model + "','" + serial_number + "','" +
        imei + "','" + bssid + "','" + region + "','" + uuid + "','" + storage + "','" +
        actual_battery_capacity + "','" + battery_wear_capacity + "','" + color + "','" +
        status + "','" + is_customer + "','" + time_stamp + "'";
    database.insert("phone_details", values, function (err, data) {
        callback(err, data);
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
 * Exporting the module.
 */
module.exports = helpers;