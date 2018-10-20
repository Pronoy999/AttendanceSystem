var helpers = {};
helpers.parseJsonToObjects = function (data) {
    var obj = {};
    try {
        obj = JSON.parse(data);
        return obj;
    } catch (e) {
        return {};
    }
};
module.exports = helpers;