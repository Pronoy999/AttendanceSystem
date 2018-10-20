const aws = require('aws-sdk');
aws.config.update({
    region: 'ap-southeast-1',
    accessKeyId: 'AKIAJIZWJEI3NUHXOC3Q',
    secretAccessKey: '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'
});
var otp = {};
var sns = new aws.SNS();
/**
 * Method to send the OTP to Specified Phone Number.
 * @param phoneNumber: The Phone Number where the OTP to be send.
 * @param callback: the function callback
 */
otp.send = function (phoneNumber, callback) {
    var randomOtp = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    var msg = 'Your HX OTP is: ' + randomOtp;
    var params = {
        Message: msg,
        MessageStructure: 'string',
        phoneNumber: phoneNumber
    };
    sns.publish(params, function (err, data) {
        callback(randomOtp, data);
    });
};
module.exports = otp;
