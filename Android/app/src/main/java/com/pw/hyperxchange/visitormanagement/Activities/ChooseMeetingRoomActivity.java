package com.pw.hyperxchange.visitormanagement.Activities;

import android.app.DatePickerDialog;
import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.design.button.MaterialButton;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.AppCompatButton;
import android.text.TextUtils;
import android.widget.RadioGroup;

import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Helper.Messages;
import com.pw.hyperxchange.visitormanagement.R;

import java.util.Calendar;

public class ChooseMeetingRoomActivity extends AppCompatActivity {
    private RadioGroup _meetingRoomRadioGroup;
    private AppCompatButton _meetingDate;
    private MaterialButton _submitButton;
    private AppCompatButton _cancelButton;
    private Calendar calendar;
    private String TAG_CLASS = ChooseMeetingRoomActivity.class.getSimpleName();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_choose_meeting_room);
        initializeViews();
        setTitle("Reunión");
        DatePickerDialog.OnDateSetListener dateSetListener = (view, year, month, dayOfMonth) -> {
            String date, monthString = month + "", day = dayOfMonth + "";
            if (month < 10)
                monthString = "0" + month;
            if (dayOfMonth < 10)
                day = "0" + dayOfMonth;
            date = year + "-" + monthString + "-" + day;
            _meetingDate.setText(date);
        };
        _meetingDate.setOnClickListener(v -> {
            DatePickerDialog dpd = new DatePickerDialog(ChooseMeetingRoomActivity.this, dateSetListener,
                    calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH),
                    calendar.get(Calendar.DAY_OF_MONTH));
            dpd.getDatePicker().setMinDate(calendar.getTimeInMillis());
            dpd.show();
        });
        _meetingRoomRadioGroup.setOnCheckedChangeListener((group, checkedId) -> {
            if (group.getCheckedRadioButtonId() == R.id.room1) {
                Messages.toastMessage(getApplicationContext(), "Ideal for 4 or less people");
            } else if (group.getCheckedRadioButtonId() == R.id.room2) {
                Messages.toastMessage(getApplicationContext(), "Ideal for 4 or less people");
            } else if (group.getCheckedRadioButtonId() == R.id.room3) {
                Messages.toastMessage(getApplicationContext(), "Ideal for 5 or more people");
            }
        });
        _submitButton.setOnClickListener(v -> {
            if (TextUtils.isEmpty(_meetingDate.getText()) ||
                    _meetingRoomRadioGroup.getCheckedRadioButtonId() == -1) {
                Messages.toastMessage(ChooseMeetingRoomActivity.this.getApplicationContext(), "Please fill in all the details.");
            } else {
                Bundle bundle = new Bundle();
                bundle.putString(Constants.JSON_ROOM_ID,
                        Constants.getMeetingRoom(_meetingRoomRadioGroup.getCheckedRadioButtonId()));
                bundle.putString(Constants.JSON_START_DATE, _meetingDate.getText().toString());
                ChooseMeetingRoomActivity.this.startActivityForResult(new Intent(ChooseMeetingRoomActivity.this,
                        MeetingSlotActivity.class).putExtras(bundle), Constants.MEETING_ACTIVITY_CODE);
            }
        });
        _cancelButton.setOnClickListener(v -> {
            finish();
        });
    }

    /**
     * Method to initialize the views.
     */
    private void initializeViews() {
        calendar = Calendar.getInstance();
        _meetingDate = findViewById(R.id.meetingDate);
        _meetingRoomRadioGroup = findViewById(R.id.meetingRadioGroup);
        _submitButton = findViewById(R.id.submitRoomButton);
        _cancelButton = findViewById(R.id.meetingCancel);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        if (resultCode == RESULT_OK && requestCode == Constants.MEETING_ACTIVITY_CODE) {
            finish();
        }
    }
}
