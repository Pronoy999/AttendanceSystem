#!/usr/bin/env node
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const handlers = require('./handlers');
const helpers = require('./helpers');
/**
 * The Router Containing the end points.
 */
const router = {
    'ping': handlers.ping,
    'otp': handlers.otp,
    'text': handlers.text,
    'phone': handlers.phone,
    'phone-report': handlers.report,
    'order-id': handlers.orderId,
    'log-check': handlers.logCheck,
    'visitor': handlers.addVisitor,
    'visit-log': handlers.visitLog,
    'update': handlers.updateIphoneModel,
    'auth': handlers.token,
    'attendance':handlers.putAttendance,
    'inventory-data': handlers.getDistinctModel,
    'employee': handlers.employee,
    'inventory-phone': handlers.inventoryPhone,
    'inventory-vendor':handlers.getVendor
};
/**
 * Method which controls the Server.
 * @param req: The REQUEST.
 * @param res: The RESPONSE.
 */
var unifiedServer = function (req, res) {
    var parsedUrl = url.parse(req.url, true);
    var pathName = parsedUrl.pathname;
    var trimmedPath = pathName.replace(/^\/+|\/+$/g, '');
    var method = req.method.toLowerCase();
    var queryString = parsedUrl.query;
    var decoder = new StringDecoder('utf-8');
    var postData = '';
    req.on('data', function (data) {
        postData += decoder.write(data);
    });
    req.on('end', function () {
        postData += decoder.end();
        postData = helpers.parseJsonToObjects(postData);
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        var data = {
            'path': trimmedPath,
            'method': method,
            'queryString': queryString,
            'postData': postData
        };
        chosenHandler(data, function (err, statusCode, responseData) {
            responseData = typeof(responseData) === 'object' ? responseData : {};
            statusCode = typeof (statusCode) === 'number' ? statusCode : 400;
            var responseObject = JSON.stringify(responseData);
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(responseObject);
            console.log('Returning: ', responseObject, statusCode);
        });
    });

};
/**
 * Method to create the Server.
 */
var httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res);
});
/**
 * Method to listen on the port.
 */
httpServer.listen(7009, function () {
    console.log("Server Listening on Port 7009");
});