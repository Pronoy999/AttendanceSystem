const database = require('./../databaseHandler');
const message = require('./../Constants');

class Issue {
   /**
    * _issueId
    * _issueDetailsId
    * @param issueId
    * @param issueDetailsId
    */
   constructor(issueId, issueDetailsId) {
      issueId = typeof (issueId) !== 'undefined' && issueId > 0 ? issueId : false;
      issueDetailsId = typeof (issueDetailsId) !== 'undefined' && issueDetailsId > 0 ? issueDetailsId : false;
      if (issueId) {
         this._issueId = issueId;
      }
      if (issueDetailsId) {
         this._issueDetailsId = issueDetailsId;
      }
   }

   /**
    * Method to create the new issues.
    * @param issueDetails: The Issue Details.
    * @param issueType: Either 'Operational' OR 'Cosmetic'
    * @returns {Promise<>}
    */
   createIssueMaster(issueDetails, issueType) {
      return new Promise((resolve, reject) => {
         const query = "INSERT INTO service_issue_master (issue_details, issue_type, created) " +
            "VALUES ('" + issueDetails + "','" + issueType + "',NOW())";
         database.query(query, (err, result) => {
            if (err) {
               console.error(err);
               reject(err);
            } else {
               this._issueId = result.insertId;
               resolve(result.insertId);
            }
         });
      });
   }

   /**
    * Method to get the Issues either by Issue id or all.
    * @returns {Promise<>}
    */
   getIssues() {
      return new Promise((resolve, reject) => {
         let query = "SELECT * FROM service_issue_master";
         if (this._issueId) {
            query += " WHERE id = " + this._issueId;
         }
         database.query(query, (err, result) => {
            if (err) {
               console.log(err);
               reject(err);
            } else {
               resolve(result);
            }
         });
      });
   }

   /**
    * Method to update Existing Issues details.
    * @param issueDetails: The new issue details to be updated.
    * @param issueType: The new Issue type.
    */
   updateIssue(issueDetails, issueType) {
      return new Promise((resolve, reject) => {
         let query = "UPDATE service_issue_master ";
         if (issueType || issueDetails) {
            if (issueDetails && issueType) {
               query += " SET issue_details = '" + issueDetails + "', issue_type = '" + issueType + "'";
            } else if (issueDetails && !issueType) {
               query += " SET issue_details = '" + issueDetails + "'";
            } else if (issueType && !issueDetails) {
               query += " SET issue_type = '" + issueType + "'";
            }
            query += " WHERE id= " + this._issueId;
            database.query(query, (err, result) => {
               if (err) {
                  console.error(err);
                  reject(err);
               } else {
                  resolve(true);
               }
            });
         } else {
            reject(false);
         }
      });
   }

   /**
    * Method to insert the issues for the Request.
    * @param issueDetails: The array containing the issue details.
    * @param requestId: The request id.
    * @param requesterId: The person creating the request.
    * @param isServiceCenter: true for service Center else false.
    * @param status: The issue status.
    * @returns {Promise<>}
    */
   insertRequestIssues(issueDetails, requestId, requesterId, isServiceCenter, status) {
      return new Promise((resolve, reject) => {
         const issueStatus = (status) ? status : 5;
         let remarks = (isServiceCenter) ? "service_center_remarks" : "hx_remarks";
         let query = "INSERT INTO service_issues " +
            "(request_id, issue_id, solution_id, issue_status, requester_id, " + remarks + ", created)" +
            " VALUES " + issueDetails.map(issue => "('" + requestId + "','" + issue.id + "','" + issue.solution_id +
               "'," + issueStatus + "," + requesterId + ",'" + issue.remarks + "',NOW())").join(",");
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
    * Method to get the issues for a IMEI or Request id.
    * @param requestId: The Request Id.
    * @param imei: The imei of the device.
    * @returns {Promise<>}
    */
   getIssuesForRequest(requestId, imei) {
      return new Promise((resolve, reject) => {
         let query = "";
         if (imei) {
            query = "SELECT i.id," +
               " i.request_id," +
               " i.issue_id," +
               " i.solution_id," +
               " i.issue_status," +
               " i.requester_id," +
               " i.is_spare_part_returned," +
               " i.hx_remarks," +
               " i.service_center_remarks," +
               " m.issue_details," +
               " m.issue_type" +
               " FROM service_issues i," +
               " service_issue_master m," +
               " service_request r" +
               " WHERE r.imei = '" + imei + "'" +
               " AND i.request_id = r.id" +
               " AND i.issue_status <> 6" +
               " AND m.id = i.issue_id;";
         } else if (requestId) {
            query = "SELECT i.id," +
               " i.request_id," +
               " i.issue_id," +
               " i.solution_id," +
               " i.issue_status," +
               " i.requester_id," +
               " i.is_spare_part_returned," +
               " i.hx_remarks," +
               " i.service_center_remarks," +
               " m.issue_details," +
               " m.issue_type" +
               " FROM service_issues i," +
               " service_issue_master m" +
               " WHERE i.request_id = " + requestId +
               " AND i.issue_status <> 6" +
               " AND m.id = i.issue_id;";
         }
         console.log(query);
         if (query.length > 0) {
            database.query(query, (err, result) => {
               if (err) {
                  console.error(err);
                  reject(err);
               } else {
                  resolve(result);
               }
            });
         } else {
            reject(message.insufficientData);
         }
      });
   }

   /**
    * Method to update the issue status. It can either from Service center or from HX.
    * @param issueDetails: The array containing the issue details.
    * @param isServiceCenter: true if its from service centre else false.
    * @returns {Promise<any>}
    */
   updateIssueStatus(issueDetails, isServiceCenter, requestId) {
      return new Promise((resolve, reject) => {
         let acceptedQueries = [], rejectedQueries = [];
         if (issueDetails instanceof Array) {
            let isService = (isServiceCenter) ? "service_center_remarks" : "hx_remarks";
            const acceptedIssues = issueDetails.filter(oneIssue => {
               return oneIssue.issue_status === "approve";
            });
            const rejectedIssues = issueDetails.filter(oneIssue => {
               return oneIssue.issue_status === "reject";
            });
            acceptedIssues.map(i => acceptedQueries.push("UPDATE service_issues SET issue_status=1, " +
               isService + "='" + i.remarks + "' WHERE issue_id = " + i.issue_id + " AND request_id= " + requestId));
            rejectedIssues.map(j => rejectedQueries.push("UPDATE service_issues SET issue_status= 2, " +
               isService + "='" + j.remarks + "' WHERE issue_id = " + j.issue_id + " AND request_id= " + requestId));
            let promiseArray = [];
            if (acceptedQueries.length > 0) promiseArray.push(executeQueries(acceptedQueries));
            if (rejectedQueries.length > 0) promiseArray.push(executeQueries(rejectedQueries));
            Promise.all(promiseArray).then(() => {
               resolve(true);
               const Request = require('./request');
               const request = new Request(requestId);
               request.updateRequestStatus(2).then(() => {
                  console.log("request status updated to IN-OFFICE.");
               });
            }).catch(err => {
               reject(err);
            });
         } else {
            reject(false);
         }

         /**
          * Method to execute the queries.
          * @param queries: the array containing the queries.
          * @returns {Promise<any>}
          */
         function executeQueries(queries) {
            return new Promise((resolve, reject) => {
               queries.forEach(oneQuery => {
                  database.query(oneQuery, (err, result) => {
                     if (err) {
                        reject(err);
                     } else {
                        resolve(true);
                     }
                  });
               });
            });
         }
      });
   }
}

/**
 * Exporting the class.
 * @type {Issue}
 */
module.exports = Issue;