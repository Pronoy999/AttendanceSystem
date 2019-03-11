const messages = {};
messages.tokenExpiredMessage = "Invalid Token or Token Expired.";
messages.invalidRequestMessage = "Invalid Request Method.";
messages.alreadyLoggedIn = "The User is already logged in";
messages.errorMessage = "Error.";
messages.noVideo = "Missing Video for the Order.";
messages.attendancePut = "Attendance successful.";
messages.invalidPassword = "Invalid Email or Password";
messages.companyPrefix = "HX";
messages.phoneInserted = "Inserted new Phone.";
messages.insufficientData = "Insufficient Data.";
messages.dateFormat = 'YYYY-MM-DD HH:mm:ss';
messages.notAssigned = "QR code hasn't be assigned.";
messages.imeiNotLinked = "QR code has been assigned but IMEI hasn't been linked.";
messages.sellPhoneMessage = 'We have received your order for sell your phone and pick up will be scheduled ASAP.';
messages.headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT',
    'Access-Control-Max-Age': 2592000,
    'Access-Control-Allow-Headers': 'Content-Type'
};
messages.sellPhoneMessage = 'thank you for showing interest to sell your phone at the best price. A HyperXpert would connect with you shortly.';
messages.acceptVistMessage = "Your visit has been accepted, kindly ask the security now.";
messages.rejectVisitMessage = "Sorry, your visit has been rejected.";
messages.APP_INDENTIFIER = "HX-Firebase";
messages.bucketName = "hx-dig";
/**
 * Exporting the Message Module.
 */
module.exports = messages;
