const mysql = require('mysql');
/**
 * AWS Database credentials.
 */
var pool = mysql.createPool({
    host: 'hx-db.coh0oaulbzdr.ap-southeast-1.rds.amazonaws.com',
    user: 'db_admin',
    database: 'staging_diagnostic_app',
    password: 'hxadmin123',
    port: '3306'
});
var database = {};
/**
 * Method to insert into the database.
 * @param tableName: The tableName.
 * @param values: The values to be inserted.
 * @param callback: The Callback.
 */
database.insert = function (tableName, values, callback) {
    pool.getConnections(function (err, con) {
        if (err) {
            callback(err);
        } else {
            var query = "INSERT INTO " + tableName + " VALUES (" + values + ")";
            con.query(query, function (err, result, fields) {
                con.release();
                if (err) {
                    callback(err);
                } else {
                    callback(false, result);
                }
            });
        }
        pool.on('release', function (con) {
            //Connection released.
        });
        pool.on('acquire', function (con) {
            //Connection acquired.
        });
    });
};
/**
 * Method to Execute Select Statement from SQL.
 * @param queryStatement: The Query statment to be executed.
 * @param callback: The Method callback.
 */
database.select = function (queryStatement, callback) {
    pool.getConnections(function (err, con) {
        if (err) {
            callback(err);
            console.log(err);
        } else {
            con.query(queryStatement, function (err, results, fields) {
                if (err) {
                    callback(err);
                    console.log(err);
                } else {
                    callback(false, results);
                }
            });
        }
        pool.on('release', function (con) {
            //Connection released.
        });
        pool.on('acquire', function (con) {
            //Connection Acquired.
        });
    });
};