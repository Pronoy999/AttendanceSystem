package com.pw.hyperxchange.visitormanagement.Objects;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.v4.app.NotificationCompat;
import android.support.v4.content.res.ResourcesCompat;
import android.view.View;
import android.widget.RemoteViews;

import com.android.volley.VolleyError;
import com.bumptech.glide.Glide;
import com.bumptech.glide.request.RequestOptions;
import com.bumptech.glide.request.target.NotificationTarget;
import com.pw.hyperxchange.visitormanagement.Activities.VisitDetailsActivity;
import com.pw.hyperxchange.visitormanagement.HXApplication;
import com.pw.hyperxchange.visitormanagement.Helper.AcceptReceiver;
import com.pw.hyperxchange.visitormanagement.Helper.CancelReceiver;
import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Helper.Messages;
import com.pw.hyperxchange.visitormanagement.Helper.ParamsCreator;
import com.pw.hyperxchange.visitormanagement.Helper.ServerConnector;
import com.pw.hyperxchange.visitormanagement.R;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;

public class Visit implements Parcelable {
    private Visitor visitor;
    private String date;
    private int status;
    private String time;
    private String purpose;
    private Employee employee;
    private String TAG_CLASS = Visit.class.getSimpleName();

    protected Visit(Parcel in) {
        visitor = in.readParcelable(Visitor.class.getClassLoader());
        date = in.readString();
        status = in.readInt();
        time = in.readString();
        purpose = in.readString();
        employee = in.readParcelable(Employee.class.getClassLoader());
    }

    public Visit(Visitor visitor, String date, int status, String time, String purpose, Employee employee) {
        this.visitor = visitor;
        this.date = date;
        this.status = status;
        this.time = time;
        this.purpose = purpose;
        this.employee = employee;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeParcelable(visitor, flags);
        dest.writeString(date);
        dest.writeInt(status);
        dest.writeString(time);
        dest.writeString(purpose);
        dest.writeParcelable(employee, flags);
    }

    @Override
    public int describeContents() {
        return 0;
    }

    public static final Creator<Visit> CREATOR = new Creator<Visit>() {
        @Override
        public Visit createFromParcel(Parcel in) {
            return new Visit(in);
        }

        @Override
        public Visit[] newArray(int size) {
            return new Visit[size];
        }
    };

    /**
     * Method to accept the Visit.
     */
    public void accept() {
        updateServerStatus("Accepted");
    }

    /**
     * Method to reject the Visit.
     */
    public void cancel() {
        updateServerStatus("Rejected");
    }

    /**
     * Method to show the Notification.
     *
     * @param context: The Context of the Application.
     */
    public void showNotification(Context context) {
        NotificationManager notificationManager = (NotificationManager) context
                .getSystemService(Service.NOTIFICATION_SERVICE);

        RemoteViews notifLayout = new RemoteViews(context.getPackageName(), R.layout.visit_notification);
        Intent intent = new Intent(context, VisitDetailsActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        intent.setAction(Constants.ACTION_VIEW_VISIT + getDate() + getTime() + getVisitor().getPhone());
        intent.putExtra(Constants.PARAM_VISIT, this);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);

        if (HXApplication.instance().employee != null && HXApplication.instance().employee.getDesignation().equals(Constants.SECURITY_DESIGNATION)) {
            if (status == 4 || status == 5) {
                notifLayout.setTextColor(R.id.NotiVisitStatusNotice,
                        ResourcesCompat.getColor(context.getResources(),
                                status == 4 ? android.R.color.holo_green_dark :
                                        android.R.color.holo_red_light, null));
                notifLayout.setTextViewText(R.id.NotiVisitStatusNotice,
                        status == 4 ? context.getString(R.string.visit_accepted_security) :
                                context.getString(R.string.visit_rejected_security));
                notifLayout.setViewVisibility(R.id.NotiVisitStatusNotice, View.VISIBLE);
                notifLayout.setViewVisibility(R.id.NotiButtonBar, View.GONE);

                notifLayout.setImageViewResource(R.id.statusNotiIcon, status == 4 ? R.drawable.ic_accepted : R.drawable.ic_rejected);
            }
        } else {
            Intent acceptIntent = new Intent(context, AcceptReceiver.class);
            acceptIntent.setAction(Constants.ACTION_ACCEPT_NOTIFICATION + getDate() + getTime() + getVisitor().getPhone());
            acceptIntent.putExtra(Constants.PARAM_VISIT, this);
            PendingIntent acceptPending = PendingIntent.getBroadcast(context, 0, acceptIntent, PendingIntent.FLAG_UPDATE_CURRENT);

            Intent cancelIntent = new Intent(context, CancelReceiver.class);
            cancelIntent.setAction(Constants.ACTION_CANCEL_NOTIFICATION + getDate() + getTime() + getVisitor().getPhone());
            cancelIntent.putExtra(Constants.PARAM_VISIT, this);
            PendingIntent cancelPending = PendingIntent.getBroadcast(context, 0, cancelIntent, PendingIntent.FLAG_UPDATE_CURRENT);

            notifLayout.setOnClickPendingIntent(R.id.NotiAcceptVisit, acceptPending);
            notifLayout.setOnClickPendingIntent(R.id.NotiCancelVisit, cancelPending);

            notifLayout.setViewVisibility(R.id.NotiVisitStatusNotice, View.GONE);
            notifLayout.setViewVisibility(R.id.NotiButtonBar, View.VISIBLE);
        }

        notifLayout.setTextViewText(R.id.visitorNotiName, visitor.getFirstName() + " " + visitor.getLastName());
        notifLayout.setTextViewText(R.id.visitorNotiPhone, visitor.getPhone());
        notifLayout.setTextViewText(R.id.visitNotiDate, date);
        notifLayout.setTextViewText(R.id.visitNotiTime, time);

        NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(context, Constants.NOTIFICATION_CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_visitor)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)
                .setGroup(Constants.VISIT_NOTIFICATION_GROUP_ID)
                .setAutoCancel(true)
                .setCustomBigContentView(notifLayout);

