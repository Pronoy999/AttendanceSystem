package com.pw.hyperxchange.visitormanagement.Activities;

import android.Manifest;
import android.annotation.TargetApi;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.RequiresApi;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.view.ContextThemeWrapper;

import com.android.volley.VolleyError;
import com.pw.hyperxchange.visitormanagement.HXApplication;
import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Helper.Messages;
import com.pw.hyperxchange.visitormanagement.Helper.ParamsCreator;
import com.pw.hyperxchange.visitormanagement.Helper.ServerConnector;
import com.pw.hyperxchange.visitormanagement.Objects.Employee;
import com.pw.hyperxchange.visitormanagement.R;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class SplashScreen extends AppCompatActivity implements ServerConnector.ResponseListener {
    private String TAG_CLASS = SplashScreen.class.getSimpleName();
    OverlayProgress _progressDialog;
    ServerConnector connector;
    private int currentCode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash_screen);
        setTheme(R.style.AppTheme);

        initializeViews();
        //checkVersion();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            checkPermissions();
        } else {
            checkVersion();
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            String n_name = "Visit Notifications";
            String n_desc = "Notifications which are sent when a visit is requested by a visitor.";

            HXApplication.NOTIFICATION_CHANNEL = new NotificationChannel(Constants.NOTIFICATION_CHANNEL_ID, n_name, NotificationManager.IMPORTANCE_HIGH);
            HXApplication.NOTIFICATION_CHANNEL.setDescription(n_desc);
            HXApplication.NOTIFICATION_MANAGER = (NotificationManager) this.getSystemService(Context.NOTIFICATION_SERVICE);


            HXApplication.NOTIFICATION_MANAGER.createNotificationChannel(HXApplication.NOTIFICATION_CHANNEL);
        }


        HXApplication.ALARM_MANAGER = (AlarmManager) getSystemService(ALARM_SERVICE);
    }

    /**
     * Method to initializeViews.
     */
    private void initializeViews() {
        _progressDialog = new OverlayProgress(this);
        _progressDialog.setCancelable(false);
    }

    /**
     * Method to change the Activity.
     */
    private void goToLogin() {
        startActivity(new Intent(this, LoginActivity.class));
        finish();
    }

    /**
     * Method to get the Runtime Permissions.
     */
    private void checkPermissions() {
        List<String> permissionsNeeded = new ArrayList<>();
        int cameraPermission = ContextCompat
                .checkSelfPermission(this, Manifest.permission.CAMERA);
        int externalStoragePermission = ContextCompat
                .checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE);
        if (cameraPermission != PackageManager.PERMISSION_GRANTED)
            permissionsNeeded.add(Manifest.permission.CAMERA);
        if (externalStoragePermission != PackageManager.PERMISSION_GRANTED)
            permissionsNeeded.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
        requestPermission(permissionsNeeded.toArray(new String[0]));
        permissionsNeeded = null;
    }

    @TargetApi(Build.VERSION_CODES.M)
    private void requestPermission(String[] permissionsNeeded) {
        Messages.logMessage(TAG_CLASS, permissionsNeeded.length + "");
        if (permissionsNeeded.length > 0) {
            ActivityCompat.requestPermissions(this,
                    permissionsNeeded,
                    Constants.PERMISSION_REQUEST_CODE);
        } else {
            checkVersion();
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        boolean isBreak = false;
        if (requestCode == Constants.PERMISSION_REQUEST_CODE) {
            for (int grantResult : grantResults) {
                if (grantResult == PackageManager.PERMISSION_DENIED) {
                    Messages.toastMessage(getApplicationContext(), "We need all the permissions to function.");
                    isBreak = true;
                    checkPermissions();
                    break;
                }
            }
            if (!isBreak) {
                checkVersion();
            }
        }
    }

    /**
     * Method to get the Details from the Shared Preferences.
     */
    private void getDetails() {
        SharedPreferences preferences = getSharedPreferences(Constants.SHARED_PREFERENCES_NAME, MODE_PRIVATE);
        String phoneNumber = preferences.getString(Constants.EMPLOYEE_PHONE_STORE, "");
        if (phoneNumber.length() > 0) {
            getType(phoneNumber);
        } else {
            goToLogin();
        }
    }

    /**
     * Method to get the Employee Details from the server.
     *
     * @param phoneNumber: the Employee Phone Number.
     */
    private void getType(String phoneNumber) {
        phoneNumber = phoneNumber.substring(3);
        String url = Constants.URL + "log-check?key=" +
                Constants.API_TOKEN + "&mobileNumber=%2B91" + phoneNumber;
        connector = new ServerConnector(getApplicationContext(),
                url, this);
        currentCode = 1;
        connector.makeQuery();
        _progressDialog.show();
    }

    @Override
    public void onResponse(JSONObject object) {
        _progressDialog.dismiss();
        try {
            if (currentCode == 1) {
                String type = object.getString(Constants.JSON_RESPONSE_TYPE);
                if (type.equalsIgnoreCase(Constants.TYPE_EMPLOYEE)) {
                    JSONObject employeeDetails = object.getJSONObject(Constants.JSON_RESPONSE);
                    Employee employee = new Employee(employeeDetails.getInt(Constants.JSON_EMPLOYEE_ID),
                            employeeDetails.getString(Constants.JSON_FIRST_NAME),
                            employeeDetails.getString(Constants.JSON_LAST_NAME),
                            employeeDetails.getString(Constants.JSON_EMPLOYEE_COMPANY),
                            employeeDetails.getString(Constants.JSON_EMPLOYEEE_DESIGNATION),
                            employeeDetails.getString(Constants.JSON_EMPLOYEE_LOCATION),
                            employeeDetails.getString(Constants.JSON_MOBILE_NUMBER_COLUMN),
                            employeeDetails.getString(Constants.JSON_EMPLOYEE_CURRENT_STATUS));
                    Intent intent = new Intent(this, EmployeePortal.class);
                    Bundle bundle = new Bundle();
                    bundle.putParcelable(Constants.PARAM_EMPLOYEE, employee);
                    intent.putExtras(bundle);
                    startActivity(intent);
                    finish();
                } else {
                    goToLogin();
                }
            } else {
                boolean isNewVersion = object.getBoolean(Constants.JSON_RESPONSE);
                if (isNewVersion) {
                    getDetails();
                    Messages.logMessage(TAG_CLASS, "Updated Version.");
                } else {
                    AlertDialog.Builder builder = new AlertDialog.Builder(
                            new ContextThemeWrapper(SplashScreen.this, R.style.AppTheme_Dialog))
                            .setTitle("Update Required")
                            .setMessage(R.string.update_msg)
                            .setPositiveButton("Update", (dialog, which) -> {
                                try {
                                    startActivity(new Intent(Intent.ACTION_VIEW,
                                            Uri.parse("market://details?id=" + getPackageName())));
                                } catch (ActivityNotFoundException e) {
                                    startActivity(new Intent(Intent.ACTION_VIEW,
                                            Uri.parse("https://play.google.com/store/apps/details?id=" + getPackageName())));
                                }
                            })
                            .setCancelable(false)
                            .setIcon(android.R.drawable.ic_dialog_alert);

                    AlertDialog dialog = builder.create();
                    dialog.show();
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
            Messages.logMessage(TAG_CLASS, e.toString());
        }
    }

    @Override
    public void onErrorResponse(VolleyError e) {
        _progressDialog.dismiss();
        if (currentCode == 1)
            goToLogin();
        Messages.toastMessage(getApplicationContext(), "Ops, Something went wrong! ");
    }

    /**
     * Method to check the version.
     */
    private void checkVersion() {
        try {
            PackageInfo packageInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            String url = Constants.URL + "version?key=" + Constants.API_TOKEN;
            connector = new ServerConnector(getApplicationContext(), url, this);
            connector.makeQuery(ParamsCreator
                    .getParamsForVersionCheck(getPackageName(), packageInfo.versionCode));
            currentCode = 0;
        } catch (PackageManager.NameNotFoundException e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
    }
}
