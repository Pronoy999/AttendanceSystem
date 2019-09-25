const database = require('./../databaseHandler');
const Issue = require('./issue');

class Request {
   /**
    * _requestId
    * _imeiNumber
    * @param requestId
    * @param imeiNumber
    */
   constructor(requestId, imeiNumber) {
      requestId = typeof (requestId) !== 'undefined' && requestId > 0 ? requestId : false;
      imeiNumber = typeof (imeiNumber) !== 'undefined' && imeiNumber.length > 0 ? imeiNumber : false;
      if (requestId) {
         this._requestId = requestId;
      }
      if (imeiNumber) {
         this._imeiNumber = imeiNumber;
      }
   }

   /**
    * Private method to insert the issues for the request generated.
    * @param issueDetails: The array containing the issue details.
    * @param requesterId: The person creating the request.
    * @private
    */
   _insertRequestIssues(issueDetails, requesterId) {
      return new Promise((resolve, reject) => {
         const issue = new Issue();
         issue.insertRequestIssues(issueDetails, this._requestId, requesterId, false).then(() => {
            resolve(true);
         }).catch(err => {
            console.error(err);
            reject(err);
         });
      });
   }

   /**
    * Method to get the Request data based on requestId or IMEI number.
    */
   getRequestDetails() {
      return new Promise((resolve, reject) => {
         let query = "SELECT r.imei,r.request_status,r.service_center_id,i.product_price, i.model_name," +
             "i.product_color,i.storage FROM service_request r, inventory i WHERE i.product_imei_1=r.imei";
         if (this._imeiNumber || this._requestId) {
            let whereClaus = (this._imeiNumber) ? "r.imei='" + this._imeiNumber + "'" : "r.id=" + this._requestId;
            query = "SELECT r.id,r.imei,r.request_status,r.requester_id,r.service_center_id,i.issue_id," +
                "i.issue_status,i.solution_id,im.issue_details,sm.solution_details,sm.spare_part_return_required,cm.cost " +
                "FROM service_request r,service_issues i,service_issue_master im,service_solution_master sm," +
                " service_solution_cost_master cm " +
                "WHERE " + whereClaus + " AND i.request_id = r.id AND im.id = i.issue_id AND sm.id = i.solution_id AND" +
                " cm.solution_id = i.solution_id" +
                "  AND cm.vendor_id = r.service_center_id";
         }
         console.log(this._imeiNumber);
         console.log(query);
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
    * Method to create new Request.
    * @param issueDetails: The Issue details.
    * @param requesterId: The Person creating the request.
    * @param serviceCenterId: The service Center selected for the request.
    */
   createNewRequest(issueDetails, requesterId, serviceCenterId) {
      return new Promise((resolve, reject) => {
         const query = "INSERT INTO service_request (imei, requester_id, request_status, service_center_id) VALUES " +
             " ('" + this._imeiNumber + "','" + requesterId + "'," + 5 + "," + serviceCenterId + ")";
         database.query(query, async (err, result) => {
            if (err) {
               console.error(err);
               reject(err);
            } else {
               this._requestId = result.insertId;
               try {
                  await this._insertRequestIssues(issueDetails, requesterId);
                  await this.updateInventoryStatus(serviceCenterId, false);
                  resolve(true);
               } catch (e) {
                  reject(err);
               }
            }
         });
      });
   }

   /**
    * Method to update the status of a service request.
    * It will update the request status if it is specified,
    * else it will increment the value by 1.
    * @param updatedStatus: The status to be updated.
    */
   updateRequestStatus(updatedStatus) {
      return new Promise((resolve, reject) => {
         let query = "UPDATE service_request SET request_status = ";
         query += typeof (updatedStatus) !== 'undefined' && updatedStatus > 0 ? updatedStatus : "(request_status+1)";
         query += " WHERE id= " + this._requestId;
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
    * Method to update the status for the device.
    * @param updatedStatus: The status to be updated to.
    * @param isStock:
    * @returns {Promise<>}
    */
   updateInventoryStatus(updatedStatus, isStock) {
      return new Promise((resolve, reject) => {
         isStock = (isStock) ? "service_stock" : "service_center";
         const query = "UPDATE inventory SET " + isStock + " = " + updatedStatus + " WHERE product_imei_1 ='" + this._imeiNumber + "'";
         console.log(query);
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
 * Exporting the module.
 * @type {Request}
 */
module.exports = Request;