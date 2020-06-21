package com.pw.hyperxchange.visitormanagement.Helper;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.util.Base64;
import android.util.Log;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import java.util.HashMap;
import java.util.Map;

import androidx.annotation.Nullable;

public class QRCode {
    private static final String TAG = QRCode.class.getSimpleName();
    private static final Map<EncodeHintType, ErrorCorrectionLevel> hintMap = new HashMap<>();

    static {
        hintMap.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
    }

    /**
     * generates a QR code from the given byte array {@code data}
     *
     * @param data the bytes to encode
     * @return Bitmap containing the QR Code
     */
    @Nullable
    public static Bitmap generate(byte[] data) {
        try {
            String qrData = Base64.encodeToString(data, Base64.DEFAULT);
            BitMatrix matrix = new MultiFormatWriter().encode(qrData, BarcodeFormat.QR_CODE,
                    Constants.QR_CODE_DIMEN, Constants.QR_CODE_DIMEN, hintMap);

            int width = matrix.getWidth();
            int height = matrix.getHeight();
            int[] pixels = new int[width * height];
            // All are 0, or black, by default
            for (int y = 0; y < height; y++) {
                int offset = y * width;
                for (int x = 0; x < width; x++) {
                    pixels[offset + x] = matrix.get(x, y) ? Constants.QR_COLOR_B : Constants.QR_COLOR_A;
                }
            }

            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            bitmap.setPixels(pixels, 0, width, 0, 0, width, height);

            return bitmap;

        } catch (Exception er) {
            Log.e(TAG, er.getMessage());
            er.printStackTrace();
        }
        return null;
    }

    /**
     * generates a QR code from the given string {@code data}
     *
     * @param data the string to encode
     * @return Bitmap containing the QR Code
     */
    @Nullable
    public static Bitmap generate(String data) {
        try {
            BitMatrix matrix = new MultiFormatWriter().encode(data, BarcodeFormat.QR_CODE,
                    Constants.QR_CODE_DIMEN, Constants.QR_CODE_DIMEN, hintMap);

            int width = matrix.getWidth();
            int height = matrix.getHeight();
            int[] pixels = new int[width * height];
            // All are 0, or black, by default
            for (int y = 0; y < height; y++) {
                int offset = y * width;
                for (int x = 0; x < width; x++) {
                    pixels[offset + x] = matrix.get(x, y) ? Constants.QR_COLOR_B : Constants.QR_COLOR_A;
                }
            }

            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            bitmap.setPixels(pixels, 0, width, 0, 0, width, height);

            return bitmap;

        } catch (Exception er) {
            Log.e(TAG, er.getMessage());
            er.printStackTrace();
        }
        return null;
    }

    /**
     * Centers and merges the two bitmaps
     *
     * @param overlay the bitmap overlay
     * @param bitmap  the underlying bitmap
     * @return the meged bitmap
     */
    private static Bitmap mergeBitmaps(Bitmap overlay, Bitmap bitmap) {
        if (overlay == null) return bitmap;

        Bitmap scaleOver = Bitmap.createScaledBitmap(overlay, Constants.QR_OVERLAY_DIMEN, Constants.QR_OVERLAY_DIMEN, true);

        Bitmap new_overlay = Bitmap.createBitmap(scaleOver.getWidth() + 8, scaleOver.getHeight() + 8, scaleOver.getConfig());
        Canvas canvas = new Canvas(new_overlay);
        Paint paint = new Paint();
        paint.setColor(Color.WHITE);
        canvas.drawCircle((scaleOver.getWidth() + 8) / 2, (scaleOver.getHeight() + 8) / 2, (scaleOver.getHeight() + 8) / 2, paint);
        canvas.drawBitmap(scaleOver, 4, 4, null);

        int height = bitmap.getHeight();
        int width = bitmap.getWidth();

        Bitmap combined = Bitmap.createBitmap(width, height, bitmap.getConfig());
        canvas = new Canvas(combined);
        int canvasWidth = canvas.getWidth();
        int canvasHeight = canvas.getHeight();

        canvas.drawBitmap(bitmap, new Matrix(), null);


        int centreX = (canvasWidth - new_overlay.getWidth() + 8) / 2;
        int centreY = (canvasHeight - new_overlay.getHeight() + 8) / 2;
        canvas.drawBitmap(new_overlay, centreX, centreY, null);

        return combined;
    }

    /**
     * converts a drawable to a bitmap
     *
     * @param drawable the input drawable
     * @return the bitmap object
     */
    public static Bitmap drawableToBitmap(Drawable drawable) {
        Bitmap bitmap = null;

        if (drawable instanceof BitmapDrawable) {
            BitmapDrawable bitmapDrawable = (BitmapDrawable) drawable;
            if (bitmapDrawable.getBitmap() != null) {
                return bitmapDrawable.getBitmap();
            }
        }

        if (drawable.getIntrinsicWidth() <= 0 || drawable.getIntrinsicHeight() <= 0) {
            bitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
        } else {
            bitmap = Bitmap.createBitmap(drawable.getIntrinsicWidth(), drawable.getIntrinsicHeight(), Bitmap.Config.ARGB_8888);
        }

        Canvas canvas = new Canvas(bitmap);
        drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        drawable.draw(canvas);
        return bitmap;
    }
}
