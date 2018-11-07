const messages = {};
messages.tokenExpiredMessage="Invalid Token or Token Expired.";
messages.invalidRequestMessage="Invalid Request Method.";
messages.errorMessage="Error.";
messages.attendancePut="Attendance successful.";
messages.companyPrefix = "HX";
messages.phoneInserted = "Inserted new Phone.";
messages.insufficientData = "Insufficient Data.";
messages.dateFormat = 'YYYY-MM-DD HH:mm:ss';
messages.sellPhoneMessage = 'We have received your order for sell your phone and pick up will be scheduled ASAP.';
messages.headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT',
    'Access-Control-Max-Age': 2592000, // 30 days
    /** add other headers as per requirement */
};
messages.sellPhoneMessage = 'thank you for showing interest to sell your phone at the best price. A HyperXpert would connect with you shortly.';
/**
 * Exporting the Message Module.
 */
module.exports=messages;
