package com.pw.hyperxchange.visitormanagement.Activities;

import android.app.ProgressDialog;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ListView;
import android.widget.TextView;

import com.android.volley.VolleyError;
import com.pw.hyperxchange.visitormanagement.Adapters.MeetingAdapter;
import com.pw.hyperxchange.visitormanagement.HXApplication;
import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Helper.Messages;
import com.pw.hyperxchange.visitormanagement.Helper.ServerConnector;
import com.pw.hyperxchange.visitormanagement.Objects.Meeting;
import com.pw.hyperxchange.visitormanagement.R;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

public class MeetingFragment extends Fragment implements ServerConnector.ResponseListener {
    private ListView _meetingList;
    private ServerConnector connector;
    private String TAG_CLASS = MeetingFragment.class.getSimpleName();
    private ProgressDialog _progressDialog;
    private FloatingActionButton _addMeeting;
    private TextView _emptyView;

    public MeetingFragment() {
        // Required empty public constructor
    }


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_meeting, container, false);
        _meetingList = view.findViewById(R.id.meetingList);
        _emptyView = view.findViewById(R.id.emptyView);
        _addMeeting = view.findViewById(R.id.meetingAdd);
        _progressDialog = new ProgressDialog(getContext());
        _progressDialog.setMessage("Fetching existing meetings...");
        _progressDialog.setCancelable(false);
        getMeetings();
        _addMeeting.setOnClickListener(v ->
                startActivityForResult(new Intent(getContext(), ChooseMeetingRoomActivity.class),
                        Constants.MEETING_ACTIVITY_CODE));
        return view;
    }

    /**
     * Method to get the Existing Meetings.
     */
    private void getMeetings() {
        String url;
        if (HXApplication.instance().employee.getDesignation()
                .equalsIgnoreCase(Constants.SECURITY_DESIGNATION)) {
            url = Constants.URL + "meeting?key=" + Constants.API_TOKEN +
                    "&employee_id=100";
        } else {
            url = Constants.URL + "meeting?key=" + Constants.API_TOKEN +
                    "&employee_id=" + HXApplication.instance().employee.getId();
        }
        connector = new ServerConnector(getContext(), url, this);
        connector.makeQuery();
        _progressDialog.show();
    }


    @Override
    public void onAttach(Context context) {
        super.onAttach(context);
    }

    @Override
    public void onDetach() {
        super.onDetach();
    }

    @Override
    public void onResponse(JSONObject object) {
        _progressDialog.dismiss();
        ArrayList<Meeting> meetingArrayList = new ArrayList<>();
        try {
            JSONArray jsonArray = object.getJSONArray(Constants.JSON_RESPONSE);
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject oneObject = jsonArray.getJSONObject(i);
                if (HXApplication.instance().employee.getDesignation().equalsIgnoreCase(Constants.SECURITY_DESIGNATION)) {
                    meetingArrayList.add(new Meeting(oneObject.getString(Constants.JSON_MEETING_DATE),
                            oneObject.getString(Constants.JSON_ROOM_NAME),
                            oneObject.getString(Constants.JSON_SLOT_START_TIME),
                            oneObject.getString(Constants.JSON_SLOT_END_TIME),
                            oneObject.getString(Constants.JSON_FIRST_NAME)));
                } else {
                    meetingArrayList.add(new Meeting(oneObject.getString(Constants.JSON_MEETING_DATE),
                            oneObject.getString(Constants.JSON_ROOM_NAME),
                            oneObject.getString(Constants.JSON_SLOT_START_TIME),
                            oneObject.getString(Constants.JSON_SLOT_END_TIME), ""));
                }
            }
            MeetingAdapter adapter = new MeetingAdapter(getContext(), R.layout.meeting_list_item, meetingArrayList);
            if (meetingArrayList.size() == 0) {
                _meetingList.setEmptyView(_emptyView);
            } else {
                _meetingList.setAdapter(adapter);
            }
        } catch (JSONException e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
    }

    @Override
    public void onErrorResponse(VolleyError e) {
        _progressDialog.dismiss();
        Messages.logMessage(TAG_CLASS, e.toString());
        Messages.toastMessage(getContext(), "Something went Wrong.");
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == Constants.MEETING_ACTIVITY_CODE) {
            getMeetings();
        }
    }
}
