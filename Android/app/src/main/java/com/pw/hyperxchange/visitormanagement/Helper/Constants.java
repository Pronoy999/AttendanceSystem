package com.pw.hyperxchange.visitormanagement.Helper;

import android.annotation.SuppressLint;
import android.graphics.Color;

import com.amazonaws.regions.Regions;
import com.pw.hyperxchange.visitormanagement.R;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.List;

public class Constants {
    public static final String PARAM_PHONE_NUMBER = "phone_number";
    public static final int PHONE_NUMBER_LENGTH = 10;
    public static final int OTP_REQUEST_CODE = 69;
    public static final int OTP_CHECK_CODE = 6969;
    public static final int CHECK_QUERY_CODE = 18;
    public static final int ADD_QUERY_CODE = 19;
    public static final int ATTENDANCE_CODE = 777;
    public static final int VISIT_REQUEST_CODE = 888;
    public static final int EMPLOYEE_SELECT_CODE = 1583;
    public static final int SLOT_REQUEST_CODE = 99;
    public static final int MEETING_BOOK_CODE = 98;
    public static final int MEETING_ACTIVITY_CODE = 1;
    //AWS Details.
    public static final String COGNITO_POOL_ID = "ID";
    public static final String COGNITO_POOL_REGION = Regions.AP_SOUTH_1.getName();
    public static final String BUCKET_NAME = "BUCKET_NAME";
    public static final String BUCKET_REGION = Regions.AP_SOUTH_1.getName();
    public static String AWS_STATE_COMPLETED = "COMPLETED";

    public static final char DEFAULT_OTP_CHAR = ' ';
    public static final int QR_CODE_DIMEN = 320;
    public static final String TAG_OLD_FRAGMENT = "TAG_OLD_FRAGMENT";
    public static final String QR_ACTION_LOGIN = "login";
    public static final String QR_ACTION_LOGOUT = "logout";

    //HX SERVER  URLS
    //public static final String URL = "URLs";
    public static final String URL = "URLs";
    public static final String API_TOKEN = "TOKEN";

    public static final String PARAM_VISIT = "param_visit";
    public static final String VISITOR_IMAGE_PATH = "visitor_images/%s.png";
    public static final String PARAM_QR_DATA = "qr_data";
    public static final int STATUS_PENDING = 3;
    public static final String SIGNED_IN = "signed_in";
    public static final String SIGNED_OUT = "signed_out";
    public static final String EMPLOYEE_CURRENT_STATUS = "current_status";
    public static final String EMPLOYEE_NEW_STATUS = "new_status";
    public static final String EMPLOYEE_TIME_STAMP = "timestamp";
    public static String EMPLOYEE_DEVICE_TOKEN = "";

    public static String getStatusString(int status) {
        if (status == 3)
            return "Pending";
        else if (status == 4)
            return "Accepted";
        else if (status == 5)
            return "Rejected";
        return "Unverified";
    }

    public static int getStatusDrawable(int status) {
        if (status == 3)
            return R.drawable.ic_pending;
        else if (status == 4)
            return R.drawable.ic_accepted;
        else if (status == 5)
            return R.drawable.ic_rejected;
        return R.drawable.round_edge;
    }

    /**
     * Methhod to get the Meeting Room.
     *
     * @param id: the selected ID.
     * @return meeting Room name
     */
    public static String getMeetingRoom(int id) {
        switch (id) {
            case R.id.room1:
                return "meeting_room_1";
            case R.id.room2:
                return "meeting_room_2";
            case R.id.room3:
                return "meeting_room_3";
        }
        return "";
    }

