package com.pw.hyperxchange.visitormanagement.Activities;

import android.app.Dialog;
import android.content.Context;
import android.graphics.drawable.ColorDrawable;
import android.view.Gravity;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;

public class OverlayProgress {

    private Dialog dialog;
    private ProgressBar progressBar;

    public OverlayProgress(Context context) {
        dialog = new Dialog(context);

        if (dialog.getWindow() == null) return;

        dialog.getWindow().requestFeature(Window.FEATURE_NO_TITLE);
        dialog.setCancelable(false);

        RelativeLayout relativeLayout = new RelativeLayout(context);
        RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        relativeLayout.setLayoutParams(layoutParams);
        progressBar = new ProgressBar(context);
        RelativeLayout.LayoutParams layoutParams_progress = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);

        layoutParams_progress.addRule(RelativeLayout.CENTER_HORIZONTAL);
        layoutParams_progress.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);

        LinearLayout.LayoutParams linearlayoutParams_progress = new LinearLayout.LayoutParams(32, 32);

        linearlayoutParams_progress.gravity = Gravity.CENTER;
        progressBar.setLayoutParams(layoutParams_progress);
        progressBar.setBackground(new ColorDrawable(android.graphics.Color.TRANSPARENT));
        progressBar.setPadding(0, 0, 0, 272);

        relativeLayout.addView(progressBar);

        dialog.getWindow().setContentView(relativeLayout, layoutParams);
        dialog.getWindow().setBackgroundDrawable(new ColorDrawable(android.graphics.Color.TRANSPARENT));
    }

    public void show() {
        if (!dialog.isShowing() && dialog != null) {
            dialog.show();
        }
    }

    public void dismiss() {
        if (dialog.isShowing() && dialog != null) {
            dialog.dismiss();
        }
    }

    public void setCancelable(boolean cancelable) {
        dialog.setCancelable(cancelable);
    }


    public void setCanceledOnTouchOutside(boolean flag) {
        dialog.setCanceledOnTouchOutside(flag);
    }

    public void setColor(int colour) {
        progressBar.getIndeterminateDrawable().setColorFilter(colour, android.graphics.PorterDuff.Mode.MULTIPLY);
    }

    public boolean isShowing() {
        return dialog.isShowing();
    }
}
