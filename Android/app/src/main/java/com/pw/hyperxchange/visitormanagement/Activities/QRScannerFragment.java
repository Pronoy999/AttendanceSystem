package com.pw.hyperxchange.visitormanagement.Activities;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.budiyev.android.codescanner.CodeScanner;
import com.budiyev.android.codescanner.CodeScannerView;
import com.budiyev.android.codescanner.DecodeCallback;
import com.google.zxing.Result;
import com.pw.hyperxchange.visitormanagement.R;

public class QRScannerFragment extends Fragment {
    private CodeScannerView mCodeScannerView;
    private CodeScanner mCodeScanner;

    private QRScannerListener mQRScannerListener;

    public QRScannerFragment() {
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        final Activity activity = getActivity();
        View root = inflater.inflate(R.layout.activity_qr_scanner, container, false);
        if (activity != null) {
            mCodeScannerView = root.findViewById(R.id.QRCodeScanner);

            mCodeScanner = new CodeScanner(activity, mCodeScannerView);
            mCodeScanner.setDecodeCallback(new DecodeCallback() {
                @Override
                public void onDecoded(@androidx.annotation.NonNull Result result) {
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            mQRScannerListener.onQRCode(result.getText());
                        }
                    });
                }
            });
            mCodeScannerView.setOnClickListener(view -> mCodeScanner.startPreview());
        }
        return root;
    }

    @Override
    public void onAttach(Context context) {
        super.onAttach(context);
        if (context instanceof QRScannerListener) {
            mQRScannerListener = (QRScannerListener) context;
        } else {
            throw new RuntimeException(context.toString() + " must implement QRScannerListener");
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        mCodeScanner.startPreview();
    }

    @Override
    public void onPause() {
        super.onPause();
        mCodeScanner.releaseResources();
    }

    public interface QRScannerListener {
        void onQRCode(String code);
    }
}
