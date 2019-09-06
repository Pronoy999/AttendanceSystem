const database = require('./../databaseHandler');

class Solutions {
   /**
    * _solutionId
    * _issueId
    * _vendorId
    * @param solutionId
    * @param issueId
    * @param vendorId
    */
   constructor(solutionId, issueId, vendorId) {
      solutionId = typeof (solutionId) !== 'undefined' && solutionId > 0 ? solutionId : false;
      issueId = typeof (issueId) !== 'undefined' && issueId > 0 ? issueId : false;
      vendorId = typeof (vendorId) !== 'undefined' && vendorId > 0 ? vendorId : false;
      if (solutionId) {
         this._solutionId = solutionId;
      }
      if (issueId) {
         this._issueId = issueId;
      }
      if (vendorId) {
         this._vendorId = vendorId;
      }
   }

   /**
    * Method to create the Solution for an existing Issue.
    * @param solutionDetails: The Solution Details.
    * @param issueId: The Issue Id.
    * @param isReturnRequired: true if Spare Part return is required.
    * @param costDetails: The Cost details.
    */
   createSolution(solutionDetails, issueId, isReturnRequired, costDetails) {
      return new Promise((resolve, reject) => {
         let spareReturn = isReturnRequired ? "Yes" : "No";
         const query = "INSERT INTO service_solution_master (solution_details, issue_id, spare_part_return_required, created) " +
            "VALUES ('" + solutionDetails + "','" + issueId + "','" + spareReturn + "',NOW())";
         database.query(query, (err, result) => {
            if (err) {
               console.error(err);
               reject(err);
            } else {
               this._solutionId = result.insertId;
               let query = "INSERT INTO service_solution_cost_master (solution_id, vendor_id, cost, created) " +
                  "VALUES (" + costDetails.map(i => this._solutionId + "," + i.vendor_id + ",'" + i.cost + "',NOW()")
                     .join(',') + ")";
               database.query(query, (err, result) => {
                  if (err) {
                     console.error(err);
                     reject(err);
                  } else {
                     resolve(true);
                  }
               });
            }
         });
      });
   }

   /**
    * Method to get the Solutions for a specific Issue Id.
    */
   getSolutions() {
      return new Promise((resolve, reject) => {
         const query = "SELECT m.*, c.cost, c.vendor_id, v.first_name, v.last_name" +
            " FROM service_solution_master m," +
            " service_solution_cost_master c," +
            " vendor_details v" +
            " WHERE m.issue_id = " + this._issueId +
            " AND c.solution_id = m.id" +
            " AND v.vendor_id = c.vendor_id";
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
    * Method to update the cost for an existing Solution and Vendor.
    * @param updatedCost: The New updated cost.
    */
   updateCostForSolution(updatedCost) {
      return new Promise((resolve, reject) => {
         const query = "UPDATE service_solution_cost_master SET cost= " + updatedCost +
            " WHERE solution_id = " + this._solutionId + " AND vendor_id = " + this._vendorId;
         database.query(query, (err, result) => {
            if (err) {
               console.error(err);
               reject(err);
            } else {
               resolve(true);
            }
         });
      });
   }
}

/**
 * Exporting the Solution class.
 * @type {Solutions}
 */
module.exports = Solutions;