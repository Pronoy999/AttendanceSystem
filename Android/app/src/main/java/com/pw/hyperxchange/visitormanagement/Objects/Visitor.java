package com.pw.hyperxchange.visitormanagement.Objects;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.os.Parcel;
import android.os.Parcelable;

import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Helper.Downloader;
import com.pw.hyperxchange.visitormanagement.Helper.Messages;

import java.io.File;

public class Visitor implements Parcelable {
    private String first_name;
    private String last_name;
    private String phone;
    private String image_name;
    private boolean isParking;
    private String TAG_CLASS = Visitor.class.getSimpleName();

    public Visitor(String first_name, String last_name, String phone, String image_name, boolean isParking) {
        this.first_name = first_name;
        this.last_name = last_name;
        this.phone = phone;
        this.image_name = image_name;
        this.isParking = isParking;
    }

    protected Visitor(Parcel in) {
        first_name = in.readString();
        last_name = in.readString();
        phone = in.readString();
        image_name = in.readString();
        isParking = in.readByte() != 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeString(first_name);
        dest.writeString(last_name);
        dest.writeString(phone);
        dest.writeString(image_name);
        dest.writeByte((byte) (isParking ? 1 : 0));
    }

    @Override
    public int describeContents() {
        return 0;
    }

    public static final Creator<Visitor> CREATOR = new Creator<Visitor>() {
        @Override
        public Visitor createFromParcel(Parcel in) {
            return new Visitor(in);
        }

        @Override
        public Visitor[] newArray(int size) {
            return new Visitor[size];
        }
    };

    public String getFirstName() {
        return first_name;
    }

    public Visitor setFirstName(String first_name) {
        this.first_name = first_name;
        return this;
    }

    public String getLastName() {
        return last_name;
    }

    public Visitor setLastName(String last_name) {
        this.last_name = last_name;
        return this;
    }

    public String getPhone() {
        return phone;
    }

    public Visitor setPhone(String phone) {
        this.phone = phone;
        return this;
    }

    public String getImageName() {
        return image_name;
    }

    public Visitor setImageName(String image_name) {
        this.image_name = image_name;
        return this;
    }

    public boolean isParking() {
        return isParking;
    }

    public Visitor setParking(boolean parking) {
        isParking = parking;
        return this;
    }

    /**
     * Method to download the Visitor Image.
     *
     * @param context:  The Context of the application.
     * @param runnable:
     */
    public void downloadImage(Context context, Runnable runnable) {
        String phoneNumber = this.phone.replace("+91", "");
        Messages.logMessage(TAG_CLASS, phoneNumber);
        File downloadImageFile = new File(context.getFilesDir(),
                String.format(Constants.VISITOR_IMAGE_PATH, phoneNumber));
        if (downloadImageFile.exists()) {
            Looper looper = Looper.getMainLooper();
            new Handler(looper).post(runnable);
            Messages.logMessage(TAG_CLASS, "Image already exists. ");
            return;
        }
        Messages.logMessage(TAG_CLASS, downloadImageFile.getAbsolutePath());
        Downloader downloader = new Downloader(context, downloadImageFile.getAbsolutePath(),
                new Downloader.DownloadListener() {
                    @Override
                    public void onResponse() {
                        Messages.logMessage(TAG_CLASS, "Image Downloaded");
                        runnable.run();
                    }

                    @Override
                    public void onError(Exception e) {
                        Messages.logMessage(TAG_CLASS, e.toString());
                        Messages.logMessage(TAG_CLASS, "Failed to Download Image.");
                    }
                });
        downloader.downloadFile();
        downloadImageFile = null;
    }
}
