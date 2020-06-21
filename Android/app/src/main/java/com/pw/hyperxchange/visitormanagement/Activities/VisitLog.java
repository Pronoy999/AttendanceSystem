package com.pw.hyperxchange.visitormanagement.Activities;


import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ListView;
import android.widget.TextView;

import com.pw.hyperxchange.visitormanagement.HXApplication;
import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Objects.Visit;
import com.pw.hyperxchange.visitormanagement.R;

public class VisitLog extends Fragment {
    private String mFilter = "";
    private ListView _visitList;
    private String TAG_CLASS = VisitLog.class.getSimpleName();
    private TextView _emptyView;

    public VisitLog() {
    }

    public static VisitLog newInstance(String filter) {
        VisitLog fragment = new VisitLog();
        Bundle args = new Bundle();
        args.putString("filter", filter);
        fragment.setArguments(args);

        return fragment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            mFilter = getArguments().getString(mFilter);
        }
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View root = inflater.inflate(R.layout.fragment_visit_log, container, false);
        final Activity activity = getActivity();
        if (root != null) {
            initializeViews(root);

            if (!HXApplication.instance().employee.getDesignation().equalsIgnoreCase("security")) {
                _visitList.setOnItemClickListener((parent, view, position, id) -> {
                    Visit v = HXApplication.instance().visitAdapter.getItem(position);

                    startActivity(new Intent(activity, VisitDetailsActivity.class).putExtra(Constants.PARAM_VISIT, v));
                });
            }
        }
        return root;
    }

    private void initializeViews(View root) {
        _visitList = root.findViewById(R.id.visitList);
        _visitList.setAdapter(HXApplication.instance().visitAdapter);
        _emptyView = root.findViewById(R.id.emptyView);

        /*
        HXApplication.instance().visitLogRefresh = () -> {

        };
        */
        HXApplication.VisitLogRefresh r = new HXApplication.VisitLogRefresh() {
            @Override
            public void onRefresh() {
                if (HXApplication.instance().visits.isEmpty()) {
                    _visitList.setEmptyView(_emptyView);
                }
            }

            @Override
            public boolean once() {
                return false;
            }
        };
        HXApplication.instance().visitLogRefresh.add(r);
        HXApplication.instance().refreshVisits();
    }
}
