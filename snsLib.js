const aws = require('aws-sdk');
aws.config.update({
    region: 'ap-southeast-1',
    accessKeyId: 'AKIAJIZWJEI3NUHXOC3Q',
    secretAccessKey: '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'
});
var otp = {};
var sns = new aws.SNS();
/**
 * Method to sendOTP the OTP to Specified Phone Number.
 * @param phoneNumber: The Phone Number where the OTP to be sendOTP.
 * @param callback: the function callback
 */
otp.sendOTP = function (phoneNumber, callback) {
    var randomOtp = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    var msg = 'Your HX OTP is: ' + randomOtp;
    var params = {
        Message: msg,
        MessageStructure: 'string',
        phoneNumber: phoneNumber
    };
    sns.publish(params, function (err, data) {
        if (err) {
            callback(err);
            console.log(err);
        } else {
            callback(randomOtp, data);
        }
    });
};
/**
 * Method to send any text as an SMS.
 * @param phoneNumber: The PhoneNumber where the SMS is to be send.
 * @param msg: The Message.
 * @param callback: The Method callback.
 */
otp.sendMessage = function (phoneNumber, msg, callback) {
    var params = {
        Message: msg,
        MessageStructure: 'string',
        phoneNumber: phoneNumber
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
module.exports = otp;
