package com.pw.hyperxchange.visitormanagement.Helper;

import com.pw.hyperxchange.visitormanagement.HXApplication;
import com.pw.hyperxchange.visitormanagement.Objects.Employee;
import com.pw.hyperxchange.visitormanagement.Objects.Visit;
import com.pw.hyperxchange.visitormanagement.Objects.Visitor;

import org.json.JSONException;
import org.json.JSONObject;


public class ParamsCreator {
    private static String TAG_CLASS = ParamsCreator.class.getSimpleName();

    /**
     * Method to create the Params for requesting the OTP.
     *
     * @param phoneNumber: The Phone Number where the OTP to be send.
     * @return params: The Params for the Phone.
     */
    public static JSONObject getParamsForOtpRequest(String phoneNumber) {
        JSONObject params = new JSONObject();
        try {
            phoneNumber = "+91" + phoneNumber;
            params.put(Constants.JSON_PHONE_NUMBER, phoneNumber);
        } catch (Exception e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
        return params;
    }


    /**
     * Method to get the Params for Visitor Add.
     *
     * @param visitor: The Visitor Object.
     * @return jsonObject for the Visitor.
     */
    public static JSONObject getParamsForAddVisitor(Visitor visitor) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put(Constants.JSON_FIRST_NAME, visitor.getFirstName());
            jsonObject.put(Constants.JSON_LAST_NAME, visitor.getLastName());
            jsonObject.put(Constants.JSON_MOBILE_NUMBER_COLUMN, visitor.getPhone());
            jsonObject.put(Constants.JSON_PARKING, visitor.isParking() ? 1 : 0);
        } catch (JSONException e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
        return jsonObject;
    }

