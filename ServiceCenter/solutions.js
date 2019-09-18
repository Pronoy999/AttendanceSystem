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
    * Method to get the cost for a vendor for a solution ids.
    * @param vendorId: The vendor ids.
    * @param solutionIds: The solution ids.
    * @returns {Promise<unknown>}
    * @private
    */
   _getCostForVendor(vendorId, solutionIds) {
      return new Promise((resolve, reject) => {
         let inClaus;
         if (solutionIds.length > 0) {
            inClaus = " IN (" + solutionIds.map(s => s.solution_id).join(",") + ")";
            const query = "SELECT solution_id,cost FROM service_solution_cost_master WHERE vendor_id = " + vendorId +
               " AND solution_id " + inClaus;
            database.query(query, (err, result) => {
               if (err) {
                  reject(err);
               } else {
                  resolve(result);
               }
            });
         } else {
            reject(false);
         }
      });
   }

   /**
    * Method to get the data formatted according to vendor and their cost with solutions.
    * @param solutionIds: The Solution ids.
    * @param vendorIds: The vendor ids.
    * @returns {Promise<unknown>}
    * @private
    */
   _getVendorCostDetails(solutionIds, vendorIds) {
      return new Promise(async (resolve, reject) => {
         try {
            let result = [];
            for (let i = 0; i < vendorIds.length; i++) {
               let oneData = {};
               const oneVendorId = vendorIds[i].vendor_id;
               oneData.vendor_id = oneVendorId;
               oneData.cost_details = await this._getCostForVendor(oneVendorId, solutionIds);
               result.push(oneData);
            }
            resolve(result);
         } catch (e) {
            reject(e);
         }
      });
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
                  "VALUES " + costDetails.map(i => "(" + this._solutionId + "," + i.vendor_id + ",'" + i.cost + "',NOW())")
                     .join(',');
               console.log(query);
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
         let whereClaus = (this._issueId) ? " WHERE issue_id = " + this._issueId : "";
         const query = "SELECT * FROM service_solution_master " + whereClaus;
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

   /**
    * Method to get the vendor details based on the solution details.
    * @param solutionIds: The array containing the solution ids.
    * @returns {Promise<>}:
    */
   getVendorsForSolutions(solutionIds) {
      return new Promise((resolve, reject) => {
         let query = "SELECT cost.vendor_id" +
            " FROM service_solution_cost_master cost,vendor_details v" +
            " WHERE cost.solution_id IN (" + solutionIds.map(s => s.solution_id).join(",") + ") " +
            " AND v.vendor_id=cost.vendor_id " +
            " GROUP BY cost.vendor_id" +
            " HAVING COUNT(distinct cost.solution_id) = " + solutionIds.length;
         console.log(query);
         database.query(query, (err, result) => {
            if (err) {
               console.error(err);
               reject(err);
            } else {
               this._getVendorCostDetails(solutionIds, result).then(result => {
                  resolve(result);
               }).catch(err => {
                  reject(err);
               });
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