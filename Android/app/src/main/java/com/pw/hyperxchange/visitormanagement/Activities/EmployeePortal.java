package com.pw.hyperxchange.visitormanagement.Activities;

import android.app.ProgressDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.design.widget.NavigationView;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentTransaction;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.ActionBarDrawerToggle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.telephony.PhoneNumberUtils;
import android.view.KeyEvent;
import android.view.MenuItem;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import com.android.volley.VolleyError;
import com.pw.hyperxchange.visitormanagement.HXApplication;
import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Helper.Messages;
import com.pw.hyperxchange.visitormanagement.Helper.ParamsCreator;
import com.pw.hyperxchange.visitormanagement.Helper.ServerConnector;
import com.pw.hyperxchange.visitormanagement.R;

import org.json.JSONException;
import org.json.JSONObject;

public class EmployeePortal extends AppCompatActivity implements NavigationView.OnNavigationItemSelectedListener,
        QRScannerFragment.QRScannerListener, ServerConnector.ResponseListener {
    private DrawerLayout mDrawer;
    private NavigationView mNavView;
    private View mNavHeader;

    private static final String TAG = EmployeePortal.class.getSimpleName();

    private TextView card_employeeName;
    private TextView card_employeePhone;
    private ImageView card_employeeImage;

    private boolean mSignedIn = false;
    private ServerConnector connector;
    ProgressDialog _progressDialog;
    private int currentCode;
    private String TAG_CLASS = EmployeePortal.class.getSimpleName();

    /**
     * Method to initialize.
     */
    private void initializeViews() {
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        setTitle("Home");
        mDrawer = findViewById(R.id.drawer_layout);
        ActionBarDrawerToggle toggle = new ActionBarDrawerToggle(
                this, mDrawer, toolbar, R.string.navigation_drawer_open, R.string.navigation_drawer_close);
        mDrawer.addDrawerListener(toggle);
        toggle.syncState();

        mNavView = findViewById(R.id.nav_view);
        mNavView.setNavigationItemSelectedListener(this);

        mNavHeader = mNavView.getHeaderView(0);

        card_employeeName = mNavHeader.findViewById(R.id.employeeCardName);
        card_employeeImage = mNavHeader.findViewById(R.id.employeeCardImage);
        card_employeePhone = mNavHeader.findViewById(R.id.employeeCardPhone);
        _progressDialog = new ProgressDialog(this);
        _progressDialog.setCancelable(false);
        _progressDialog.setMessage(getResources().getString(R.string.loading));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_employee_portal);

        Bundle b = getIntent().getExtras();
        if (b != null) {
            HXApplication.instance().employee = b.getParcelable(Constants.PARAM_EMPLOYEE);
            if (Constants.EMPLOYEE_DEVICE_TOKEN.length() > 0)
                sendTokenToServer(Constants.EMPLOYEE_DEVICE_TOKEN);

            HXApplication.instance().refreshVisits();
        }

        initializeViews();

        if (HXApplication.instance().employee != null) {
            securitySignIn(HXApplication.instance().employee.getDesignation().equals(Constants.SECURITY_DESIGNATION));
            card_employeeName.setText(String.format("%s %s",
                    HXApplication.instance().employee.getFirstName(),
                    HXApplication.instance().employee.getLastName()));
            card_employeePhone.setText(PhoneNumberUtils.formatNumber(HXApplication.instance().employee.getPhone(), "IN"));
        } else {
            finish();
        }
        //Saving the Details to Shared Preferences.
        saveDetails();
        getVisitQuery();
        FragmentManager fm = getSupportFragmentManager();
        FragmentTransaction ft = fm.beginTransaction();
        if (HXApplication.instance().employee.getDesignation().equalsIgnoreCase(Constants.SECURITY_DESIGNATION)) {
            ft.replace(R.id.employee_content, new QRCodeFragment());
        } else {
            ft.replace(R.id.employee_content, new HomeFragment());
        }
        ft.commit();


    }

    @Override
    public void onBackPressed() {
        if (mDrawer.isDrawerOpen(GravityCompat.START)) {
            mDrawer.closeDrawer(GravityCompat.START);
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public boolean onNavigationItemSelected(@NonNull MenuItem item) {
        mDrawer.closeDrawer(GravityCompat.START);

        final int id = item.getItemId();

        switch (id) {
            case R.id.menu_qrcode: {
                FragmentManager fm = getSupportFragmentManager();
                FragmentTransaction ft = fm.beginTransaction();
                ft.replace(R.id.employee_content, new QRCodeFragment());
                ft.commit();
                break;
            }
            case R.id.menu_sign_in: {
                FragmentManager fm = getSupportFragmentManager();
                FragmentTransaction ft = fm.beginTransaction();
                ft.replace(R.id.employee_content, new QRScannerFragment());
                ft.commit();
                break;
            }
            case R.id.menu_sign_in_common: {
                Bundle b = new Bundle();
                b.putBoolean(Constants.PARAM_VISITOR_ENABLED, true);
                startActivity(new Intent(EmployeePortal.this, LoginActivity.class).putExtras(b));
                break;
            }
            case R.id.menu_visit_log: {
                FragmentManager fm = getSupportFragmentManager();
                FragmentTransaction ft = fm.beginTransaction();
                ft.replace(R.id.employee_content, new VisitLog());
                ft.commit();
                break;
            }
            case R.id.menu_home: {
                FragmentManager fm = getSupportFragmentManager();
                FragmentTransaction ft = fm.beginTransaction();
                ft.replace(R.id.employee_content, new HomeFragment());
                ft.commit();
                break;
            }
            case R.id.menu_meeting: {
                FragmentManager manager = getSupportFragmentManager();
                FragmentTransaction fragmentTransaction = manager.beginTransaction();
                fragmentTransaction.replace(R.id.employee_content, new MeetingFragment());
                fragmentTransaction.commit();
                break;
            }
            default: {
                FragmentManager fm = getSupportFragmentManager();
                FragmentTransaction ft = fm.beginTransaction();
                if (HXApplication.instance().employee.getDesignation().equalsIgnoreCase(Constants.SECURITY_DESIGNATION)) {
                    ft.replace(R.id.employee_content, new QRCodeFragment());
                } else {
                    ft.replace(R.id.employee_content, new HomeFragment());
                }
                ft.commit();
                break;
            }
        }
        return true;
    }


    @Override
    public void onQRCode(String code) {
        try {
            JSONObject qr_data = new JSONObject(code);
            String url = Constants.URL + "attendance?key=" + Constants.API_TOKEN;
            connector = new ServerConnector(getApplicationContext(), url, this);
            _progressDialog.show();
            currentCode = Constants.ATTENDANCE_CODE;
            connector.makeQuery(ParamsCreator.getParamsForPutAttendance(qr_data));

        } catch (JSONException e) {
            e.printStackTrace();

            Messages.toastMessage(this, "Invalid QR Code!");
        }
    }

    public void hideMenuItem(int resID) {
        mNavView.getMenu().findItem(resID).setVisible(false);
    }

    public void showMenuItem(int resID) {
        mNavView.getMenu().findItem(resID).setVisible(true);
    }

    public void securitySignIn(boolean is) {
        if (is) {
            hideMenuItem(R.id.menu_home);
            hideMenuItem(R.id.menu_sign_in);
            showMenuItem(R.id.menu_qrcode);
            showMenuItem(R.id.menu_sign_in_common);
            showMenuItem(R.id.menu_visit_log);
            //hideMenuItem(R.id.menu_card_view);
        } else {
            showMenuItem(R.id.menu_home);
            showMenuItem(R.id.menu_sign_in);
            hideMenuItem(R.id.menu_qrcode);
            hideMenuItem(R.id.menu_sign_in_common);
            showMenuItem(R.id.menu_visit_log);
            //showMenuItem(R.id.menu_card_view);
        }
    }

    @Override
    public void onResponse(JSONObject object) {
        _progressDialog.dismiss();
        if (currentCode == Constants.ATTENDANCE_CODE) {
            try {
                String res = object.getString(Constants.JSON_RESPONSE);
                if (res.equalsIgnoreCase(Constants.JSON_ATTENDANCE_MESSAGE)) {
                    Messages.toastMessage(getApplicationContext(),
                            "You have successfully Scanned.");
                    HXApplication.instance().employee
                            .setCurrentStatus(object.getString(Constants.EMPLOYEE_CURRENT_STATUS));
                    FragmentManager fm = getSupportFragmentManager();
                    FragmentTransaction ft = fm.beginTransaction();
                    if (HXApplication.instance().employee.getDesignation().equalsIgnoreCase(Constants.SECURITY_DESIGNATION)) {
                        ft.replace(R.id.employee_content, new QRCodeFragment());
                    } else {
                        ft.replace(R.id.employee_content, new HomeFragment());
                    }
                    ft.commit();
                } else {
                    Messages.toastMessage(getApplicationContext(), "Ops, Please try again.");
                    Messages.logMessage(TAG_CLASS, object.toString());
                }

            } catch (JSONException e) {
                Messages.logMessage(TAG_CLASS, e.toString());
                Messages.toastMessage(getApplicationContext(), "Something went wrong.");
            }
        } else if (currentCode == Constants.FIREBASE_TOKEN_CODE) {
            try {
                boolean isUpdated = object.getBoolean(Constants.JSON_RESPONSE);
                if (isUpdated) {
                    Messages.logMessage(TAG_CLASS, "Token Updated.");
                } else {
                    Messages.logMessage(TAG_CLASS, "Could not update token.");
                }
            } catch (JSONException e) {
                Messages.logMessage(TAG_CLASS, e.toString());
            }
        }
    }

    @Override
    public void onErrorResponse(VolleyError e) {
        _progressDialog.dismiss();
        Messages.toastMessage(getApplicationContext(), "Ops, Something went wrong.");
        Messages.logMessage(TAG_CLASS, e.toString());
    }

    /**
     * Method to save the Employee Phone to Shared Preferences.
     */
    private void saveDetails() {
        SharedPreferences preferences = getSharedPreferences(Constants.SHARED_PREFERENCES_NAME,
                MODE_PRIVATE);
        SharedPreferences.Editor editor = preferences.edit();
        editor.putString(Constants.EMPLOYEE_PHONE_STORE,
                HXApplication.instance().employee.getPhone());
        editor.apply();
    }

    /**
     * Method to get the Visit Log.
     */
    private void getVisitQuery() {
        if (!HXApplication.instance().employee.getDesignation().equalsIgnoreCase(Constants.SECURITY_DESIGNATION)) {
            String url = Constants.URL + "attendance?key=" + Constants.API_TOKEN +
                    "&employeeid=" + HXApplication.instance().employee.getId();
            connector = new ServerConnector(getApplicationContext(), url, this);
            currentCode = Constants.VISIT_LOG_QUERY;
            connector.makeQuery();
        }
    }

    /**
     * Method to update the Token for FCM.
     *
     * @param token: The Token of the device.
     */
    private void sendTokenToServer(String token) {
        String url = Constants.URL + "firebase-token?key=" + Constants.API_TOKEN;
        ServerConnector connector = new ServerConnector(this, url, new ServerConnector.ResponseListener() {
            @Override
            public void onResponse(JSONObject object) {
                try {
                    boolean isUpdated = object.getBoolean(Constants.JSON_RESPONSE);
                    if (isUpdated) {
                        Messages.logMessage(TAG_CLASS, "Token Updated. ");
                    }
                } catch (Exception e) {
                    Messages.logMessage(TAG_CLASS, e.toString());
                }
            }

            @Override
            public void onErrorResponse(VolleyError e) {
                Messages.logMessage(TAG_CLASS, e.toString());
            }
        });
        connector.makeQuery(ParamsCreator.getParamsForTokenUpdate(token,
                String.valueOf(HXApplication.instance().employee.getId())), true);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            Fragment fragment = getSupportFragmentManager().findFragmentById(R.id.employee_content);
            //Returning to the Home Fragment.
            if (!(fragment instanceof HomeFragment)) {
                FragmentManager fm = getSupportFragmentManager();
                FragmentTransaction ft = fm.beginTransaction();
                if (HXApplication.instance().employee.getDesignation().equalsIgnoreCase(Constants.SECURITY_DESIGNATION)) {
                    ft.replace(R.id.employee_content, new QRCodeFragment());
                } else {
                    ft.replace(R.id.employee_content, new HomeFragment());
                }
                ft.commit();
            } else
                return super.onKeyDown(keyCode, event);
        }
        return true;
    }
}