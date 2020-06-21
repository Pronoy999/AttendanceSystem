package com.startek.fm220.sdk;

import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;

import com.startek.fingerprint.library.NativeApi;

import java.util.Arrays;

public class UsbModule implements AutoCloseable {
    public static final int EEPROM_START_ADDRESS = 7168;

    UsbDeviceConnection _usb_conn;
    UsbInterface _usb_if;
    int _f_desc;

    UsbEndpoint[] _uen_in = new UsbEndpoint[2];
    UsbEndpoint[] _uen_out = new UsbEndpoint[2];

    UsbModule(UsbDeviceConnection connection, UsbDevice device) {
        this._usb_conn = connection;
        this._f_desc = _usb_conn.getFileDescriptor();

        this._usb_if = device.getInterface(0);
        this._usb_conn.claimInterface(this._usb_if, true);

        NativeApi.setInterface(_f_desc);

        for (int i = 0; i < _usb_if.getEndpointCount(); i++) {
            UsbEndpoint ep = _usb_if.getEndpoint(i);

            if (ep.getEndpointNumber() == 1 || ep.getEndpointNumber() == 2) {
                switch (ep.getDirection()) {
                    case UsbConstants.USB_DIR_IN: {
                        this._uen_in[ep.getEndpointNumber() - 1] = ep;
                        break;
                    }
                    case UsbConstants.USB_DIR_OUT: {
                        this._uen_out[ep.getEndpointNumber() - 1] = ep;
                        break;
                    }
                }
            }
        }
    }


    @Override
    public void close() {
        if (this._usb_conn != null) {
            this._usb_conn.releaseInterface(this._usb_if);
            this._usb_conn.close();
            this._usb_conn = null;
        }

        this._uen_in = new UsbEndpoint[2];
        this._uen_out = new UsbEndpoint[2];
    }

    int write(byte[] buffer, int offset, int length) {
        this.writeCMD((byte) 0x51, buffer, offset, length);
        if (Arrays.equals(buffer, this.read(offset, length))) return 0;

        this.writeCMD((byte) 0x55, buffer, offset, length);
        return Arrays.equals(buffer, this.read(offset, length)) ? 0 : -1;
    }

    int writeCMD(byte cmd, byte address, byte val) {
        byte[] data = {
                cmd, address, val
        };
        return this._usb_conn.bulkTransfer(this._uen_out[0], data, 3, 500);
    }

    void lowSpeed(Params params) {
        byte[] data = {0x60, 0x4};
        this._usb_conn.bulkTransfer(_uen_out[0], data, 2, 500);

        FPSDK.wait(200);

        this.writeCMD((byte) 0x5d, (byte) 0x35, (byte) 0);
        this.writeCMD((byte) 0x5d, (byte) -0x80, params.getM_AGC());

        int val = params.getM_AEC() * 2 / 6;

        this.writeCMD((byte) 0x5d, (byte) 0x9, (byte) (val / 0x100));
        this.writeCMD((byte) 0x5d, (byte) -0x80, (byte) (val % 0x100));
    }

    void setSensorParams(Params params) {
        this.writeCMD((byte) 0x5d, (byte) 0x35, (byte) 0);
        this.writeCMD((byte) 0x5d, (byte) -0x80, params.getM_AGC());

        int val = params.getM_AEC() * 2;

        this.writeCMD((byte) 0x5d, (byte) 0x9, (byte) (val / 0x100));
        this.writeCMD((byte) 0x5d, (byte) -0x80, (byte) (val % 0x100));
    }

    int clear() {
        int result = 0;
        byte[] data = new byte[0x200];

        while (result == 0) {
            result = this._usb_conn.bulkTransfer(this._uen_in[1], data, data.length, 50);
        }

        return result < 0 ? result : 0;
    }

    int start() {
        byte[] data = {0, 0xa, 0};

        int result = this._usb_conn.bulkTransfer(this._uen_out[0], data, 3, 1500);
        return result < 0 ? result : 0;
    }

    int ledOn() {
        byte[] data = {0, 7, 7};

        int result = this._usb_conn.bulkTransfer(this._uen_out[0], data, 3, 500);
        return result < 0 ? result : 0;
    }

    int ledOff() {
        byte[] data = {0, 7, 0};

        int result = this._usb_conn.bulkTransfer(this._uen_out[0], data, 3, 500);
        return result < 0 ? result : 0;
    }

    void writeCMD(byte cmd, byte[] buffer, int offset, int length) {
        for (int i = 0; i < length; i++) {
            FPSDK.wait(10);

            byte[] data = {
                    cmd,
                    (byte) (EEPROM_START_ADDRESS + i + offset >> 8),
                    (byte) (EEPROM_START_ADDRESS + i + offset & 0xff),
                    buffer[i]
            };

            this._usb_conn.bulkTransfer(this._uen_out[0], data, 4, 500);

            FPSDK.wait(10);
        }
    }

    byte[] read(int offset, int length) {
        byte[] buffer = new byte[length];

        for (int i = 0; i < length; i++) {
            FPSDK.wait(10);

            byte[] data = {
                    0x51,
                    (byte) (EEPROM_START_ADDRESS + i + offset >> 8),
                    (byte) (EEPROM_START_ADDRESS + i + offset & 0xff)
            };

            this._usb_conn.bulkTransfer(this._uen_out[0], data, 3, 500);

            FPSDK.wait(10);

            this._usb_conn.bulkTransfer(this._uen_in[0], data, 1, 1000);
            buffer[i] = data[0];
        }

        return buffer;
    }

    int capture() {
        this.ledOn();
        this.clear();
        this.start();
        int res = NativeApi.capture();
        this.ledOff();
        return res;
    }

    byte[] readEEPROM() {
        byte[] buffer = new byte[0x40];

        for (int i = 0; i < 48; i++) {
            FPSDK.wait(10);

            byte[] data = {
                    0x51,
                    (byte) (EEPROM_START_ADDRESS + i >> 8),
                    (byte) (EEPROM_START_ADDRESS + i & 0xff)
            };

            this._usb_conn.bulkTransfer(this._uen_out[0], data, 3, 500);

            FPSDK.wait(10);

            this._usb_conn.bulkTransfer(this._uen_in[0], data, 1, 1000);
            buffer[i] = data[0];
        }

        return buffer;
    }

    byte[] getFWVersion() {
        // todo store
        byte[] data = new byte[9];
        data[0] = 0;
        data[1] = 6;

        this._usb_conn.bulkTransfer(this._uen_out[0], data, 2, 500);
        FPSDK.wait(10);
        this._usb_conn.bulkTransfer(this._uen_in[0], data, 9, 1000);

        return data;
    }
}
