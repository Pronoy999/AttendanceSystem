package com.pw.hyperxchange.visitormanagement.Adapters;

import android.annotation.SuppressLint;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

import com.pw.hyperxchange.visitormanagement.Objects.Meeting;
import com.pw.hyperxchange.visitormanagement.R;

import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class MeetingAdapter extends ArrayAdapter<Meeting> {

    public MeetingAdapter(Context context, int resource, List<Meeting> objects) {
        super(context, resource, objects);
    }

    @SuppressLint("ViewHolder")
    @NonNull
    @android.support.annotation.NonNull
    @Override
    public View getView(int position, @Nullable @android.support.annotation.Nullable View convertView, @NonNull @android.support.annotation.NonNull ViewGroup parent) {
        View view;
        view = LayoutInflater.from(getContext()).inflate(R.layout.meeting_list_item, parent, false);
        TextView _date = view.findViewById(R.id.meetingItemDate);
        TextView _room = view.findViewById(R.id.meetingItemRoom);
        TextView _slotStart = view.findViewById(R.id.slotStart);
        TextView _slotEnd = view.findViewById(R.id.slotEnd);
        Meeting meeting = getItem(position);
        if (meeting != null) {
            _slotStart.setText(meeting.getSlotStart());
            _slotEnd.setText(meeting.getSlotEnd());
            _date.setText(meeting.getDate());
            _room.setText(meeting.getRoomName());
        }
        return view;
    }
}
