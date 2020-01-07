const moment = require('moment');
const tz = require('moment-timezone');
const generator = {};

/**
 * Method to get the current month.
 * It returns 0 based index.
 * @returns {number}
 */
generator.generateCurrentMonth = () => {
   return new moment().month();
};
/**
 * Method to get the month name of the current month.
 * @returns {string}
 */
generator.generateCurrentMonthName = () => {
   return new moment().month(generator.generateCurrentMonth()).format("MMMM");
};
/**
 * Method to get the number of days in that particular month of the year.
 * @param year: the year.
 * @param month: The month.
 * @returns {number}: the number of days in that month.
 */
generator.generateDaysInMonth = (year, month) => {
   const date = year + "-" + month;
   return new moment(date, "YYYY-MM").daysInMonth();
};
/**
 * Method to get the current year.
 * @returns {number}
 */
generator.generateCurrentYear = () => {
   return moment().year();
};
/**
 * Exporting modules.
 */
module.exports = generator;