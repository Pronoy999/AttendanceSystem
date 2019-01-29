const aws = require('aws-sdk');
var sms = {};
aws.config.update({
    region: 'ap-southeast-1',
    accessKeyId: 'AKIAJIZWJEI3NUHXOC3Q',
    secretAccessKey: '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'
});
var sns = new aws.SNS();
/**
 * Method to send an OTP.
 * @param phone: The Phone Number.
 * @param callback: The Method callback. The error and the OTP.
 */
sms.sendOTP = function (phone, callback) {
    const helpers = require('./helpers');
    var number = helpers.createOTP();
    var msg = 'Your HX OTP is: ' + number;
    var params = {
        Message: msg,
        MessageStructure: 'string',
        PhoneNumber: phone
    };
    sns.publish(params, function (err, data) {
        callback(err, number);
    });
};
/**
 * Method to send normal Text.
 * @param phoneNumber: The Phone Number where the data to Send.
 * @param msg: The Message.
 * @param callback: The method callback.
 */
sms.sendMessage = function (phoneNumber, msg, callback) {
    var params = {
        Message: msg,
        MessageStructure: 'string',
        PhoneNumber: phoneNumber
    };
    sns.publish(params, function (err, data) {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            callback(false);
        }
    });
};
module.exports = sms;
