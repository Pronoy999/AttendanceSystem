package com.pw.hyperxchange.visitormanagement.Activities;

import android.app.ProgressDialog;
import android.content.res.Resources;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v4.content.res.ResourcesCompat;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.android.volley.VolleyError;
import com.pw.hyperxchange.visitormanagement.HXApplication;
import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Helper.Messages;
import com.pw.hyperxchange.visitormanagement.Helper.ServerConnector;
import com.pw.hyperxchange.visitormanagement.Objects.Attendance;
import com.pw.hyperxchange.visitormanagement.Objects.SquareImageView;
import com.pw.hyperxchange.visitormanagement.R;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Objects;

/**
 * A simple {@link Fragment} subclass.
 * Activities that contain this fragment must implement the
 * to handle interaction events.
 */
public class HomeFragment extends Fragment implements ServerConnector.ResponseListener {
    private String TAG_CLASS = HomeFragment.class.getSimpleName();

    //    private ListView _attendanceList;
    private TextView _currentStatus;
    private SquareImageView _signInSignOutImage;
    private TextView _lastStatusDate;
    private ArrayList<Attendance> attendanceArrayList;
    ProgressDialog _progressDialog;

    public HomeFragment() {
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        attendanceArrayList = new ArrayList<>();
        View view = inflater.inflate(R.layout.fragment_home, container, false);

        _currentStatus = view.findViewById(R.id.currentStatus);
        _signInSignOutImage = view.findViewById(R.id.signInSignOutImage);
        _lastStatusDate = view.findViewById(R.id.lastStatusDate);

        String url = Constants.URL + "/attendance?key=" + Constants.API_TOKEN +
                "&employeeid=" + HXApplication.instance().employee.getId();
        ServerConnector connector = new ServerConnector(getContext(), url, this);
        connector.makeQuery();
        _progressDialog = new ProgressDialog(getContext());
        _progressDialog.setMessage(getResources().getString(R.string.loading));
        _progressDialog.setCancelable(false);
        _progressDialog.show();
        return view;
    }

    @Override
    public void onResponse(JSONObject object) {
        _currentStatus.setText(HXApplication.instance().employee.getCurrentStatus());
        _progressDialog.dismiss();
        try {
            JSONArray jsonArray = object.getJSONArray(Constants.JSON_RESPONSE);

            JSONObject oneObject = jsonArray.getJSONObject(jsonArray.length() - 1);
            Attendance attendance = new Attendance(HXApplication.instance().employee.getId(),
                    oneObject.getString(Constants.JSON_LOG_TYPE),
                    oneObject.getString(Constants.JSON_TIME),
                    oneObject.getString(Constants.JSON_DATE),
                    oneObject.getString(Constants.JSON_EMPLOYEE_LOCATION));
            attendanceArrayList.add(attendance);

            SimpleDateFormat dst = new SimpleDateFormat("dd-MM-yyyy");
            SimpleDateFormat src = new SimpleDateFormat("yyyy-MM-dd");

            Resources reso = Objects.requireNonNull(getActivity()).getResources();

            String lastDate = dst.format(src.parse(attendance.getDate()));
            int statusDrawableId = attendance.getLogType().equalsIgnoreCase(Constants.SIGNED_IN) ? R.drawable.ic_login : R.drawable.ic_logout;
            int statusDrawableTint = attendance.getLogType().equalsIgnoreCase(Constants.SIGNED_IN) ?
                    ResourcesCompat.getColor(reso, android.R.color.holo_green_dark, null) :
                    ResourcesCompat.getColor(reso, android.R.color.holo_red_light, null);
            String status = attendance.getLogType().equalsIgnoreCase(Constants.SIGNED_IN) ? "SIGNED IN" : "SIGNED OUT";

            _currentStatus.setText(status);
            _currentStatus.setTextColor(statusDrawableTint);
            _signInSignOutImage.setImageDrawable(ResourcesCompat.getDrawable(reso, statusDrawableId, null));
            _signInSignOutImage.setColorFilter(statusDrawableTint, android.graphics.PorterDuff.Mode.SRC_IN);
            _lastStatusDate.setText(lastDate);
        } catch (JSONException | ParseException e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
    }

    @Override
    public void onErrorResponse(VolleyError e) {
        _progressDialog.dismiss();
        Messages.toastMessage(getContext(), "Oops, Something went wrong.");
        Messages.logMessage(TAG_CLASS, e.toString());
    }
}
