package com.pw.hyperxchange.visitormanagement.Activities;

import android.app.ProgressDialog;
import android.os.Build;
import android.os.Bundle;
import android.support.design.button.MaterialButton;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.AppCompatButton;
import android.support.v7.widget.AppCompatTextView;
import android.view.Window;
import android.widget.ListView;

import com.android.volley.VolleyError;
import com.pw.hyperxchange.visitormanagement.Adapters.SlotAdapter;
import com.pw.hyperxchange.visitormanagement.HXApplication;
import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Helper.Messages;
import com.pw.hyperxchange.visitormanagement.Helper.ParamsCreator;
import com.pw.hyperxchange.visitormanagement.Helper.ServerConnector;
import com.pw.hyperxchange.visitormanagement.Objects.Slot;
import com.pw.hyperxchange.visitormanagement.R;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

public class MeetingSlotActivity extends AppCompatActivity implements ServerConnector.ResponseListener {
    private ListView _slotList;
    private AppCompatButton _cancelButton;
    private AppCompatTextView _emptyView;
    private MaterialButton _bookButton;
    private ProgressDialog _progressDialog;
    private String meetingRoom, date, slotID, requestID;
    private ServerConnector connector;
    private int currentCode;
    private SlotAdapter slotAdapter;
    private ArrayList<Slot> slotArrayList;
    private String TAG_CLASS = MeetingSlotActivity.class.getSimpleName();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        supportRequestWindowFeature(Window.FEATURE_NO_TITLE);
        setContentView(R.layout.activity_meeting_slot);
        setTitle("");
        initializeViews();
        setFinishOnTouchOutside(false);
        Bundle bundle = getIntent().getExtras();
        if (bundle != null) {
            meetingRoom = bundle.getString(Constants.JSON_ROOM_ID);
            date = bundle.getString(Constants.JSON_START_DATE);
            String url = Constants.URL + "meeting?key=" + Constants.API_TOKEN;
            connector = new ServerConnector(this, url, this);
            currentCode = Constants.SLOT_REQUEST_CODE;
            connector.makeQuery(ParamsCreator.getParamsForSlotSearch(meetingRoom, date));
            _progressDialog.show();
        }
        _bookButton.setOnClickListener(v -> {
            StringBuilder builder = new StringBuilder();
            for (int i = 0; i < slotArrayList.size(); i++) {
                Slot slot = slotAdapter.getItem(i);
                if (slot != null && slot.isSelected())
                    builder.append(slot.getSlotID()).append(",");
            }
            slotID = builder.toString().substring(0, builder.length() - 1);
            String url = Constants.URL + "meeting?key=" + Constants.API_TOKEN;
            connector = new ServerConnector(this, url, this);
            connector.makeQuery(ParamsCreator
                    .getParamsForMeetingBook(slotID, meetingRoom, requestID,
                            HXApplication.instance().employee.getId(), date), true);
            _progressDialog.show();
            currentCode = Constants.MEETING_BOOK_CODE;
        });
        _cancelButton.setOnClickListener(v -> {
            Thread thread = new Thread(this::cancelRequest);
            thread.start();
            finish();
        });
    }

    /**
     * Method to initialize the views.
     */
    private void initializeViews() {
        _slotList = findViewById(R.id.slotList);
        _cancelButton = findViewById(R.id.slotCancel);
        _bookButton = findViewById(R.id.bookRoom);
        _emptyView = findViewById(R.id.slotEmptyView);
        _progressDialog = new ProgressDialog(this);
        _progressDialog.setMessage("Searching for Slots...");
        _progressDialog.setCancelable(false);
    }

    @Override
    public void onResponse(JSONObject object) {
        _progressDialog.dismiss();
        try {
            if (currentCode == Constants.SLOT_REQUEST_CODE) {
                requestID = object.getString(Constants.REQUEST_ID);
                JSONArray slotArray = object.getJSONArray(Constants.JSON_RESPONSE);
                slotArrayList = new ArrayList<>();
                for (int i = 0; i < slotArray.length(); i++) {
                    JSONObject oneObject = slotArray.getJSONObject(i);
                    slotArrayList.add(new Slot(oneObject.getString(Constants.JSON_SLOT_START_TIME),
                            oneObject.getString(Constants.JSON_SLOT_END_TIME),
                            oneObject.getInt(Constants.JSON_EMPLOYEE_ID), false));
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    slotArrayList.sort((o1, o2) -> {
                        if (o1.getSlotID() < o2.getSlotID()) {
                            return -1;
                        } else if (o1.getSlotID() == o2.getSlotID())
                            return 0;
                        return 1;
                    });
                }
                if (slotArrayList.size() > 0) {
                    slotAdapter = new SlotAdapter(this, R.layout.slot_item, slotArrayList);
                    _slotList.setAdapter(slotAdapter);
                    _slotList.setOnItemClickListener((parent, view, position, id) -> {
                        Slot slot = slotAdapter.getItem(position);
                        if (slot != null) {
                            slot.setSelected(!slot.isSelected());
                            slotAdapter.notifyDataSetChanged();
                        }
                    });
                } else {
                    _bookButton.setEnabled(false);
                    _slotList.setEmptyView(_emptyView);
                }
            } else if (currentCode == Constants.MEETING_BOOK_CODE) {
                if (object.getBoolean(Constants.JSON_RESPONSE)) {
                    Messages.toastMessage(getApplicationContext(), "Your meeting has been booked in " + meetingRoom, 1);
                    setResult(RESULT_OK);
                    finish();
                } else {
                    Messages.toastMessage(getApplicationContext(), "Couldn't book meeting Room.");
                    finish();
                }
            }
        } catch (JSONException e) {
            Messages.toastMessage(getApplicationContext(), "Ops, Something went wrong!");
            Messages.logMessage(TAG_CLASS, e.toString());
        }
    }

    @Override
    public void onErrorResponse(VolleyError e) {
        _progressDialog.dismiss();
        Messages.toastMessage(getApplicationContext(), "Ops, Something went wrong!");
        Messages.logMessage(TAG_CLASS, e.toString());
    }

    /**
     * Method to cancel the Request.
     */
    private void cancelRequest() {
        String url = Constants.URL + "meeting?key=" + Constants.API_TOKEN + "&request_id=" + requestID;
        connector = new ServerConnector(this, url, new ServerConnector.ResponseListener() {
            @Override
            public void onResponse(JSONObject object) {
                Messages.logMessage(TAG_CLASS, "Request Canceled.");
            }

            @Override
            public void onErrorResponse(VolleyError e) {
                Messages.logMessage(TAG_CLASS, e.toString());
            }
        });
        connector.makeQuery();
    }

    @Override
    protected void onPause() {
        super.onPause();
        Thread thread = new Thread(this::cancelRequest);
        thread.start();
    }
}
