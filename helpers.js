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
module.exports = helpers;