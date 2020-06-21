package com.pw.hyperxchange.visitormanagement.Objects;

import android.content.Context;
import android.support.annotation.Nullable;
import android.util.AttributeSet;

public class FPLayout extends android.support.v7.widget.AppCompatImageView {
    public FPLayout(Context context) {
        super(context);
    }

    public FPLayout(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
    }

    public FPLayout(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);

        int width = getMeasuredWidth();
        int height = (width * 15 / 11);
        setMeasuredDimension(width, height);
    }
}
