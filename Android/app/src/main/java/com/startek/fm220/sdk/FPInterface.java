package com.startek.fm220.sdk;

import android.graphics.Bitmap;

public interface FPInterface {
    void onImage(Bitmap image, int nfiq);

    boolean isStopped();
}
