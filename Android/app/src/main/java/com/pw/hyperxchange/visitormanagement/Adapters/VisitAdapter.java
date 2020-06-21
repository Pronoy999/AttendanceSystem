package com.pw.hyperxchange.visitormanagement.Adapters;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.content.res.ResourcesCompat;
import android.support.v4.widget.CircularProgressDrawable;
import android.telephony.PhoneNumberUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import com.bumptech.glide.Glide;
import com.bumptech.glide.request.RequestOptions;
import com.pw.hyperxchange.visitormanagement.HXApplication;
import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Objects.Visit;
import com.pw.hyperxchange.visitormanagement.R;

import java.io.File;
import java.util.List;

public class VisitAdapter extends ArrayAdapter<Visit> {
    private CircularProgressDrawable loadingDrawable;

    private class VisitHolder {
        ImageView image;
        TextView name;
        TextView phone;
        TextView date;
        TextView time;
        ImageView status;

        Button accept;
        Button cancel;
    }

    public VisitAdapter(@NonNull Context context, @NonNull List<Visit> objects) {
        super(context, R.layout.visit_notification, objects);
        loadingDrawable = new CircularProgressDrawable(getContext());
        loadingDrawable.setStrokeWidth(5f);
        loadingDrawable.setCenterRadius(30f);
        loadingDrawable.start();
    }

    public VisitAdapter(@NonNull Context context, int resource) {
        super(context, resource);
    }

    public VisitAdapter(@NonNull Context context, int resource, int textViewResourceId) {
        super(context, resource, textViewResourceId);
    }

    public VisitAdapter(@NonNull Context context, int resource, @NonNull Visit[] objects) {
        super(context, resource, objects);
    }

    public VisitAdapter(@NonNull Context context, int resource, int textViewResourceId, @NonNull Visit[] objects) {
        super(context, resource, textViewResourceId, objects);
    }

    public VisitAdapter(@NonNull Context context, int resource, @NonNull List<Visit> objects) {
        super(context, resource, objects);
    }

    public VisitAdapter(@NonNull Context context, int resource, int textViewResourceId, @NonNull List<Visit> objects) {
        super(context, resource, textViewResourceId, objects);
    }

    @NonNull
    @Override
    public View getView(int position, @Nullable View convertView, @NonNull ViewGroup parent) {
        VisitHolder hold;

        if (convertView == null) {
            hold = new VisitHolder();
            LayoutInflater inflater = LayoutInflater.from(getContext());
            convertView = inflater.inflate(R.layout.visit_notification, parent, false);

            hold.name = convertView.findViewById(R.id.visitorNotiName);
            hold.phone = convertView.findViewById(R.id.visitorNotiPhone);
            hold.image = convertView.findViewById(R.id.visitorNotiImage);
            hold.date = convertView.findViewById(R.id.visitNotiDate);
            hold.time = convertView.findViewById(R.id.visitNotiTime);
            hold.accept = convertView.findViewById(R.id.NotiAcceptVisit);
            hold.cancel = convertView.findViewById(R.id.NotiCancelVisit);
            hold.status = convertView.findViewById(R.id.statusNotiIcon);

            convertView.setTag(hold);
        } else {
            hold = (VisitHolder) convertView.getTag();
        }

        final Visit visit = getItem(position);

        if (visit != null) {
            hold.name.setText(String.format("%s %s", visit.getVisitor().getFirstName(), visit.getVisitor().getLastName()));
            hold.phone.setText(PhoneNumberUtils.formatNumber(visit.getVisitor().getPhone(), "IN"));
            hold.date.setText(visit.getDate());
            hold.time.setText(visit.getTime());
            Glide.with(getContext()).load(loadingDrawable).into(hold.image);
            visit.getVisitor().downloadImage(getContext(), new Runnable() {
                @Override
                public void run() {
                    Glide.with(getContext())
                            .load(new File(getContext().getFilesDir(), String.format(Constants.VISITOR_IMAGE_PATH,
                                    visit.getVisitor().getPhone().substring(3))))
                            .apply(new RequestOptions().circleCrop())
                            .into(hold.image);
                }
            });

            String statusString = Constants.getStatusString(visit.getStatus());


            int statusDrawableId = Constants.getStatusDrawable(visit.getStatus());

            hold.status.setImageDrawable(ResourcesCompat.getDrawable(getContext().getResources(), statusDrawableId, null));

            // Unverified
            // Verified
            // Pending
            // Accepted
            // Rejected
            switch (statusString) {
                case "Pending": {
                    if (!HXApplication.instance().employee.getDesignation().equalsIgnoreCase("security")) {
                        hold.accept.setVisibility(View.VISIBLE);
                        hold.cancel.setVisibility(View.VISIBLE);
                    }

                    hold.status.setImageDrawable(ResourcesCompat.getDrawable(getContext().getResources(), R.drawable.ic_pending, null));
                }
                default: {
                    hold.accept.setVisibility(View.GONE);
                    hold.cancel.setVisibility(View.GONE);
                }
            }

            hold.accept.setOnClickListener(v -> {
                visit.accept();
                HXApplication.instance().refreshVisits();
            });
            hold.cancel.setOnClickListener(v -> {
                visit.cancel();
                HXApplication.instance().refreshVisits();
            });
        }

        return convertView;
    }
}
