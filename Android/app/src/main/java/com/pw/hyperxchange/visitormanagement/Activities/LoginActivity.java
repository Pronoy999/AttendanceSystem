package com.pw.hyperxchange.visitormanagement.Activities;

import android.app.ProgressDialog;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.widget.CircularProgressDrawable;
import android.support.v7.app.AppCompatActivity;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;

import com.android.volley.VolleyError;
import com.bumptech.glide.Glide;
import com.bumptech.glide.request.RequestOptions;
import com.pw.hyperxchange.visitormanagement.HXApplication;
import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Helper.Downloader;
import com.pw.hyperxchange.visitormanagement.Helper.Messages;
import com.pw.hyperxchange.visitormanagement.Helper.ParamsCreator;
import com.pw.hyperxchange.visitormanagement.Helper.ServerConnector;
import com.pw.hyperxchange.visitormanagement.Helper.Uploader;
import com.pw.hyperxchange.visitormanagement.Objects.Employee;
import com.pw.hyperxchange.visitormanagement.Objects.Visit;
import com.pw.hyperxchange.visitormanagement.Objects.Visitor;
import com.pw.hyperxchange.visitormanagement.R;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.util.Date;
import java.util.TimeZone;

public class LoginActivity extends AppCompatActivity implements ServerConnector.ResponseListener {
    private EditText mPhoneNumber;
    private View mEmployeeView;
    private View mVisitorView;
    private EditText mVisitorFirstName;
    private EditText mVisitorLastName;
    private ImageView mLoginImageView;
    private TextView mOldVisitorNotice;
    private TextView mNewVisitorNotice;
    private Button mLoginButton;
    private Button mCancelButton;
    private CheckBox _visitorParkingCheckBox;
    private ImageButton mVisitorCameraButton; // todo
    private EditText _purpose;

    private String TAG_CLASS = LoginActivity.class.getSimpleName();

    private int currentCode;
    private ProgressDialog _progressDialog;
    private String phoneNumber;

    private static ColorStateList textViewColorStateList;
    private Visitor visitor;
    private Employee employee;
    private Visit visit;

    private boolean enableVisitorLogin = false;
    private ServerConnector connector;
    private boolean isImageUpdate = false;
    private CircularProgressDrawable loadingDrawable;

