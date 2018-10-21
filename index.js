const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const handlers = require('./handlers');
const helpers=require('./helpers');
const router = {
    'otp': handlers.otp,
    'text':handlers.text,
    'phone':handlers.phone,
    'phone-report':handlers.report
};
var unifiedServer = function (req, res) {
    var parsedUrl = url.parse(req.url, true);
    var pathName = parsedUrl.pathname;
    var trimmedPath = pathName.replace(/^\/+|\/+$/g, '');
    var method = req.method.toLowerCase();
    var queryString = parsedUrl.query;
    var decoder = new StringDecoder('utf-8');
    var postData='';
    req.on('data', function (data) {
        postData += decoder.write(data);
    });
    req.on('end', function () {
        postData+= decoder.end();
        postData = helpers.parseJsonToObjects(postData);
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        var data = {
            'path': trimmedPath,
            'method': method,
            'queryString': queryString,
            'postData': postData
        };
        chosenHandler(data, function (err, statusCode, responseData) {
            responseData = typeof(responseData) == 'object' ? responseData : {};
            statusCode = typeof (statusCode) == 'number' ? statusCode : 400;
            var responseObject = JSON.stringify(responseData);
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(responseObject);
            console.log('Returning: ', responseObject, statusCode);
        });
    });

};
var httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res);
});
httpServer.listen(7000, function () {
    console.log("Server Listening on Port 7000");
});

