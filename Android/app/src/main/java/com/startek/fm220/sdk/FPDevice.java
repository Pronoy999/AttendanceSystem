package com.startek.fm220.sdk;

import android.hardware.usb.UsbDevice;

import com.startek.fingerprint.library.FPNative;
import com.startek.fingerprint.library.NativeApi;

public class FPDevice implements AutoCloseable {
    UsbDevice _usb_dev;
    UsbModule _usb_mod;

    Params _params;

    String _serial;

    public FPDevice(UsbDevice device) {
        this._usb_dev = device;
        this._usb_mod = new UsbModule(FPSDK.instance._usb_man.openDevice(device), device);
        NativeApi.setFileDescriptor(this._usb_mod._f_desc);

        byte[] data = this._usb_mod.readEEPROM();
        data[0] = 0x46;
        data[19] = 0x7f;
        NativeApi.setEEPROM(data);

        this._params = new Params(data);
        this._usb_mod.setSensorParams(this._params);
        this._usb_mod.lowSpeed(this._params);
    }

    @Override
    public void close() {
        if (this._usb_mod != null) {
            this._usb_mod.close();
            this._usb_mod = null;
        }
    }

    private byte[] buffer = new byte[FPSDK.FP_BITMAP_LENGTH];

    public int capture() {
        int ret = this._usb_mod.capture();

        NativeApi.getImageBuffer(this.buffer);
        FPNative.FP_UpdateImgBufBMP(this.buffer);

        return ret;
    }

    public void saveBMP(String file) {
        FPNative.FP_SaveImageBMP(file);
    }

    public byte[] getImageBuffer() {
        byte[] data = new byte[FPSDK.FP_BITMAP_LENGTH];
        NativeApi.getImageBuffer(data);
        return data;
    }

    public int getImageWidth() {
        return NativeApi.getImageWidth();
    }

    public int getImageHeight() {
        return NativeApi.getImageHeight();
    }

    public void ledOn() {
        this._usb_mod.ledOn();
    }

    public void ledOff() {
        this._usb_mod.ledOff();
    }

    public int getNFIQ() {
        return FPNative.FP_GetNFIQ();
    }

    public int getDPI() {
        return 500;
    }

    public int getGrayLevel() {
        return 0x100;
    }

    public byte[] getSerial() {
        byte[] sn = this._usb_mod.read(0x30, 0x10);

        byte[] serial = new byte[sn.length - 1];
        System.arraycopy(sn, 0, serial, 0, serial.length);
        return serial;
    }

    public byte[] getPAK() {
        return this._usb_mod.read(0x40, 0x8);
    }

    public void setSerial(byte[] sn) {
        this._usb_mod.write(sn, 0x30, 0x9);
    }

    public void setPAK(byte[] pak) {
        this._usb_mod.write(pak, 0x40, 0x8);
    }

    public byte[] getFWVersion() {
        return this._usb_mod.getFWVersion();
    }
}
