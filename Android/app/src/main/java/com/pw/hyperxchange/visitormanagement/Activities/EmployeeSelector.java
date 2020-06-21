package com.pw.hyperxchange.visitormanagement.Activities;

import android.app.ProgressDialog;
import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;

import com.android.volley.VolleyError;
import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Helper.Messages;
import com.pw.hyperxchange.visitormanagement.Helper.ServerConnector;
import com.pw.hyperxchange.visitormanagement.Objects.Employee;
import com.pw.hyperxchange.visitormanagement.R;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class EmployeeSelector extends AppCompatActivity implements ServerConnector.ResponseListener {
    AutoCompleteTextView _employeeName;
    Button _confirmEmployee;


    HashMap<String, Employee> employeeMap = new HashMap<>();
    List<String> employeeNames = new ArrayList<>();
    ServerConnector connector;
    private String TAG_CLASS = EmployeeSelector.class.getSimpleName();
    ProgressDialog _progressDialog;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_employee_selector);
        initializeViews();
        getEmployeeNames();

        _confirmEmployee.setOnClickListener(v -> {
            if (employeeMap.size() > 0 && employeeMap.containsKey(_employeeName.getText().toString().trim())) {
                Employee emp = employeeMap.get(_employeeName.getText().toString().trim());
                setResult(RESULT_OK, new Intent().putExtra(Constants.PARAM_EMPLOYEE, emp));
                finish();
            } else {
                Messages.toastMessage(this, "Invalid Employee!");
            }
        });
    }

    /**
     * Method to initialize the Views.
     */
    private void initializeViews() {
        _employeeName = findViewById(R.id.employeeSelectorName);
        _confirmEmployee = findViewById(R.id.confirmEmployee);

        _progressDialog = new ProgressDialog(this);
        _progressDialog.setMessage(getResources().getString(R.string.loading));
        _progressDialog.setCancelable(false);
    }

    /**
     * Method to get all the Employee Names.
     */
    private void getEmployeeNames() {
        String url = Constants.URL + "employee?key=" + Constants.API_TOKEN;
        connector = new ServerConnector(getApplicationContext(), url, this);
        _progressDialog.show();
        connector.makeQuery();
    }

    @Override
    public void onResponse(JSONObject object) {
        _progressDialog.dismiss();
        try {
            JSONArray responseArray = object.getJSONArray(Constants.JSON_RESPONSE);
            for (int i = 0; i < responseArray.length(); i++) {
                JSONObject oneEmployee = responseArray.getJSONObject(i);
                employeeMap.put(oneEmployee.getString(Constants.JSON_FIRST_NAME) + " " +
                                oneEmployee.getString(Constants.JSON_LAST_NAME),
                        new Employee(oneEmployee.getInt(Constants.JSON_EMPLOYEE_ID),
                                oneEmployee.getString(Constants.JSON_FIRST_NAME),
                                oneEmployee.getString(Constants.JSON_LAST_NAME),
                                oneEmployee.getString(Constants.JSON_EMPLOYEE_COMPANY),
                                oneEmployee.getString(Constants.JSON_EMPLOYEEE_DESIGNATION),
                                oneEmployee.getString(Constants.JSON_EMPLOYEE_LOCATION),
                                oneEmployee.getString(Constants.JSON_MOBILE_NUMBER_COLUMN),
                                oneEmployee.getString(Constants.JSON_EMPLOYEE_CURRENT_STATUS)));
                employeeNames.add(oneEmployee.getString(Constants.JSON_FIRST_NAME) + " " +
                        oneEmployee.getString(Constants.JSON_LAST_NAME));
            }
            ArrayAdapter<String> adapter = new ArrayAdapter<>(this,
                    android.R.layout.simple_list_item_1, employeeNames);
            _employeeName.setAdapter(adapter);
            _employeeName.setThreshold(1);

        } catch (JSONException e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
    }

    @Override
    public void onErrorResponse(VolleyError e) {
        _progressDialog.dismiss();
        Messages.toastMessage(getApplicationContext(), "Ops, Something went wrong!");
        Messages.logMessage(TAG_CLASS, e.toString());
    }
}