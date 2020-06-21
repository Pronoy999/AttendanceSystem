package com.pw.hyperxchange.visitormanagement.Activities;

import android.app.Activity;
import android.app.ProgressDialog;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.AppCompatButton;
import android.support.v7.widget.AppCompatTextView;
import android.telephony.PhoneNumberUtils;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.view.inputmethod.InputMethodManager;

import com.android.volley.VolleyError;
import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Helper.Messages;
import com.pw.hyperxchange.visitormanagement.Helper.ParamsCreator;
import com.pw.hyperxchange.visitormanagement.Helper.ServerConnector;
import com.pw.hyperxchange.visitormanagement.Objects.DigitText;
import com.pw.hyperxchange.visitormanagement.R;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Arrays;
import java.util.List;

public class OTPDialogActivity extends AppCompatActivity implements ServerConnector.ResponseListener {
    private List<DigitText> mDigitViews;
    private String TAG_CLASS = OTPDialogActivity.class.getSimpleName();

    private char[] mOTPChars = {Constants.DEFAULT_OTP_CHAR,
            Constants.DEFAULT_OTP_CHAR,
            Constants.DEFAULT_OTP_CHAR, Constants.DEFAULT_OTP_CHAR};

    private AppCompatButton confirmButton;
    private AppCompatButton cancelButton;
    private AppCompatTextView phoneNumberView;

