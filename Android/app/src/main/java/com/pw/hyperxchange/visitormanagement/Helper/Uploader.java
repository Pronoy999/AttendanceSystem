package com.pw.hyperxchange.visitormanagement.Helper;

import android.content.Context;

import com.amazonaws.mobileconnectors.s3.transferutility.TransferListener;
import com.amazonaws.mobileconnectors.s3.transferutility.TransferObserver;
import com.amazonaws.mobileconnectors.s3.transferutility.TransferState;
import com.amazonaws.mobileconnectors.s3.transferutility.TransferUtility;

import java.io.File;

public class Uploader implements TransferListener {
    private String TAG_CLASS = Uploader.class.getSimpleName();
    private Context context;
    private String filePath;

    public interface UploadListener {
        void onResponse();

        void onError(Exception e);
    }

    private UploadListener uploadListener;

    public Uploader(Context context, String filePath, UploadListener uploadListener) {
        this.context = context;
        this.filePath = filePath;
        this.uploadListener = uploadListener;
    }

    /**
     * Method to upload the File.
     */
    public void upload() {
        Thread thread = new Thread(() -> {
            AWSHelper awsHelper = new AWSHelper();
            TransferUtility transferUtility = awsHelper.getTransferUtility(context);
            String fileNameParts[] = filePath.split(File.separator);
            TransferObserver observer = transferUtility.upload(Constants.BUCKET_NAME,
                    fileNameParts[fileNameParts.length - 1],
                    new File(filePath));
            observer.setTransferListener(Uploader.this);
        });
        thread.start();
    }

    @Override
    public void onStateChanged(int id, TransferState state) {
        if (state.name().equalsIgnoreCase(Constants.AWS_STATE_COMPLETED)) {
            if (uploadListener != null) {
                uploadListener.onResponse();
            }
        }
    }

    @Override
    public void onProgressChanged(int id, long bytesCurrent, long bytesTotal) {
        try {
            Messages.logMessage(TAG_CLASS, (bytesCurrent / bytesTotal) * 100 + "");
        } catch (RuntimeException e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
    }

    @Override
    public void onError(int id, Exception ex) {
        if (uploadListener != null) {
            uploadListener.onError(ex);
        }
    }
}
