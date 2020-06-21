package com.pw.hyperxchange.visitormanagement.Helper;

import android.content.Context;

import com.amazonaws.mobileconnectors.s3.transferutility.TransferListener;
import com.amazonaws.mobileconnectors.s3.transferutility.TransferObserver;
import com.amazonaws.mobileconnectors.s3.transferutility.TransferState;
import com.amazonaws.mobileconnectors.s3.transferutility.TransferUtility;

import java.io.File;

public class Downloader implements TransferListener {
    private String TAG_CLASS = Downloader.class.getSimpleName();
    private Context context;
    private String filePath;

    public interface DownloadListener {
        void onResponse();

        void onError(Exception e);
    }

    private DownloadListener downloadListener;

    public Downloader(Context context, String filePath, DownloadListener downloadListener) {
        this.context = context;
        this.filePath = filePath;
        this.downloadListener = downloadListener;
    }

    /**
     * Method to download the file.
     */
    public void downloadFile() {
        try {
            final String fileKey = filePath.substring(filePath.lastIndexOf(File.separator) + 1);
            Thread thread = new Thread(() -> {
                AWSHelper awsHelper = new AWSHelper();
                TransferUtility transferUtility = awsHelper.getTransferUtility(context);
                File downloadFile = new File(filePath);
                TransferObserver observer = transferUtility.download(Constants.BUCKET_NAME,
                        fileKey, downloadFile);
                observer.setTransferListener(Downloader.this);
            });
            thread.start();
        } catch (Exception e) {
            Messages.logMessage(TAG_CLASS, e.toString());
        }
    }

    @Override
    public void onStateChanged(int id, TransferState state) {
        if (state.name().equalsIgnoreCase(Constants.AWS_STATE_COMPLETED)) {
            if (downloadListener != null) {
                downloadListener.onResponse();
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
        if (downloadListener != null) {
            downloadListener.onError(ex);
        }
    }
}
