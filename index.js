#!/usr/bin/env node
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const handlers = require('./handlers');
const helpers = require('./helpers');
const message = require('./Constants');
const workers = require('./workers');
/**
 * The Router Containing the end points.
 */
const router = {
    'ping': handlers.ping,
    'otp': handlers.otp,
    'text': handlers.text,
    'phone': handlers.phone,
    'phone-price': handlers.phonePrice,
    'phone-report': handlers.report,
    'order-id': handlers.orderId,
    'log-check': handlers.logCheck,
    'visitor': handlers.addVisitor,
    'visit': handlers.visit,
    'visit-log': handlers.visitLog,
    'update': handlers.updateIphoneModel,
    'auth': handlers.token,
    'attendance': handlers.attendance,
    'fuckattendance': handlers.fuckAttendance,
    'inventory-data': handlers.inventoryData,
    'employee': handlers.employee,
    'inventory-phone': handlers.inventoryPhone,
    'inventory-dead': handlers.inventoryDead,
    'inventory-vendor': handlers.getVendor,
    'inventory-imei': handlers.inventoryImei,
    'inventory-pending': handlers.inventoryPendingPhones,
    'inventory-add': handlers.inventoryAdd,
    'inventory-state': handlers.inventoryState,
    'inventory-pin': handlers.inventoryPin,
    'inventory-auth': handlers.inventoryAuth,
    'syp': handlers.sellPhone,
    'syp-order': handlers.sellPhoneOrder,
    'order-details': handlers.orderDetails,
    'order-returned': handlers.orderReturned,
    'order-status': handlers.orderStatus,
    'details': handlers.details,
    'bio-auth': handlers.bioAuth,
    'firebase-token': handlers.firebaseToken,
    'version': handlers.permittedVersions,
    'qr': handlers.qr,
    'meeting': handlers.meeting
};
/**
 * Method which controls the Server.
 * @param req: The REQUEST.
 * @param res: The RESPONSE.
 */
const unifiedServer = function (req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathName = parsedUrl.pathname;
    const trimmedPath = pathName.replace(/^\/+|\/+$/g, '');
    const method = req.method.toLowerCase();
    const queryString = parsedUrl.query;
    const decoder = new StringDecoder('utf-8');
    let postData = '';
    const header = req.headers['content-type'];
    const chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ?
        router[trimmedPath] : handlers.notFound;

    if (header === 'application/octet-stream') {
        var data = [];
        req.on('data', d => {
            data.push(d)
        }).on('end', () => {
            var buffer = Buffer.concat(data);
            const handlerData = {
                path: trimmedPath,
                method,
                queryString,
                data: buffer
            };
            execHandlers(handlerData);
        });
    } else {
        req.on('data', function (data) {
            postData += decoder.write(data);
        });
        req.on('end', function () {
            postData += decoder.end();
            postData = helpers.parseJsonToObjects(postData);
            var data = {
                'path': trimmedPath,
                'method': method,
                'queryString': queryString,
                'postData': postData
            };
            execHandlers(data);
        });
    }

    /**
     * Method to invoke the Handlers and return the response object.
     * @param data: The Request data for the handlers.
     */
    function execHandlers(data) {
        chosenHandler(data, function (err, statusCode, responseData) {
            responseData = typeof (responseData) === 'object' ? responseData : {};
            statusCode = typeof (statusCode) === 'number' ? statusCode : 400;
            const responseObject = JSON.stringify(responseData);
            try {
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(statusCode, message.headers);
                res.end(responseObject);
                console.log('Returning: ', responseObject, "For Path ", trimmedPath, statusCode);
            } catch (e) {
                console.log(e);
            }
        });
    }
};
/**
 * Method to create the Server.
 */
const httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res);
});
//workers.checkOrderStatus();
/**
 * Method to listen on the port.
 */
httpServer.listen(7009, function () {
    console.log("Server Listening on Port 7009");
});