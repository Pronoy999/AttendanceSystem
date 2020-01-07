const TimeManagement = require('./timeManagement');
const database = require('./databaseHandler');
const excel = require('excel4node');
const moment = require('moment');
const constants = require('./Constants');

class ReportGenerator {
   constructor() {
      this._currentHolidayList = [];
   }

   /**
    * Method to check whether it is a Holiday or not.
    * @param date: the date.
    * @param list: the list of holidays.
    * @returns {boolean}: true if holiday, else false.
    * @private
    */
   _isHoliday(date, list) {
      for (let i = 0; i < list.length; i++) {
         if (date === list[i]) {
            return true;
         }
      }
      return false;
   }

   /**
    * Method to generate the current month.
    * @returns {number}
    * @private
    */
   _generateCurrentMonth() {
      return new moment().month();
   }

   /**
    * Method to generate the current year.
    * @returns {number}
    * @private
    */
   _generateCurrentYear() {
      return moment().year();
   }

   /**
    * Method to generate the current month name.
    * @returns {string}: month name.
    * @private
    */
   _generateCurrentMonthName() {
      return new moment().month(this._generateCurrentMonth()).format("MMMM");
   }

   /**
    * Method to check whether the comp Off earned or not.
    * @param date: the dat to be checked.
    * @returns {boolean}: true if present on a holiday else false.
    * @private
    */
   _isCompOff(date) {
      for (let i = 0; i < this._currentHolidayList.length; i++) {
         if (date === this._currentHolidayList[i]) {
            return true;
         }
      }
      return false;
   }

   /**
    * Method to get the working days of a month.
    * @param year: the year.
    * @param month: the month.
    * @returns {Promise<Number>}: the number of working days in that month.
    * @private
    */
   _getWorkingDaysInMonth(year, month) {
      return new Promise((resolve, reject) => {
         const date = year + "-" + month;
         const totalDays = moment(date, "YYYY-MM").daysInMonth();
         const query = "SELECT * FROM holiday_list WHERE is_active=1";
         database.query(query, (err, result) => {
            if (err) {
               console.error(err);
               reject(err);
            } else {
               let holidayList = [];
               for (let i = 0; i < result.length; i++) {
                  holidayList.push(result[i].holiday_date);
               }
               let holidaysInMonth = 0, isEven = 0;
               for (let i = 1; i <= totalDays; i++) {
                  let oneDate = year + "-" + month + "-";
                  if (i < 10) {
                     oneDate += "0" + i;
                  } else {
                     oneDate += i;
                  }
                  const dayOfWeek = moment(oneDate, constants.DATE_ONLY_FORMAT).day();
                  if (dayOfWeek === 0) {
                     holidaysInMonth++;
                     this._currentHolidayList.push(oneDate);
                  } else if (dayOfWeek === 6 && isEven === 0) {
                     isEven = 1;
                  } else if (dayOfWeek === 6 && isEven === 1) {
                     isEven = 0;
                     holidaysInMonth++;
                     this._currentHolidayList.push(oneDate);
                  } else if (this._isHoliday(oneDate, holidayList)) {
                     this._currentHolidayList.push(oneDate);
                     holidaysInMonth++;
                  }
               }
               const totalWorkingDays = totalDays - holidaysInMonth;
               resolve(totalWorkingDays);
            }
         });
      });
   }

