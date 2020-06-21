package com.pw.hyperxchange.visitormanagement.Activities;

import android.os.Bundle;
import android.support.v4.content.res.ResourcesCompat;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import com.bumptech.glide.Glide;
import com.bumptech.glide.request.RequestOptions;
import com.pw.hyperxchange.visitormanagement.HXApplication;
import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Objects.SquareImageView;
import com.pw.hyperxchange.visitormanagement.Objects.Visit;
import com.pw.hyperxchange.visitormanagement.R;

import java.io.File;

public class VisitDetailsActivity extends AppCompatActivity {
    private TextView mVisitorName;
    private TextView mVisitorPhone;
    private TextView mVisitDate;
    private TextView mVisitTime;
    private SquareImageView mVisitStatus;
    private Button mAcceptVisit;
    private Button mCancelVisit;
    private ImageView mVisitorImage;
    private TextView mVisitPurpose;
    private View bottomButtonBar;
    private String TAG_CLASS = VisitDetailsActivity.class.getSimpleName();
    Visit mVisit;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_visitor_details);

        initializeViews();

        Bundle b = getIntent().getExtras();
        if (b != null) {
            mVisit = b.getParcelable(Constants.PARAM_VISIT);

            setVisit(mVisit);
        }
    }

    HXApplication.VisitLogRefresh visitRefreshListener = new HXApplication.VisitLogRefresh() {
        @Override
        public void onRefresh() {
            for (Visit x : HXApplication.instance().visits) {
                if (x.getVisitor().getPhone().equals(mVisit.getVisitor().getPhone()) &&
                        x.getEmployee().getId() == mVisit.getEmployee().getId() &&
                        x.getPurpose().equalsIgnoreCase(mVisit.getPurpose()) &&
                        x.getDate().equalsIgnoreCase(mVisit.getDate()) &&
                        x.getTime().equalsIgnoreCase(mVisit.getTime())) {
                    mVisit = x;
                    break;
                }
            }

            setVisit(mVisit);
        }

        @Override
        public boolean once() {
            return true;
        }
    };

    private void setVisit(Visit visit) {
        if (visit != null && visit.getVisitor() != null) {
            mVisitorName.setText(String.format("%s %s", visit.getVisitor().getFirstName(), visit.getVisitor().getLastName()));
            mVisitorPhone.setText(visit.getVisitor().getPhone());
            mVisitDate.setText(visit.getDate());
            mVisitTime.setText(visit.getTime());
            mVisitPurpose.setText(visit.getPurpose());
            Glide.with(HXApplication.instance())
                    .load(new File(getFilesDir(), String.format(Constants.VISITOR_IMAGE_PATH,
                            visit.getVisitor().getPhone().substring(3))))
                    .apply(new RequestOptions().circleCrop()).into(mVisitorImage);
            switch (Constants.getStatusString(visit.getStatus())) {
                case "Accepted": {
                    mVisitStatus.setImageDrawable(ResourcesCompat.getDrawable(getResources(), R.drawable.ic_accepted, null));

                    bottomButtonBar.setVisibility(View.GONE);
                    break;
                }
                case "Rejected": {
                    mVisitStatus.setImageDrawable(ResourcesCompat.getDrawable(getResources(), R.drawable.ic_rejected, null));

                    bottomButtonBar.setVisibility(View.GONE);
                    break;
                }
                default: {
                    mVisitStatus.setImageDrawable(ResourcesCompat.getDrawable(getResources(), R.drawable.ic_pending, null));

                    bottomButtonBar.setVisibility(View.VISIBLE);
                    break;
                }
            }

            mAcceptVisit.setOnClickListener(v -> {
                HXApplication.instance().visitLogRefresh.add(visitRefreshListener);
                visit.accept();
            });

            mCancelVisit.setOnClickListener(v -> {
                HXApplication.instance().visitLogRefresh.add(visitRefreshListener);
                visit.cancel();
            });
        }
    }

    /**
     * Method to initialize the Views.
     */
    private void initializeViews() {
        mVisitorName = findViewById(R.id.visitorName);
        mVisitorPhone = findViewById(R.id.visitorPhone);
        mVisitDate = findViewById(R.id.visitDate);
        mVisitTime = findViewById(R.id.visitTime);
        mVisitStatus = findViewById(R.id.visitStatus);
        mAcceptVisit = findViewById(R.id.visitAccept);
        mCancelVisit = findViewById(R.id.visitCancel);
        mVisitorImage = findViewById(R.id.visitorImage);
        bottomButtonBar = findViewById(R.id.conCanButtonBar);
        mVisitPurpose = findViewById(R.id.visitPurpose);
    }
}
