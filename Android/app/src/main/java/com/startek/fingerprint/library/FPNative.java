package com.startek.fingerprint.library;

public class FPNative {
    public FPNative() {
    }

    public static native void SetFPLibraryPath(String var0);

    public static native void InitialSDK();

    public static native void FP_SaveImageBMP(String var0);

    public static native int FP_CreateEnrollHandle();

    public static native int FP_GetTemplate(byte[] var0);

    public static native int FP_ISOminutiaEnroll(byte[] var0, byte[] var1);

    public static native void FP_SaveISOminutia(byte[] var0, String var1);

    public static native void FP_DestroyEnrollHandle();

    public static native int FP_LoadISOminutia(byte[] var0, String var1);

    public static native int FP_ISOminutiaMatchEx(byte[] var0, byte[] var1);

    public static native int FP_ISOminutiaMatch180Ex(byte[] var0, byte[] var1);

    public static native int FP_ISOminutiaMatch360Ex(byte[] var0, byte[] var1);

    public static native int Score();

    public static native int FP_GetImageWidth();

    public static native int FP_GetImageHeight();

    public static native int FP_GetNFIQ();

    public static native void FP_GetISOImageBuffer(byte var0, byte var1, byte[] var2);

    public static native int FP_UpdateImgBufBMP(byte[] var0);

    static {
        System.loadLibrary("startek_jni");
    }
}
