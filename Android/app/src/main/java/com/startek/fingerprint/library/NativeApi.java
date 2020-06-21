package com.startek.fingerprint.library;

public class NativeApi {
    public NativeApi() {
    }

    public static native void init();

    public static native void unInit();

    public static native byte[] setFileDescriptor(int var0);

    public static native void setEEPROM(byte[] var0);

    public static native byte[] receiveImage();

    public static native byte[] snap(int var0, int var1);

    public static native int capture();

    public static native int checkBlank();

    public static native int getNFIQ();

    public static native int getImageWidth();

    public static native int getImageHeight();

    public static native void getImageBuffer(byte[] var0);

    public static native void setInterface(int var0);

    static {
        System.loadLibrary("fpapi");
    }
}
