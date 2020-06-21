package com.pw.hyperxchange.visitormanagement.Helper;

import android.content.Context;
import android.util.Log;
import android.widget.Toast;

public class Messages {
    /**
     * Method to display the debug log message.
     *
     * @param TAG: The TAG of the Message.
     * @param msg: The message to be displayed.
     */
    public static void logMessage(String TAG, String msg) {
        Log.d(TAG, msg);
    }

    /**
     * Method to generate the Toast message for a short period of time.
     *
     * @param context: The application context.
     * @param msg:     The Message to be displayed.
     */
    public static void toastMessage(Context context, String msg) {
        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show();
    }

    /**
     * Method to generate the Toast Messages for a long time.
     *
     * @param context: The application context.
     * @param msg:     The message to be displayed.
     * @param len:     Any positive integer other than -1.
     */
    public static void toastMessage(Context context, String msg, int len) {
        if (len != -1) {
            Toast.makeText(context, msg, Toast.LENGTH_LONG).show();
        }
    }
}