    /**
     * Method to initialize the Views.
     */
    private void initializeViews() {
        mPhoneNumber = findViewById(R.id.phoneNumberEdit);
        mEmployeeView = findViewById(R.id.employeeView);
        mVisitorView = findViewById(R.id.visitorView);
        _progressDialog = new ProgressDialog(this);
        _progressDialog.setMessage(getResources().getString(R.string.loading));
        _progressDialog.setCancelable(false);
        _purpose = findViewById(R.id.purposeBox);
        _visitorParkingCheckBox = findViewById(R.id.parkinCheckBox);
        mVisitorFirstName = findViewById(R.id.visitorFirstNameEdit);
        mVisitorLastName = findViewById(R.id.visitorLastNameEdit);
        mLoginImageView = findViewById(R.id.loginImageView);
        mOldVisitorNotice = findViewById(R.id.oldVisitorNotice);
        mNewVisitorNotice = findViewById(R.id.newVisitorNotice);
        mLoginButton = findViewById(R.id.loginButton);
        mCancelButton = findViewById(R.id.cancelLoginButton);

        mVisitorCameraButton = findViewById(R.id.visitorCamButton);

        mCancelButton.setVisibility((enableVisitorLogin =
                HXApplication.instance().employee != null &&
                        HXApplication.instance().employee.getDesignation()
                                .equals(Constants.SECURITY_DESIGNATION)) ? View.VISIBLE : View.GONE);

        loadingDrawable = new CircularProgressDrawable(this);
        loadingDrawable.setStrokeWidth(5f);
        loadingDrawable.setCenterRadius(30f);
        loadingDrawable.start();
    }


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);
        setTitle("Login");
        initializeViews();

        mPhoneNumber.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

            }

            @Override
            public void afterTextChanged(final Editable editS) {
                boolean has91 = editS.toString().trim().startsWith("+91");
                final String s = has91 ? editS.toString().trim().substring(3).trim() : editS.toString().trim();

                if (has91) {
                    mPhoneNumber.setText(s);
                    return;
                }

                clearLogin();
                phoneNumber = s;
                if (s.length() == Constants.PHONE_NUMBER_LENGTH) {
                    validateNumber();
                }
            }
        });

        mLoginButton.setOnClickListener(v -> {
            if (mEmployeeView.getVisibility() == View.GONE && mVisitorView.getVisibility() == View.GONE) {
                Messages.toastMessage(LoginActivity.this,
                        "Please enter your phone number to proceed.", 10);
                return;
            } else if (mVisitorView.getVisibility() == View.VISIBLE) {
                // visitor
                boolean imageExists = new File(getFilesDir(), String.format(Constants.VISITOR_IMAGE_PATH, phoneNumber)).exists();

                if (!imageExists
                        || mVisitorFirstName.getText().toString().isEmpty()
                        || mVisitorLastName.getText().toString().isEmpty() || _purpose.getText().toString().isEmpty()) {
                    // data pending
                    mNewVisitorNotice.setTextColor(Color.RED);
                    mNewVisitorNotice.setVisibility(View.VISIBLE);
                    mOldVisitorNotice.setVisibility(View.GONE);

                    return;
                }
            } // else its an employee

            Bundle b = new Bundle();
            b.putString(Constants.PARAM_PHONE_NUMBER, mPhoneNumber.getText().toString());

            startActivityForResult(new Intent(LoginActivity.this,
                            OTPDialogActivity.class).putExtras(b),
                    mVisitorView.getVisibility() == View.VISIBLE ?
                            Constants.CODE_VISITOR_OTP : Constants.CODE_EMPLOYEE_OTP);
        });

        mCancelButton.setOnClickListener(v -> {
            setResult(RESULT_CANCELED);
            finish();
        });

        textViewColorStateList = mNewVisitorNotice.getTextColors();

        mVisitorCameraButton.setOnClickListener(v -> {
            Glide.with(LoginActivity.this).load(loadingDrawable).into(mLoginImageView);
            startActivityForResult(new Intent(LoginActivity.this, CameraActivity.class)
                    .putExtra(Constants.PARAM_PHONE_NUMBER, phoneNumber), Constants.CAMERA_REQUEST_CODE);
        });
    }

    /**
     * Method to clear the login window.
     */
    private void clearLogin() {
        Glide.with(this).load(R.drawable.ic_user).into(mLoginImageView);
        mEmployeeView.setVisibility(View.GONE);
        mVisitorView.setVisibility(View.GONE);
        mNewVisitorNotice.setTextColor(textViewColorStateList);
        mNewVisitorNotice.setVisibility(View.VISIBLE);
        mOldVisitorNotice.setVisibility(View.GONE);
        mVisitorFirstName.setText("");
        mVisitorFirstName.setEnabled(true);
        mVisitorLastName.setText("");
        mVisitorLastName.setEnabled(true);
        _purpose.getText().clear();
        _visitorParkingCheckBox.setChecked(false);
        _visitorParkingCheckBox.setEnabled(true);
    }

    /**
     * Method to show only the Visitor Details.
     */
    private void showVisitorView() {
        if (enableVisitorLogin) {
            mEmployeeView.setVisibility(View.GONE);
            mVisitorView.setVisibility(View.VISIBLE);
        }
    }

    /**
     * Method to show only the Employee Details.
     */
    private void showEmployeeView() {
        mEmployeeView.setVisibility(View.VISIBLE);
        mVisitorView.setVisibility(View.GONE);
    }


    /**
     * Validates the given phone number
     */
    private void validateNumber() {
        String url = Constants.URL + "log-check?key=" +
                Constants.API_TOKEN + "&mobileNumber=%2B91" + phoneNumber;
        connector = new ServerConnector(getApplicationContext(),
                url, this);
        currentCode = Constants.CHECK_QUERY_CODE;
        connector.makeQuery();
        _progressDialog.show();
    }

    @Override
    public void onResponse(JSONObject object) {
        _progressDialog.dismiss();
        if (currentCode == Constants.CHECK_QUERY_CODE) {
            try {
                String type = object.getString(Constants.JSON_RESPONSE_TYPE);
                if (type.equalsIgnoreCase(Constants.TYPE_EMPLOYEE)) {
                    JSONObject employeeDetails = object.getJSONObject(Constants.JSON_RESPONSE);
                    employee = new Employee(employeeDetails.getInt(Constants.JSON_EMPLOYEE_ID),
                            employeeDetails.getString(Constants.JSON_FIRST_NAME),
                            employeeDetails.getString(Constants.JSON_LAST_NAME),
                            employeeDetails.getString(Constants.JSON_EMPLOYEE_COMPANY),
                            employeeDetails.getString(Constants.JSON_EMPLOYEEE_DESIGNATION),
                            employeeDetails.getString(Constants.JSON_EMPLOYEE_LOCATION),
                            employeeDetails.getString(Constants.JSON_MOBILE_NUMBER_COLUMN),
                            employeeDetails.getString(Constants.JSON_EMPLOYEE_CURRENT_STATUS));

                    showEmployeeView();
                } else if (type.equalsIgnoreCase(Constants.TYPE_VISITOR) && enableVisitorLogin) {
                    try {
                        JSONObject visitorDetails = object.getJSONObject(Constants.JSON_RESPONSE);
                        visitor = new Visitor(visitorDetails.getString(Constants.JSON_FIRST_NAME),
                                visitorDetails.getString(Constants.JSON_LAST_NAME),
                                visitorDetails.getString(Constants.JSON_MOBILE_NUMBER_COLUMN), "",
                                visitorDetails.getInt(Constants.JSON_PARKING) != 0);
                        setVisitorDetails(visitor.getFirstName(), visitor.getLastName(), visitor.getPhone(), visitor.isParking());
                    } catch (JSONException ignored) {
                    }

                    showVisitorView();
                }
            } catch (JSONException e) {
                Messages.logMessage(TAG_CLASS, e.toString());
            }
        } else if (currentCode == Constants.ADD_QUERY_CODE) {
            try {
                String response = object.getString(Constants.JSON_RESPONSE);
                if (response.equalsIgnoreCase("New visitor added.") ||
                        response.equalsIgnoreCase("Visitor may already Exist.")) {
                    startActivityForResult(new Intent(this, EmployeeSelector.class), Constants.EMPLOYEE_SELECT_CODE);
                }
            } catch (Exception e) {
                Messages.logMessage(TAG_CLASS, e.toString());
            }
        } else if (currentCode == Constants.ATTENDANCE_CODE) {
            try {
                String res = object.getString(Constants.JSON_RESPONSE);
                if (res.equalsIgnoreCase(Constants.JSON_ATTENDANCE_MESSAGE)) {
                    Messages.toastMessage(this, "You have been successfully scanned.");
                    finish();
                } else {
                    Messages.toastMessage(getApplicationContext(), "Something went wrong.");
                    finish();
                }
            } catch (JSONException e) {
                Messages.logMessage(TAG_CLASS, e.toString());
            }
        } else if (currentCode == Constants.VISIT_REQUEST_CODE) {
            try {
                String response = object.getString(Constants.JSON_RESPONSE);
                if (response.equalsIgnoreCase(Constants.JSON_TEXT_SEND)) {
                    Messages.toastMessage(this, "Your visit has been requested, " +
                                    "please standby while the visitee approves your visit."
                            /*"You will be notified via SMS once the visit has been approved."*/);
                    setResult(RESULT_OK);
                    finish();
                }
            } catch (Exception e) {
                Messages.logMessage(TAG_CLASS, e.toString());
                finish();
            }
        } else if (currentCode == Constants.VISIT_ADD_CODE) {
            try {
                if (object.getBoolean(Constants.JSON_RESPONSE)) {
                    Messages.toastMessage(getApplicationContext(),
                            employee.getFirstName() + " is Notified.");
                }
            } catch (JSONException e) {
                Messages.logMessage(TAG_CLASS, e.toString());
            }
        }
    }

    @Override
    public void onErrorResponse(VolleyError e) {
        _progressDialog.dismiss();
        Messages.toastMessage(getApplicationContext(), "Something went wrong.");
        Messages.logMessage(TAG_CLASS, e.toString());
    }

    /**
     * Method to set the Visitor Views.
     *
     * @param firstName: The First name of the visitor.
     * @param lastName:  The last name of the visitor.
     */
    private void setVisitorDetails(String firstName, String lastName, final String phoneNumber, boolean isParking) {
        mVisitorFirstName.setText(firstName);
        mVisitorFirstName.setEnabled(false);
        mVisitorLastName.setText(lastName);
        mVisitorLastName.setEnabled(false);
        _visitorParkingCheckBox.setChecked(isParking);
        _visitorParkingCheckBox.setEnabled(false);

        Glide.with(LoginActivity.this).load(loadingDrawable).into(mLoginImageView);

        new Downloader(this,
                new File(getFilesDir(),
                        String.format(Constants.VISITOR_IMAGE_PATH,
                                phoneNumber.substring(3))).getAbsolutePath(),
                new Downloader.DownloadListener() {
                    @Override
                    public void onResponse() {
                        Bitmap bimp = BitmapFactory.decodeFile(new File(getFilesDir(),
                                String.format(Constants.VISITOR_IMAGE_PATH,
                                        phoneNumber.substring(3))).getAbsolutePath());
                        if (bimp != null) {
                            RequestOptions options = new RequestOptions().circleCrop();
                            Glide.with(LoginActivity.this)
                                    .load(bimp).apply(options).into(mLoginImageView);
                        }
                    }

                    @Override
                    public void onError(Exception e) {
                        Glide.with(LoginActivity.this).load(R.drawable.ic_user).into(mLoginImageView);
                    }
                }).downloadFile();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        switch (resultCode) {
            case RESULT_OK: {
                switch (requestCode) {
                    case Constants.CODE_EMPLOYEE_OTP: {
                        if (enableVisitorLogin) {
                            // check in check out page
                            try {
                                String url = Constants.URL + "attendance?key=" + Constants.API_TOKEN;
                                connector = new ServerConnector(getApplicationContext(), url, this);
                                _progressDialog.show();
                                connector.makeQuery(ParamsCreator.getParamsForPutAttendance(employee.getId(), "Kolkata", employee.getCurrentStatus()));
                                currentCode = Constants.ATTENDANCE_CODE;
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        } else {
                            // sign in page
                            Messages.toastMessage(this, "You have been signed in.");
                            startActivity(new Intent(this, EmployeePortal.class).putExtra(Constants.PARAM_EMPLOYEE, employee));
                            finish();
                        }

                        break;
                    }
                    case Constants.CODE_VISITOR_OTP: {
                        Uploader uploader = new Uploader(getApplicationContext(),
                                new File(getFilesDir(), String.format(Constants.VISITOR_IMAGE_PATH, phoneNumber)).getAbsolutePath(),
                                new Uploader.UploadListener() {
                                    @Override
                                    public void onResponse() {
                                        Messages.logMessage(TAG_CLASS, "Upload Complete");
                                    }

                                    @Override
                                    public void onError(Exception e) {
                                        Messages.logMessage(TAG_CLASS, e.toString());
                                        e.printStackTrace();
                                    }
                                });
                        if (isImageUpdate) {
                            isImageUpdate = false;
                            uploader.upload();
                        }

                        if (visitor == null || !visitor.getFirstName()
                                .equals(mVisitorFirstName.getText().toString()) ||
                                !visitor.getLastName().equals(mVisitorLastName.getText().toString())) {
                            addVisitor(visitor);
                        } else {
                            startActivityForResult(new Intent(this, EmployeeSelector.class), Constants.EMPLOYEE_SELECT_CODE);
                            // .putExtra(Constants.PARAM_EMPLOYEE, employee)
                        }
                        break;
                    }
                    case Constants.EMPLOYEE_SELECT_CODE: {
                        if (data != null && data.getExtras() != null) {
                            Employee emp = data.getExtras().getParcelable(Constants.PARAM_EMPLOYEE);
                            String url = Constants.URL + "text?key=" + Constants.API_TOKEN;
                            _progressDialog.show();
                            Constants.DATE_FORMAT.setTimeZone(TimeZone.getDefault());
                            String formattedTime = Constants.DATE_FORMAT.format(new Date(System.currentTimeMillis()));
                            String date = formattedTime.split(" ")[0];
                            String time = formattedTime.split(" ")[1];
                            visit = new Visit(visitor, date, 3, time, _purpose.getText().toString(), emp);
                            addVisitDetails(emp);
                            connector = new ServerConnector(getApplicationContext(), url, this);
                            currentCode = Constants.VISIT_REQUEST_CODE;
                            connector.makeQuery(ParamsCreator
                                    .getParamsForVisitRequestSMS(emp.getPhone(),
                                            visitor.getFirstName() + " " + visitor.getLastName()));
                            _progressDialog.show();
                        }
                        break;
                    }
                    case Constants.CAMERA_REQUEST_CODE: {
                        isImageUpdate = true;
                        Bitmap bimp = BitmapFactory.decodeFile(new File(getFilesDir(), String.format(Constants.VISITOR_IMAGE_PATH, phoneNumber)).getAbsolutePath());

                        if (bimp != null) {
                            RequestOptions options = new RequestOptions().circleCrop();

                            Glide.with(LoginActivity.this).load(bimp).apply(options).into(mLoginImageView);
                        }
                        break;
                    }
                }
                break;
            }
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    /**
     * Method to add a new Visitor.
     *
     * @param visitor: The Visitor Object to be added.
     */
    private void addVisitor(Visitor visitor) {
        if (visitor == null) {
            this.visitor = new Visitor(mVisitorFirstName.getText().toString(),
                    mVisitorLastName.getText().toString(), "+91" + phoneNumber,
                    "", _visitorParkingCheckBox.isChecked());
        }
        JSONObject postObject = ParamsCreator.getParamsForAddVisitor(this.visitor);
        String url = Constants.URL + "visitor?key=" + Constants.API_TOKEN;
        connector = new ServerConnector(getApplicationContext(), url, this);
        connector.makeQuery(postObject);
        currentCode = Constants.ADD_QUERY_CODE;
    }

    /**
     * Method to add the visit.
     */
    private void addVisitDetails(Employee emp) {
        String url = Constants.URL + "visit?key=" + Constants.API_TOKEN;
        connector = new ServerConnector(getApplicationContext(), url, this);
        currentCode = Constants.VISIT_ADD_CODE;
        connector.makeQuery(ParamsCreator.getParamsForInsertVisit(emp, visit));
    }
}