        Notification noti = mBuilder.build();

        if (notificationManager != null) {
            NotificationTarget notificationTarget = new NotificationTarget(context,
                    R.id.visitorNotiImage, notifLayout,
                    noti, (int) Long.parseLong(visitor.getPhone().substring(3)));

            //Downloading visitor image.
            visitor.downloadImage(context, () -> {
                Glide.with(context.getApplicationContext())
                        .asBitmap()
                        .load(new File(context.getFilesDir(),
                                String.format(Constants.VISITOR_IMAGE_PATH, visitor.getPhone().substring(3))))
                        .apply(new RequestOptions().circleCrop())
                        .into(notificationTarget);
            });
        }
    }

    /**
     * Method to dismiss the notification.
     *
     * @param context: The Context of the application.
     */
    public void cancelNotification(Context context) {
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Service.NOTIFICATION_SERVICE);
        notificationManager.cancel((int) Long.parseLong(visitor.getPhone().substring(3)));
    }

    public Visitor getVisitor() {
        return visitor;
    }

    public Visit setVisitor(Visitor visitor) {
        this.visitor = visitor;
        return this;
    }

    public String getDate() {
        return date;
    }

    public Visit setDate(String date) {
        this.date = date;
        return this;
    }

    public int getStatus() {
        return status;
    }

    public Visit setStatus(int status) {
        this.status = status;
        return this;
    }

    public String getTime() {
        return time;
    }

    public Visit setTime(String time) {
        this.time = time;
        return this;
    }

    public String getPurpose() {
        return purpose;
    }

    public Visit setPurpose(String purpose) {
        this.purpose = purpose;
        return this;
    }

    public Employee getEmployee() {
        return employee;
    }

    public Visit setEmployee(Employee employee) {
        this.employee = employee;
        return this;
    }

    /**
     * Method to update the status of the visit in the server.
     *
     * @param status: the status.
     */
    private void updateServerStatus(String status) {
        String url = Constants.URL + "visit?key=" + Constants.API_TOKEN;
        ServerConnector connector = new ServerConnector(HXApplication.instance(), url, new ServerConnector.ResponseListener() {
            @Override
            public void onResponse(JSONObject object) {
                try {
                    if (object.getBoolean(Constants.JSON_RESPONSE)) {
                        Messages.logMessage(Visit.class.getSimpleName(), "Visit status updated.");
                        HXApplication.instance().refreshVisits(employee);
                    } else {
                        Messages.logMessage("Visit", "Not updated status for visit.");
                    }
                } catch (JSONException e) {
                    Messages.logMessage(Visit.class.getSimpleName(), e.toString());
                }
            }

            @Override
            public void onErrorResponse(VolleyError e) {
                Messages.logMessage("VISIT", e.toString());
            }
        });
        connector.makeQuery(ParamsCreator.getParamsForVisitUpdate(
                this.employee.getId(), this.visitor.getPhone(),
                this.time, this.date, status), true);
    }
}