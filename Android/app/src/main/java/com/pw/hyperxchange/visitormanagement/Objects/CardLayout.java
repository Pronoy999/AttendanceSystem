package com.pw.hyperxchange.visitormanagement.Objects;

import android.content.Context;
import android.support.constraint.ConstraintLayout;
import android.util.AttributeSet;

public class CardLayout extends ConstraintLayout {
    public CardLayout(Context context) {
        super(context);
    }

    public CardLayout(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public CardLayout(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);

        int width = getMeasuredWidth();
        int height = (width * 11 / 16);
        setMeasuredDimension(width, height);
    }
}
