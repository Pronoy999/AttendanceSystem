const database = require('./databaseHandler');

class TimeManagement {
   constructor(employeeId) {
      this._employeeId = employeeId > 0 ? employeeId : false;
   }

   /**
    * Method to get the attendance Log for an Employee.
    * @param year: The year.
    * @param month: The month for which the attendance report is required.
    * @returns {Promise<Array>}: The attendance log.
    */
   getAttendanceLog(year, month) {
      return new Promise((resolve, reject) => {
         const date = year + "-" + month + "-%";
         const query = "SELECT employee_id,date ,min(time) as signed_in,if(min(time) <> " +
            "max(time ),max(time),'Did not sign out') as signed_out " +
            "FROM attendance_record GROUP BY employee_id,date having employee_id = " + this._employeeId +
            " AND date IN (SELECT date FROM attendance_record WHERE employee_id = " + this._employeeId + " AND " +
            "date LIKE '" + date + "');";
         database.query(query, (err, result) => {
            if (err) {
               console.error(err);
               reject(err);
            } else {
               resolve(result);
            }
         });
      });
   }

   /**
    * Method to get the number of days present in a month.
    * @param year: The year.
    * @param month: The month.
    * @returns {Promise<Number>} number of days the employee is present.
    */
   getNumberOfDaysPresentInAMonth(year, month) {
      return new Promise((resolve, reject) => {
         const date = year + "-" + month + "-%";
         const query = "SELECT count(id) as id FROM attendance_record WHERE employee_id= " + this._employeeId + " AND log_type = 'signed_in' " +
            "AND date LIKE '" + date + "'";
         database.query(query, (err, result) => {
            if (err) {
               console.error(err);
               reject(err);
            } else {
               if ((result[0].id) > 0) {
                  resolve(result[0].id);
               } else {
                  resolve(0);
               }
            }
         });
      });
   }
}

/**
 * Exporting the module.
 * @type {TimeManagement}
 */
module.exports = TimeManagement;