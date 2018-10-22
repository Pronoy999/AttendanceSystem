const mysql = require('mysql');
/**
 * AWS Database credentials.
 */
var pool = mysql.createPool({
    host: 'hx-db.coh0oaulbzdr.ap-southeast-1.rds.amazonaws.com',
    user: 'db_admin',
    database: 'diagnostic_app',
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
    pool.getConnection(function (err, con) {
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
    pool.getConnection(function (err, con) {
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
/**
 * Method to update a database value.
 * @param tableName: The tableName.
 * @param updateCol: The column which is to be updated.
 * @param updateVal: The updated value or the new value.
 * @param where: The Where clause.
 * @param callback: The Method callback.
 */
database.update = function (tableName, updateCol, updateVal, where, callback) {
    pool.getConnection(function (err, con) {
        if (err) {
            callback(err);
            console.log(err);
        } else {
            var queryStatement = "UPDATE " + tableName + " SET " + updateCol + " = " +
                updateVal + " WHERE " + where;
            con.query(queryStatement, function (err, results, fields) {
                if (err) {
                    callback(err, {});
                    console.log(err);
                } else {
                    callback(false, results);
                }
            });
        }
    });
};
module.exports = database;