    /**
     * Method to get the params for putting Attendance.
     *
     * @param qr_data: The QR Code scanned.
     * @return jsonObject:
     */
    public static JSONObject getParamsForPutAttendance(JSONObject qr_data) {
        JSONObject attendance_record = new JSONObject();
        try {
            String status = HXApplication.instance().employee.getCurrentStatus();
            attendance_record.put(Constants.JSON_EMPLOYEE_ID, HXApplication.instance().employee.getId());
            attendance_record.put(Constants.JSON_EMPLOYEE_CURRENT_STATUS, status);
            attendance_record.put(Constants.EMPLOYEE_NEW_STATUS, status.equals("signed_in") ?
                    "signed_out" : "signed_in");
            attendance_record.put(Constants.JSON_EMPLOYEE_LOCATION, qr_data.getString("location"));
            attendance_record.put(Constants.EMPLOYEE_TIME_STAMP, qr_data.getString("timestamp"));

        } catch (JSONException e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
        return attendance_record;
    }

    /**
     * Method to get the params for Attendance.
     *
     * @param location:The Location of the office.
     * @return jsonObject:
     */
    public static JSONObject getParamsForPutAttendance(int id, String location, String status) {
        JSONObject attendance_record = new JSONObject();
        try {
            attendance_record.put(Constants.JSON_EMPLOYEE_ID, "" + id);
            attendance_record.put(Constants.JSON_EMPLOYEE_CURRENT_STATUS, status);
            attendance_record.put(Constants.EMPLOYEE_NEW_STATUS, status.equals("signed_in") ?
                    "signed_out" : "signed_in");
            attendance_record.put(Constants.JSON_EMPLOYEE_LOCATION, location);
            attendance_record.put(Constants.EMPLOYEE_TIME_STAMP, System.currentTimeMillis());
        } catch (JSONException e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
        return attendance_record;
    }

    /**
     * Method to get params for Visit Request SMS.
     *
     * @param empPhoneNumber: The Employee Phone Number.
     * @param vistorName:     The Visitor name.
     * @return jsonObject.
     */
    public static JSONObject getParamsForVisitRequestSMS(String empPhoneNumber, String vistorName) {
        JSONObject object = new JSONObject();
        try {
            object.put(Constants.JSON_PHONE_NUMBER, empPhoneNumber);
            String text = vistorName + " is waiting for you for a visit.";
            object.put(Constants.JSON_TEXT, text);
        } catch (JSONException e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
        return object;
    }

    /**
     * Method to get the Params for Visit log.
     *
     * @param location:   The location of the App.
     * @param timestamp:  The Time stamp Filter, else null.
     * @param employeeID: The Employee ID filter, else -1.
     * @param vistorId:   the Visitor ID filter, else -1.
     * @return jsonObject.
     */
    public static JSONObject getParamsForVisitLog(String location, String timestamp, int employeeID, int vistorId) {
        JSONObject jsonObject = new JSONObject();
        try {
            if (location.length() > 0) {
                jsonObject.put(Constants.JSON_EMPLOYEE_LOCATION, location);
            }
            if (timestamp.length() > 0) {
                jsonObject.put(Constants.EMPLOYEE_TIME_STAMP, timestamp);
            }
            if (vistorId > -1) {
                jsonObject.put(Constants.JSON_VISITOR_ID, vistorId);
            }
            if (employeeID > -1) {
                jsonObject.put(Constants.JSON_VISIT_EMPLOYEE_ID, employeeID);
            }
        } catch (JSONException e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
        return jsonObject;
    }

    /**
     * Method to get the params for updating the token.
     *
     * @param token:      The Token to be updated.
     * @param employeeId: The Employee id for which it is to be updated.
     * @return jsonObject: params with the required Details.
     */
    public static JSONObject getParamsForTokenUpdate(String token, String employeeId) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put(Constants.JSON_TOKEN, token);
            jsonObject.put(Constants.JSON_EMPLOYEE_ID, employeeId);
        } catch (Exception e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
        return jsonObject;
    }

    /**
     * Method to create the params for Insert Visit.
     *
     * @param employee: the Employee details.
     * @param visit:    The Visit Details.
     * @return jsonObject.
     */
    public static JSONObject getParamsForInsertVisit(Employee employee, Visit visit) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put(Constants.JSON_EMPLOYEE_ID, employee.getId());
            jsonObject.put(Constants.JSON_EMPLOYEE_LOCATION, employee.getLocation());
            jsonObject.put(Constants.JSON_VISITOR_PHONE, visit.getVisitor().getPhone());
            jsonObject.put(Constants.JSON_VISIT_PURPOSE, visit.getPurpose());
            jsonObject.put(Constants.JSON_TIME, visit.getTime());
            jsonObject.put(Constants.JSON_DATE, visit.getDate());
        } catch (JSONException e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
        return jsonObject;
    }

    /**
     * Method to update the Visit data.
     *
     * @param employeeID:   The Employee ID.
     * @param visitorPhone: The Phone of the visitor.
     * @param time:         The time.
     * @param date:         The date.
     * @param status:       The status to be updated in.
     * @return jsonObject.
     */
    public static JSONObject getParamsForVisitUpdate(int employeeID, String visitorPhone, String time, String date, String status) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put(Constants.JSON_EMPLOYEE_ID, employeeID);
            jsonObject.put(Constants.JSON_TIME, time);
            jsonObject.put(Constants.JSON_DATE, date);
            jsonObject.put(Constants.JSON_VISITOR_PHONE, visitorPhone);
            jsonObject.put(Constants.JSON_STATUS, status);
        } catch (JSONException e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
        return jsonObject;
    }

    /**
     * Method to make the Params for Version Check.
     *
     * @param packageName: the Package Name.
     * @param version:     The Current Version.
     * @return jsonObject.
     */
    public static JSONObject getParamsForVersionCheck(String packageName, int version) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put(Constants.JSON_PACKAGE, packageName);
            jsonObject.put(Constants.JSON_VERSION, version);
        } catch (JSONException e) {
            Messages.logMessage(TAG_CLASS, e.getLocalizedMessage());
        }
        return jsonObject;
    }

    /**
     * Method to make the Parms for Searching Slots.
     *
     * @param room: The room for the meeting.
     * @param date: The date of the meeting.
     * @return jsonObject.
     */
    public static JSONObject getParamsForSlotSearch(String room, String date) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put(Constants.JSON_ROOM_NAME, room);
            jsonObject.put(Constants.JSON_START_DATE, date);
        } catch (JSONException e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
        return jsonObject;
    }

    /**
     * Method to get the params for booking a meeting.
     *
     * @param slotID:     The Slot IDs.
     * @param roomName:   The meeting room
     * @param requestID:  The Meeting Request ID.
     * @param employeeID: The Employee ID.
     * @param date:       the Meeting date.
     * @return jsonObject
     */
    public static JSONObject getParamsForMeetingBook(String slotID, String roomName, String requestID, int employeeID, String date) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put(Constants.REQUEST_ID, requestID);
            jsonObject.put(Constants.SLOT_ID, slotID);
            jsonObject.put(Constants.JSON_VISIT_EMPLOYEE_ID, employeeID);
            jsonObject.put(Constants.JSON_START_DATE, date);
            jsonObject.put(Constants.JSON_ROOM_NAME, roomName);
        } catch (JSONException e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
        Messages.logMessage(TAG_CLASS, jsonObject.toString());
        return jsonObject;
    }
}
