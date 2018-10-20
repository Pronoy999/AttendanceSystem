const database=require('./databaseHandler');
var handlers={};
handlers.otp=function (data, callback) {
  var method=data.method;
  if(method==='get'){
      var phoneNumber=data.phoneNumber;
      var otp=data.userOtp;

  }
};