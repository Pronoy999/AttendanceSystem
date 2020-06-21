package com.pw.hyperxchange.visitormanagement.Helper;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.Service;
import android.support.v4.app.NotificationCompat;
import android.util.Base64;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.pw.hyperxchange.visitormanagement.HXApplication;
import com.pw.hyperxchange.visitormanagement.Objects.Employee;
import com.pw.hyperxchange.visitormanagement.Objects.Visit;
import com.pw.hyperxchange.visitormanagement.Objects.Visitor;
import com.pw.hyperxchange.visitormanagement.R;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Objects;

public class FirebaseMessageRecevier extends FirebaseMessagingService {
    private String TAG_CLASS = FirebaseMessageRecevier.class.getSimpleName();

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Messages.logMessage(FirebaseMessageRecevier.class.getSimpleName(),
                remoteMessage.getData().toString());
        if (Objects.requireNonNull(remoteMessage
                .getData().get(Constants.FIREBASE_CONTENT)).equalsIgnoreCase(Constants.SECURITY_DESIGNATION)) {
            String status = remoteMessage.getData().get(Constants.JSON_RESPONSE);
            try {
                employeeAcceptRejectNotify(new String(Base64
                        .decode(remoteMessage.getData()
                                .get(Constants.FIREBASE_EXTRA), Base64.DEFAULT)), status);
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else if (Objects.requireNonNull(remoteMessage.getData()
                .get(Constants.FIREBASE_CONTENT)).equalsIgnoreCase("Attendance")) {
            String status = remoteMessage.getData().get(Constants.JSON_RESPONSE);
            employeeAttendenceNotify(status);
        } else {
            try {
                JSONObject employeeObject = new JSONObject(new String(Base64
                        .decode(remoteMessage.getData().get(Constants.JSON_RESPONSE), Base64.DEFAULT)));
                JSONObject visitObject = new JSONObject(new String(Base64
                        .decode(remoteMessage.getData().get(Constants.FIREBASE_CONTENT), Base64.DEFAULT)));
                JSONObject visitorObject = new JSONObject(new String(Base64
                        .decode(remoteMessage.getData().get(Constants.FIREBASE_EXTRA), Base64.DEFAULT)));
                Messages.logMessage(TAG_CLASS, visitObject.toString());
                Messages.logMessage(TAG_CLASS, employeeObject.toString());
                Messages.logMessage(TAG_CLASS, visitorObject.toString());
                Visitor visitor = new Visitor(visitorObject.getString(Constants.JSON_FIRST_NAME),
                        visitorObject.getString(Constants.JSON_LAST_NAME),
                        visitorObject.getString(Constants.JSON_MOBILE_NUMBER_COLUMN),
                        String.format(Constants.VISITOR_IMAGE_PATH,
                                visitorObject.getString(Constants.JSON_MOBILE_NUMBER_COLUMN)),
                        visitorObject.getInt(Constants.JSON_PARKING) != 0);
                Employee employee = new Employee(employeeObject.getInt(Constants.JSON_EMPLOYEE_ID),
                        employeeObject.getString(Constants.JSON_FIRST_NAME),
                        employeeObject.getString(Constants.JSON_LAST_NAME),
                        employeeObject.getString(Constants.JSON_EMPLOYEE_COMPANY),
                        employeeObject.getString(Constants.JSON_EMPLOYEEE_DESIGNATION),
                        employeeObject.getString(Constants.JSON_EMPLOYEE_LOCATION),
                        employeeObject.getString(Constants.JSON_MOBILE_NUMBER_COLUMN),
                        employeeObject.getString(Constants.JSON_EMPLOYEE_CURRENT_STATUS));
                String timeStamp[];
                timeStamp = visitObject.getString(Constants.JSON_TIME_STAMP).split(",");
                Visit visit = new Visit(visitor, timeStamp[0],
                        visitObject.getInt(Constants.JSON_STATUS),
                        timeStamp[1],
                        visitObject.getString(Constants.JSON_VISIT_PURPOSE),
                        employee);
                visit.showNotification(this);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }

    void employeeAttendenceNotify(String status) {
        Messages.logMessage(TAG_CLASS, status);

        NotificationManager notificationManager = (NotificationManager) this
                .getSystemService(Service.NOTIFICATION_SERVICE);

        NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(this,
                Constants.NOTIFICATION_CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_idcard)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setGroup(Constants.ATTENDENCE_NOTIFICATION_GROUP_ID)
                .setAutoCancel(true)
                .setContentTitle("Scan Successful")
                .setContentText("The attendance scan was successful.");

        Notification noti = mBuilder.build();

        notificationManager.notify(Constants.NOTIFICATION_ID, noti);
    }

    /**
     * To show the notification to the Security for the Visit Status update.
     *
     * @param visitID: The JSON Object.
     * @param status:  The New Status.
     */
    void employeeAcceptRejectNotify(String visitID, String status) {
        HXApplication.VisitLogRefresh r = new HXApplication.VisitLogRefresh() {
            @Override
            public void onRefresh() {
                try {
                    JSONObject visit_id_obj = new JSONObject(visitID);

                    String visitorPhone = visit_id_obj.getString(Constants.JSON_VISITOR_PHONE);
                    int employeeID = visit_id_obj.getInt(Constants.JSON_EMPLOYEE_ID);

                    Visit v = null;

                    for (Visit visit : HXApplication.instance().visits) {
                        if (visit.getVisitor().getPhone().equals(visitorPhone) &&
                                visit.getEmployee().getId() == employeeID &&
                                status.equalsIgnoreCase(Constants.getStatusString(visit.getStatus()))) {
                            v = visit;
                            break;
                        }
                    }

                    if (v != null) {
                        // create notification for the visit and show security
                        v.showNotification(FirebaseMessageRecevier.this);
                    }
                } catch (JSONException ex) {
                    ex.printStackTrace();
                }
            }

            @Override
            public boolean once() {
                return true;
            }
        };

        HXApplication.instance().visitLogRefresh.add(r);
        HXApplication.instance().refreshVisits();
    }
}
