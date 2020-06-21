package com.pw.hyperxchange.visitormanagement.Adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.CheckedTextView;

import com.pw.hyperxchange.visitormanagement.Objects.Slot;
import com.pw.hyperxchange.visitormanagement.R;

import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class SlotAdapter extends ArrayAdapter<Slot> {
    public class SlotHolder {
        CheckedTextView _checkedTextView;
    }

    public SlotAdapter(Context context, int resource, List<Slot> objects) {
        super(context, resource, objects);
    }

    @NonNull
    @android.support.annotation.NonNull
    @Override
    public View getView(int position, @Nullable @android.support.annotation.Nullable View convertView, @NonNull @android.support.annotation.NonNull ViewGroup parent) {
        SlotHolder slotHolder;
        if (convertView == null) {
            slotHolder = new SlotHolder();
            convertView = LayoutInflater.from(getContext())
                    .inflate(R.layout.slot_item, parent, false);
            slotHolder._checkedTextView = convertView.findViewById(R.id.slot);

            convertView.setTag(slotHolder);
        } else {
            slotHolder = (SlotHolder) convertView.getTag();
        }
        Slot slot = getItem(position);
        String time;
        if (slot != null) {
            time = slot.getStartTime() + " - " + slot.getEndTime();
            slotHolder._checkedTextView.setText(time);
            slotHolder._checkedTextView.setChecked(slot.isSelected());
            slotHolder._checkedTextView.setCheckMarkDrawable(slot.isSelected()
                    ? R.drawable.check_circle : R.drawable.plus_circle);
        }
        return convertView;
    }
}
