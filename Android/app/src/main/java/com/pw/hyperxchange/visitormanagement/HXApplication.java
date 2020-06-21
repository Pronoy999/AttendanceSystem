package com.pw.hyperxchange.visitormanagement;

import android.app.AlarmManager;
import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Handler;

import com.android.volley.VolleyError;
import com.pw.hyperxchange.visitormanagement.Adapters.VisitAdapter;
import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Helper.Messages;
import com.pw.hyperxchange.visitormanagement.Helper.ServerConnector;
import com.pw.hyperxchange.visitormanagement.Objects.Employee;
import com.pw.hyperxchange.visitormanagement.Objects.Visit;
import com.pw.hyperxchange.visitormanagement.Objects.Visitor;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.ListIterator;


public class HXApplication extends Application implements ServerConnector.ResponseListener {
    public final List<Visit> visits = new ArrayList<>();
    public VisitAdapter visitAdapter;
    public Employee employee;

    private static HXApplication instance;

    public static NotificationManager NOTIFICATION_MANAGER;
    public static NotificationChannel NOTIFICATION_CHANNEL;
    public static AlarmManager ALARM_MANAGER;

    public interface VisitLogRefresh {
        void onRefresh();

        boolean once();
    }

    public List<VisitLogRefresh> visitLogRefresh = new ArrayList<>();

    public static HXApplication instance() {
        return instance;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
    }

    public void refreshVisits() {
        String url;
        if (employee != null) {
            if (employee.getDesignation().equalsIgnoreCase(Constants.SECURITY_DESIGNATION)) {
                url = Constants.URL + "visit-log?key=" + Constants.API_TOKEN + "&id=0";
            } else {
                url = Constants.URL + "visit-log?key=" +
                        Constants.API_TOKEN + "&id=" + employee.getId();
            }
            ServerConnector connector = new ServerConnector(instance(), url, this);
            connector.makeQuery();
        }
    }

    public void refreshVisits(Employee emp) {
        if (emp == null) {
            refreshVisits();
            Messages.logMessage(HXApplication.class.getSimpleName(), "Employee is NULL.***");
            return;
        }

        employee = emp;

        String url;

        if (emp.getDesignation().equalsIgnoreCase(Constants.SECURITY_DESIGNATION)) {
            url = Constants.URL + "visit-log?key=" + Constants.API_TOKEN + "&id=0";
        } else {
            url = Constants.URL + "visit-log?key=" +
                    Constants.API_TOKEN + "&id=" + emp.getId();
        }
        ServerConnector connector = new ServerConnector(instance(), url, this);
        connector.makeQuery();
    }

    @Override
    public void onResponse(JSONObject object) {
        visits.clear();
        try {
            JSONArray jsonArray = object.getJSONArray(Constants.JSON_RESPONSE);
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject oneObject = jsonArray.getJSONObject(i);
                Visitor visitor = new Visitor(
                        oneObject.getString("v_fName"),
                        oneObject.getString("v_lName"),
                        oneObject.getString("v_mobile_number"),
                        "",
                        oneObject.getInt(Constants.JSON_PARKING) == 0);
                String timeDate = oneObject.getString(Constants.JSON_TIME_STAMP);
                String date = timeDate.split(",")[0];
                String time = timeDate.split(",")[1];
                Visit visit;
                if (employee.getDesignation().equalsIgnoreCase(Constants.SECURITY_DESIGNATION)) {
                    Employee employee = new Employee(oneObject.getInt(Constants.JSON_EMPLOYEE_ID),
                            oneObject.getString(Constants.JSON_FIRST_NAME),
                            oneObject.getString(Constants.JSON_LAST_NAME),
                            oneObject.getString(Constants.JSON_EMPLOYEE_COMPANY),
                            oneObject.getString(Constants.JSON_EMPLOYEEE_DESIGNATION),
                            oneObject.getString(Constants.JSON_EMPLOYEE_LOCATION),
                            oneObject.getString(Constants.JSON_MOBILE_NUMBER_COLUMN),
                            oneObject.getString(Constants.JSON_EMPLOYEE_CURRENT_STATUS));
                    visit = new Visit(visitor, date, oneObject.getInt(Constants.JSON_STATUS),
                            time, oneObject.getString(Constants.JSON_VISIT_PURPOSE),
                            employee);
                } else {
                    visit = new Visit(visitor, date, oneObject.getInt(Constants.JSON_STATUS), time,
                            oneObject.getString(Constants.JSON_VISIT_PURPOSE),
                            employee);
                }
                visits.add(visit);
            }
            if (visitAdapter == null) {
                visitAdapter = new VisitAdapter(this, visits);
            }
            new Handler(getMainLooper()).post(() -> visitAdapter.notifyDataSetChanged());
            ListIterator i = visitLogRefresh.listIterator();
            while (i.hasNext()) {
                VisitLogRefresh vlogref = (VisitLogRefresh) i.next();

                vlogref.onRefresh();

                if (vlogref.once())
                    i.remove();
            }
        } catch (JSONException e) {
            Messages.logMessage(HXApplication.class.getSimpleName(), e.toString());
            Messages.toastMessage(instance(), "Something went wrong.");
        }
    }

    @Override
    public void onErrorResponse(VolleyError e) {
        Messages.toastMessage(instance(), "Something went wrong.");
        Messages.logMessage(HXApplication.class.getSimpleName(), Arrays.toString(e.getStackTrace()));
    }
}
