package com.pw.hyperxchange.visitormanagement.Objects;

import android.content.Context;
import android.util.AttributeSet;
import android.view.KeyEvent;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.view.inputmethod.InputConnectionWrapper;

public class DigitText extends android.support.v7.widget.AppCompatEditText {
    public OnBackspaceListener backspaceListener;

    public DigitText(Context context) {
        super(context);
    }

    public DigitText(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public DigitText(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    public OnBackspaceListener getOnBackspaceListener() {
        return backspaceListener;
    }

    public void setOnBackspaceListener(OnBackspaceListener kuListener) {
        this.backspaceListener = kuListener;
    }

    @Override
    public InputConnection onCreateInputConnection(EditorInfo outAttrs) {
        return new DigitInputConnection(super.onCreateInputConnection(outAttrs), true);
    }

    private class DigitInputConnection extends InputConnectionWrapper {
        public DigitInputConnection(InputConnection target, boolean mutable) {
            super(target, mutable);
        }

        @Override
        public boolean sendKeyEvent(KeyEvent event) {
            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getKeyCode() == KeyEvent.KEYCODE_DEL) {
                if (backspaceListener != null) {
                    backspaceListener.onBackspace(event);
                    return true;
                }
                return false;
            }
            return super.sendKeyEvent(event);
        }

        @Override
        public boolean deleteSurroundingText(int beforeLength, int afterLength) {
            if (beforeLength == 1 && afterLength == 0) {
                return sendKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_DEL)) &&
                        sendKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_DEL));
            }

            return super.deleteSurroundingText(beforeLength, afterLength);
        }

    }

    public interface OnBackspaceListener {
        void onBackspace(KeyEvent event);
    }
}
