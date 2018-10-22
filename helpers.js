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
helpers.validateKey = function (key) {
    //TODO: Check the Key.
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
helpers.getPaymentMethod = function (data, callback) {
    var query = "SELECT value FROM payment_method_details WHERE payment_methods LIKE '" + data + "'";
    database.select(query, function (err, data) {
        if (err) {
            callback(err, {});
        } else {
            callback(false, data[0].value);
        }
    });
};
helpers.getProductType = function (data, callback) {
    var query = "SELECT value FROM product_type_details WHERE product_type LIKE '" + data + "'";
    database.select(query, function (err, data) {
        if (err) {
            callback(err, {});
        } else {
            callback(false, data[0].value);
        }
    });
};
helpers.getAutoIncrementedValue = function (callback) {
    var query = "SELECT max(value) as value FROM order_incremented_value";
    database.select(query, function (err, data) {
        if (err) {
            callback(err, {});
        } else {
           callback(false,data[0].value);
        }
    });
};
/**
 * Exporting the module.
 */
module.exports = helpers;