    //JSON Constants.
    public static final String JSON_PHONE_NUMBER = "phoneNumber";
    public static final String JSON_RESPONSE = "res";
    public static final String JSON_MATCH = "match";
    public static final String JSON_RESPONSE_TYPE = "type";
    public static final String TYPE_EMPLOYEE = "Employee";
    public static final String TYPE_VISITOR = "Visitor";
    public static final String JSON_AFFECTED_ROW = "affectedRows";
    public static final String JSON_VISITOR_PHONE = "visitor_phone";
    public static final String JSON_EMPLOYEEE_DESIGNATION = "designation";
    public static final String JSON_EMPLOYEE_LOCATION = "location";
    public static final String JSON_EMPLOYEE_CURRENT_STATUS = "current_status";
    public static final String JSON_EMPLOYEE_ID = "id";
    public static final String JSON_ATTENDANCE_MESSAGE = "Attendance successful.";
    public static final String JSON_TEXT = "text";
    public static final String JSON_TEXT_SEND = "Message Send";
    public static final String JSON_EMPLOYEE_COMPANY = "company";
    public static final String JSON_LOG_TYPE = "log_type";
    public static final String JSON_DATE = "date";
    public static final String JSON_TIME = "time";
    public static final String JSON_TOKEN = "token";
    public static final String JSON_VISIT_PURPOSE = "purpose";
    public static final String JSON_STATUS = "status";
    public static final String JSON_TIME_STAMP = "time_stamp";
    public static final String JSON_MOBILE_NUMBER_COLUMN = "mobile_number";
    public static final String JSON_FIRST_NAME = "first_name";
    public static final String JSON_LAST_NAME = "last_name";
    public static final String JSON_VISITOR_ID = "visitor_id";
    public static final String JSON_PARKING = "is_parking";
    public static final String JSON_VISIT_EMPLOYEE_ID = "employee_id";
    public static final String JSON_PACKAGE = "package";
    public static final String JSON_VERSION = "version";
    public static final String JSON_MEETING_DATE = "meeting_date";
    public static final String JSON_ROOM_ID = "roomID";
    public static final String JSON_ROOM_NAME = "room_name";
    public static final String JSON_CAPACITY = "capacity";
    public static final String JSON_START_DATE = "start_date";
    public static final String JSON_SLOT_START_TIME = "slot_start_time";
    public static final String JSON_SLOT_END_TIME = "slot_end_time";
    public static final String REQUEST_ID = "request_id";
    public static final String SLOT_ID = "slot_id";


    public static final String FIREBASE_CONTENT = "content";
    public static final String FIREBASE_EXTRA = "extra";


    public static final int QR_COLOR_B = Color.BLACK;
    public static final int QR_COLOR_A = Color.WHITE;

    public static final int QR_OVERLAY_DIMEN = 48;

    public static final int CODE_EMPLOYEE_OTP = 3789;
    public static final int CODE_VISITOR_OTP = 7799;
    public static final int FIREBASE_TOKEN_CODE = 13;
    public static final int VISIT_ADD_CODE = 14;

    public static final String PARAM_VISITOR_ENABLED = "visitor_enabled";

    public static final String PARAM_EMPLOYEE = "param_employee";

    public static final String SECURITY_DESIGNATION = "security";

    public static final int CAMERA_REQUEST_CODE = 15123;
    public static final int PERMISSION_REQUEST_CODE = 444;
    public static final int VISIT_LOG_QUERY = 9696;
    public static final String SHARED_PREFERENCES_NAME = "VisitorManagement";
    public static final String EMPLOYEE_PHONE_STORE = "employeePhone";
    public static final String PARAM_CAMERA = "camera_bitmap";
    public static final String TOKEN_EXPIRED_MESSAGE = "Invalid Token or Token Expired.";
    public static final String NOTIFICATION_CHANNEL_ID = "VisitorNotificationChannel";
    public static final String PARAM_NOTIFICATION_ID = "notification_id";
    public static final int NOTIFICATION_ID = 2113;
    public static final String VISIT_NOTIFICATION_GROUP_ID = "com.pw.visitormanagement.notification.visits";
    public static final String ATTENDENCE_NOTIFICATION_GROUP_ID = "com.pw.visitormanagement.notification.visits";
    public static final String ACTION_ACCEPT_NOTIFICATION = "accept_visit";
    public static final String ACTION_CANCEL_NOTIFICATION = "cancel_visit";
    public static final String ACTION_VIEW_VISIT = "view_visit";
    public static final String DATE_FORMAT_STRING = "dd/MM/yyyy HH:mm:ss";
    @SuppressLint("SimpleDateFormat")
    public static final DateFormat DATE_FORMAT = new SimpleDateFormat(Constants.DATE_FORMAT_STRING);

    public static final String ACTION_USB_PERMISSION = "com.pw.hyperxchange.visitormanagement.USB_PERMISSION";
    public static final List<Integer> PRODUCT_IDS = Arrays.asList(0x8220, 0x8225);
    public static final int VENDOR_ID = 0x0bca;

    public static final int FP_PERMISSION_REQUEST_CODE = 553;
    public static final String PARAM_FINGER = "finger_param";
}
