let fs = require('fs');
module.exports = require('java');

let baseDir = "./javalib";
let dependencies = fs.readdirSync(baseDir);

dependencies.forEach(dep => {
    module.exports.classpath.push(baseDir + "/" + dep)
});