    private String mPhoneNumber;
    private ProgressDialog _progressDialog;
    private int currentCode;
    private ServerConnector connector;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_otpdialog);

        initializeViews();

        Thread otpThread = new Thread(() -> requestOTP());

        Bundle b = getIntent().getExtras();
        if (b != null) {
            mPhoneNumber = PhoneNumberUtils.formatNumber(b.getString(Constants.PARAM_PHONE_NUMBER), "IN");
            phoneNumberView.setText(mPhoneNumber);
        }

        for (int i = 0; i < 4; i++) {
            final DigitText digit = mDigitViews.get(i);
            final int q = i;
            digit.addTextChangedListener(new TextWatcher() {
                int lenbef = 0;

                @Override
                public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                    lenbef = s.length();
                }

                @Override
                public void onTextChanged(CharSequence s, int start, int before, int count) {
                }

                @Override
                public void afterTextChanged(Editable s) {
                    if (lenbef == 0 && s.length() == 1) {
                        onDigitEntered(q);
                    }
                }
            });

            digit.setOnBackspaceListener(event -> {
                if (digit.getSelectionStart() == 0 && digit.getSelectionEnd() < 1) {
                    onDigitDeleted(q - 1);
                } else {
                    onDigitDeleted(q);
                }
            });
        }

        confirmButton.setOnClickListener(v -> verifyOTP());

        cancelButton.setOnClickListener(v -> {
            setResult(RESULT_CANCELED);
            Messages.toastMessage(OTPDialogActivity.this, "Sign in cancelled.", 10);
            finish();
        });
        otpThread.start();
        confirmButton.setEnabled(false);
    }

    @Override
    public void onBackPressed() {
        setResult(RESULT_CANCELED);
        Messages.toastMessage(OTPDialogActivity.this, "Sign in cancelled.", 10);
        finish();
    }

    private void initializeViews() {
        mDigitViews = Arrays.asList((DigitText) findViewById(R.id.digit1), (DigitText) findViewById(R.id.digit2), (DigitText) findViewById(R.id.digit3), (DigitText) findViewById(R.id.digit4));
        confirmButton = findViewById(R.id.otpConfirm);
        cancelButton = findViewById(R.id.otpCancel);
        phoneNumberView = findViewById(R.id.phoneNumberView);

        _progressDialog = new ProgressDialog(this);
        _progressDialog.setMessage(getResources().getString(R.string.loading));
        _progressDialog.setCancelable(false);
    }

    /**
     * verifies the OTP from the OTP char array {@link OTPDialogActivity#mOTPChars}
     */
    private void verifyOTP() {
        currentCode = Constants.OTP_CHECK_CODE;
        String phoneNumber = mPhoneNumber.replace(" ", "");
        String otpUrl = Constants.URL + "otp?key=" +
                Constants.API_TOKEN + "&" + Constants.JSON_PHONE_NUMBER + "=%2B91"
                + phoneNumber+"&otp="+getOTP();
        connector = new ServerConnector(getApplicationContext(), otpUrl, this);
        _progressDialog.show();
        connector.makeQuery();
    }

    /**
     * fired when an otp digit is entered at the specified {@code index}
     *
     * @param index the index of the entered digit
     */
    private void onDigitEntered(int index) {
        if (index > -1 && index < 4) {
            mOTPChars[index] = mDigitViews.get(index).getText().toString().charAt(0);
            if (index < 3) {
                mDigitViews.get(index + 1).requestFocus();
            } else {
                hideKeyboard(this);
                // verify otp auto?
            }
        }

        if (getOTP().contains(String.valueOf(Constants.DEFAULT_OTP_CHAR))) {
            confirmButton.setEnabled(false);
        } else {
            confirmButton.setEnabled(true);
        }
    }

    /**
     * fired when an otp digit is deleted from the specified {@code index}
     *
     * @param index the index of the deleted digit
     */
    private void onDigitDeleted(int index) {
        if (index > -1 && index < 4) {
            mOTPChars[index] = Constants.DEFAULT_OTP_CHAR;
            mDigitViews.get(index).setText("");
            mDigitViews.get(index).requestFocus();
        }
    }

    /**
     * hides the keyboard from the specified {@code activity}
     *
     * @param activity the activity to hide the keyboard from
     */
    private static void hideKeyboard(Activity activity) {
        InputMethodManager imm = (InputMethodManager) activity
                .getSystemService(Activity.INPUT_METHOD_SERVICE);
        View view = activity.getCurrentFocus();
        if (view == null) {
            view = new View(activity);
        }
        if (imm != null) {
            imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
        }
    }

    /**
     * Constructs and returns the OTP from {@link OTPDialogActivity#mOTPChars} as String
     *
     * @return string containing the OTP.
     */
    private String getOTP() {
        return new String(mOTPChars);
    }

    /**
     * Method to Request the OTP.
     */
    private void requestOTP() {
        String phoneNumber = mPhoneNumber.replace(" ", "");
        String url = Constants.URL + "otp?key=" + Constants.API_TOKEN;
        connector = new ServerConnector(getApplicationContext(),
                url,
                this);
        runOnUiThread(() -> _progressDialog.show());
        currentCode = Constants.OTP_REQUEST_CODE;
        connector.makeQuery(ParamsCreator.getParamsForOtpRequest(phoneNumber));
    }

    @Override
    public void onResponse(JSONObject object) {
        _progressDialog.dismiss();
        if (currentCode == Constants.OTP_REQUEST_CODE) {
            try {
                String response = object.getString(Constants.JSON_RESPONSE);
                if (response.equalsIgnoreCase("OTP Send.") || response.equalsIgnoreCase("New OTP Send.")) {
                    Messages.logMessage(TAG_CLASS, "OTP Send.");
                } else {
                    //requestOTP();
                }
            } catch (JSONException e) {
                Messages.logMessage(TAG_CLASS, e.toString());
            }
        } else if (currentCode == Constants.OTP_CHECK_CODE) {
            try {
                boolean isValidOtp = object.getBoolean(Constants.JSON_RESPONSE);
                if (isValidOtp) {
                    setResult(RESULT_OK);
                    finish();
                } else {
                    Messages.toastMessage(getApplicationContext(), "Incorrect OTP");
                    mDigitViews.clear();
                }
            } catch (JSONException e) {
                Messages.logMessage(TAG_CLASS, e.toString());
            }
        }
    }

    @Override
    public void onErrorResponse(VolleyError e) {
        _progressDialog.dismiss();
        Messages.logMessage(TAG_CLASS, e.toString());
        Messages.toastMessage(getApplicationContext(),
                "Something went wrong.");
    }
}
