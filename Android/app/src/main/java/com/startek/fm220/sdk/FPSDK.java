package com.startek.fm220.sdk;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import android.support.annotation.NonNull;

import com.startek.fingerprint.library.NativeApi;

public class FPSDK implements AutoCloseable {
    static FPSDK instance;

    static final int FP_BITMAP_LENGTH = 0x4b436;
    static final int U_POSITION_CHECK_MASK = 0x2f00;
    static final int U_POSITION_NO_FP = 0x2000;
    static final int U_POSITION_TOO_LOW = 0x100;
    static final int U_POSITION_TOO_TOP = 0x200;
    static final int U_POSITION_TOO_RIGHT = 0x400;
    static final int U_POSITION_TOO_LEFT = 0x800;
    static final int U_POSITION_TOO_LOW_RIGHT = 0x500;
    static final int U_POSITION_TOO_LOW_LEFT = 0x900;
    static final int U_POSITION_TOO_TOP_RIGHT = 0x600;
    static final int U_POSITION_TOO_TOP_LEFT = 0xa00;
    static final int U_DENSITY_CHECK_MASK = 0xe0;
    static final int U_DENSITY_TOO_DARK = 0x20;
    static final int U_DENSITY_TOO_LIGHT = 0x40;
    static final int U_DENSITY_LITTLE_LIGHT = 0x60;
    static final int U_DENSITY_AMBIGUOUS = 0x80;

    FPDevice _device;
    UsbManager _usb_man;

    /**
     * Pauses the thread to sync with the _device.
     *
     * @param millis miliseconds to wait
     */
    static void wait(int millis) {
        try {
            Thread.sleep(millis);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // private int _nfiq;

    public static synchronized FPSDK with(@NonNull Context context) {
        NativeApi.init();

        instance = new FPSDK();
        instance._usb_man = (UsbManager) context.getSystemService(Context.USB_SERVICE);
        return instance;
    }

    public synchronized FPSDK from(@NonNull UsbDevice device) throws Exception {
        if (instance._usb_man == null) {
            throw new Exception("Not initialized properly!");
        }

        if (!instance._usb_man.hasPermission(device)) {
            throw new Exception("Permission error!");
        }

        if (device.getInterfaceCount() <= 0) {
            throw new Exception("Invalid usb interface!");
        }

        if (instance._device != null) {
            instance._device.close();
        }

        UsbInterface _if = device.getInterface(0);
        UsbDeviceConnection temp_conn = instance._usb_man.openDevice(device);

        if (temp_conn.getFileDescriptor() == -1) {
            throw new Exception("Error connecting to usb device!");
        }

        temp_conn.releaseInterface(_if);
        temp_conn.close();

        instance._device = new FPDevice(device);

        return instance;
    }

    public synchronized void startPreview(@NonNull FPInterface callback) {
        int nfiq = 6;
        int code = 0;

        byte[] buf;

        Bitmap bitmap;

        for (int i = 0; !callback.isStopped(); i++) {
            code = instance._device.capture();
            nfiq = instance._device.getNFIQ();

            buf = instance._device.getImageBuffer();

            bitmap = BitmapFactory.decodeByteArray(buf, 0, buf.length);

            if (bitmap != null) {
                callback.onImage(bitmap, nfiq);
            }

            wait(750);
        }
    }

    @Override
    public void close() throws Exception {
        _device.close();
    }
}