   /**
    * Method to generate the report for the Attendance Record.
    * @returns {Promise<Boolean>} true, if excel file is created successfully,else ERROR.
    */
   generateReportForAttendance() {
      return new Promise((resolve, reject) => {
         const query = "SELECT id,first_name,last_name,current_status FROM employee_details WHERE current_status <> 'inactive'";
         database.query(query, async (err, result) => {
            if (err) {
               console.error(err);
               reject(err);
            } else {
               const workbook = new excel.Workbook();
               for (let i = 0; i < result.length; i++) {
                  const oneEmployee = result[i];
                  const employeeName = oneEmployee.first_name + " " + oneEmployee.last_name;
                  const employeeId = oneEmployee.id;
                  let row = 1, col = 3;
                  let worksheet = workbook.addWorksheet(employeeName);
                  worksheet.cell(row, col).string('Attendance Record');
                  row = 4;
                  col = 4;
                  worksheet.cell(row, col).string('Period');
                  const monthName = this._generateCurrentMonthName();
                  let monthNumber = this._generateCurrentMonth() + 1;
                  if (monthNumber < 10) {
                     monthNumber = "0" + monthNumber;
                  }
                  const year = this._generateCurrentYear();
                  col = col + 1;
                  worksheet.cell(row, col).string(monthName + year);
                  row = row + 2;
                  col = col - 1;
                  worksheet.cell(row, col).string("Employee Name:");
                  col = col + 1;
                  worksheet.cell(row, col).string(employeeName);
                  col = col - 1;
                  row = row + 2;
                  const totalWorkingDays = await this._getWorkingDaysInMonth(year, monthNumber);
                  worksheet.cell(row, col).string("Number of Working days in a month: ");
                  col = col + 2;
                  worksheet.cell(row, col).number(totalWorkingDays);
                  let time = new TimeManagement(employeeId);
                  const totalPresentDays = await time.getNumberOfDaysPresentInAMonth(year, monthNumber);
                  col = col - 2;
                  row = row + 2;
                  worksheet.cell(row, col).string("Total Number of days present: ");
                  col = col + 2;
                  worksheet.cell(row, col).number(totalPresentDays);
                  const totalAbsentDays = totalWorkingDays - totalPresentDays;
                  col = col - 2;
                  row = row + 2;
                  worksheet.cell(row, col).string("Total Number of Absent: ");
                  col = col + 2;
                  worksheet.cell(row, col).number(totalAbsentDays);
                  col = col - 2;
                  row = row + 2;
                  let comRow = row;
                  let comCol = col + 1;
                  worksheet.cell(row, col).string("Comp Off Earned: ");
                  row = row + 2;
                  worksheet.cell(row, col).string("The Attendance Record Details are: ");
                  row = row + 2;
                  time = new TimeManagement(employeeId);
                  const attendanceRecord = await time.getAttendanceLog(year, monthNumber);
                  if (attendanceRecord.length > 0) {
                     worksheet.cell(row, col).string("Date");
                     col = col + 1;
                     worksheet.cell(row, col).string("Sign In Time");
                     col = col + 1;
                     worksheet.cell(row, col).string("Sign Out Time");
                     col = col + 1;
                     worksheet.cell(row, col).string("Number of Hours");
                     let compOffEarned = 0;
                     for (let j = 0; j < attendanceRecord.length; j++) {
                        row = row + 1;
                        col = 4;
                        const oneRecord = attendanceRecord[j];
                        const date = oneRecord.date;
                        if (this._isCompOff(date)) {
                           compOffEarned = compOffEarned + 1;
                        }
                        worksheet.cell(row, col).string(date);
                        const inTime = oneRecord.signed_in;
                        col = col + 1;
                        worksheet.cell(row, col).string(inTime.toString());
                        col = col + 1;
                        const outTime = oneRecord.signed_out;
                        worksheet.cell(row, col).string(outTime.toString());
                        const inTimeM = new moment(inTime, "HH:mm:ss");
                        const outTimeM = new moment(outTime, "HH:mm:ss");
                        const workingHour = outTimeM.diff(inTimeM, 'hours');
                        col = col + 1;
                        if (workingHour > 0) {
                           worksheet.cell(row, col).number(workingHour);
                        }
                     }
                     worksheet.cell(comRow, comCol).number(compOffEarned);
                  }
               }
               workbook.write(constants.ATTENDANCE_FILE_NAME);
               resolve(true);
            }
         });
      });
   }
}

module.exports = ReportGenerator;