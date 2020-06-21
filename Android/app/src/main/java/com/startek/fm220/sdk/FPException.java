package com.startek.fm220.sdk;

public class FPException extends Exception {
    public int error_code;

    public FPException(int code) {
        this.error_code = code;
    }

    public FPException(String message, int error_code) {
        super(message);
        this.error_code = error_code;
    }

    public FPException(String message, Throwable cause, int error_code) {
        super(message, cause);
        this.error_code = error_code;
    }

    public FPException(Throwable cause, int error_code) {
        super(cause);
        this.error_code = error_code;
    }

    public FPException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace, int error_code) {
        super(message, cause, enableSuppression, writableStackTrace);
        this.error_code = error_code;
    }
}
