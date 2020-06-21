package com.pw.hyperxchange.visitormanagement.Activities;


import android.animation.ObjectAnimator;
import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.Animatable2;
import android.graphics.drawable.AnimatedVectorDrawable;
import android.graphics.drawable.Drawable;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.support.annotation.NonNull;
import android.support.v4.app.Fragment;
import android.support.v4.content.res.ResourcesCompat;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.android.volley.VolleyError;
import com.bumptech.glide.Glide;
import com.pw.hyperxchange.visitormanagement.HXApplication;
import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Helper.Messages;
import com.pw.hyperxchange.visitormanagement.Helper.QRCode;
import com.pw.hyperxchange.visitormanagement.Helper.ServerConnector;
import com.pw.hyperxchange.visitormanagement.R;
import com.startek.fm220.sdk.FPInterface;
import com.startek.fm220.sdk.FPSDK;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;

public class QRCodeFragment extends Fragment {
    private static final int tickColor = R.color.finger_background_success;
    private static final int crssColor = R.color.finger_background_error;
    private static final int dfltColor = R.color.finger_background_default;

    private static final String TAG = QRCodeFragment.class.getSimpleName();
    private ImageView mQRCodeView;

    private boolean stopped = true;

    ToneGenerator beeper = new ToneGenerator(AudioManager.STREAM_MUSIC, 100);

    private AnimatedVectorDrawable showFingerprint;
    private AnimatedVectorDrawable scanFingerprint;
    private AnimatedVectorDrawable fingerprintToTick;
    private AnimatedVectorDrawable fingerprintToCross;

    public class Finger {
        public String _name;
        public String displayName;
        public int viewID;
        public int textID;
        public int drawableID;
        public int scaleX;

        public int backgroundColor = Color.TRANSPARENT;

        public ImageView view;
        public TextView textView;
        public Drawable drawable;

        Finger(String name, String displayName, int viewID, int textID, int drawableID, int scaleX) {
            this._name = name;
            this.displayName = displayName;
            this.viewID = viewID;
            this.textID = textID;
            this.drawableID = drawableID;
            this.scaleX = scaleX;
        }

        @SuppressLint("ObjectAnimatorBinding")
        private void changeColor(int to) {
            int col = to == Color.TRANSPARENT ? Color.TRANSPARENT : ResourcesCompat.getColor(getResources(), to, null);
            if (view != null) {
                ObjectAnimator.ofArgb(view.getBackground(), "color", backgroundColor, col).start();
            }
            backgroundColor = col;
        }
    }

    Finger[] fingers = new Finger[]{
            new Finger("right_thumb", "Right Thumb", R.id.rightThumbButton, R.id.rightThumbText, R.drawable.left_thumb, -1),
            new Finger("left_thumb", "Left Thumb", R.id.leftThumbButton, R.id.leftThumbText, R.drawable.left_thumb, 1),
            new Finger("right_index", "Right Index", R.id.rightIndexButton, R.id.rightIndexText, R.drawable.left_index, -1),
            new Finger("left_index", "Left Index", R.id.leftIndexButton, R.id.leftIndexText, R.drawable.left_index, 1)
    };

    private PendingIntent mPermissionIntent;

    public QRCodeFragment() {
    }

    Animatable2.AnimationCallback showCallback;
    Animatable2.AnimationCallback scanCallback;
    Animatable2.AnimationCallback tickCallback;
    Animatable2.AnimationCallback crssCallback;


    private final BroadcastReceiver mUsbReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (Constants.ACTION_USB_PERMISSION.equals(action)) {
                synchronized (this) {
                    UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    int fIndex = intent.getIntExtra(Constants.PARAM_FINGER, -1);

                    if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                        if (device != null && fIndex > -1 && fIndex < 4) {
                            if (!stopped || getActivity() == null) {
                                stopped = true;
                                return;
                            }

                            Finger fin = fingers[fIndex];

                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                showCallback = new Animatable2.AnimationCallback() {
                                    @Override
                                    public void onAnimationEnd(Drawable drawable) {
                                        fin.view.post(() -> {
                                            scanFingerprint.registerAnimationCallback(scanCallback);
                                            fin.view.setImageDrawable(scanFingerprint);
                                            scanFingerprint.start();

                                            showFingerprint.unregisterAnimationCallback(showCallback);
                                        });
                                    }
                                };

                                scanCallback = new Animatable2.AnimationCallback() {
                                    @Override
                                    public void onAnimationEnd(Drawable drawable) {
                                        fin.view.postDelayed(() -> scanFingerprint.start(), 500);
                                    }
                                };

                                tickCallback = new Animatable2.AnimationCallback() {
                                    @Override
                                    public void onAnimationEnd(Drawable drawable) {

                                        fin.view.postDelayed(() -> {
                                            // set drawable to old
                                            fin.changeColor(Color.TRANSPARENT);

                                            fin.view.setScaleX(fin.scaleX);
                                            fin.view.setImageDrawable(fin.drawable);

                                            fingerprintToTick.unregisterAnimationCallback(tickCallback);
                                        }, 1000);
                                    }
                                };

                                crssCallback = new Animatable2.AnimationCallback() {
                                    @Override
                                    public void onAnimationEnd(Drawable drawable) {
                                        fin.view.postDelayed(() -> {
                                            fin.changeColor(Color.TRANSPARENT);

                                            // set drawable to old
                                            fin.view.setScaleX(fin.scaleX);
                                            fin.view.setImageDrawable(fin.drawable);

                                            fingerprintToCross.unregisterAnimationCallback(crssCallback);
                                        }, 1000);
                                    }
                                };

                                showFingerprint.registerAnimationCallback(showCallback);
                                showFingerprint.start();
                            }

                            fin.changeColor(dfltColor);

                            fin.view.setScaleX(1);
                            fin.view.setImageDrawable(showFingerprint);
                            showFingerprint.start();

                            Runnable success = () -> {
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                    scanFingerprint.unregisterAnimationCallback(scanCallback);
                                    fingerprintToTick.registerAnimationCallback(tickCallback);

                                    fin.changeColor(tickColor);

                                    fin.view.setImageDrawable(fingerprintToTick);
                                    fingerprintToTick.start();
                                }
                            };

                            Runnable error = () -> {
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                    scanFingerprint.unregisterAnimationCallback(scanCallback);
                                    fingerprintToCross.registerAnimationCallback(crssCallback);

                                    fin.changeColor(crssColor);

                                    fin.view.setImageDrawable(fingerprintToCross);
                                    fingerprintToCross.start();
                                }
                            };

                            new Handler().postDelayed(() -> {
                                if (!stopped) {
                                    stopped = true;
                                    error.run();
                                }
                            }, 8000);

                            new Thread(() -> {
                                stopped = false;
                                try (FPSDK sdk = FPSDK.with(getActivity()).from(device)) {
                                    sdk.startPreview(new FPInterface() {
                                        @Override
                                        public synchronized void onImage(Bitmap image, int nfiq) {
                                            if (nfiq <= 2) {
                                                stopped = true;
                                                beeper.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 500);

                                                ByteArrayOutputStream stream = new ByteArrayOutputStream();
                                                image.compress(Bitmap.CompressFormat.PNG, 100, stream);
                                                String url = Constants.URL + "bio-auth?key=" + Constants.API_TOKEN + "&type=verify&finger=" + fin._name;
                                                ServerConnector connector = new ServerConnector(getActivity(), url, new ServerConnector.ResponseListener() {
                                                    @Override
                                                    public void onResponse(JSONObject object) {
                                                        try {
                                                            int res = (int) object.getDouble(Constants.JSON_RESPONSE);
                                                            if (res > 40) {
                                                                success.run();
                                                                String employeeID = object.getString(Constants.JSON_MATCH);

                                                                System.out.println("EMPLOYEE ID: " + employeeID);
                                                                giveAttendance(employeeID);
                                                            } else {
                                                                error.run();
                                                            }
                                                        } catch (JSONException e) {
                                                            Messages.logMessage(TAG, e.toString());
                                                            error.run();
                                                        }
                                                    }

                                                    @Override
                                                    public void onErrorResponse(VolleyError e) {
                                                        error.run();
                                                    }
                                                });
                                                connector.makeQuery(stream.toByteArray());
                                            }
                                        }

                                        @Override
                                        public boolean isStopped() {
                                            return stopped;
                                        }
                                    });
                                } catch (Exception e) {
                                    error.run();
                                    e.printStackTrace();
                                }
                            }).start();
                        } else {
                            Messages.toastMessage(getActivity(), "device or finger null.", Toast.LENGTH_LONG);
                        }
                    } else {
                        Log.d(TAG, "permission denied for device " + device);
                    }
                }
            }
        }
    };


    private void initializeViews(View v) {
        mQRCodeView = v.findViewById(R.id.QRCodeView);

        for (int i = 0; i < fingers.length; i++) {
            Finger f = fingers[i];
            f.view = v.findViewById(f.viewID);
            f.textView = v.findViewById(f.textID);
            f.drawable = getResources().getDrawable(f.drawableID, v.getContext().getTheme());

            int finalI = i;
            View.OnClickListener l = vx -> {
                if (getActivity() == null || !stopped) return;

                UsbManager manager = (UsbManager) getActivity().getSystemService(Service.USB_SERVICE);

                ArrayList<UsbDevice> devices = new ArrayList<>(manager.getDeviceList().values());

                for (UsbDevice dev : devices) {
                    if (Constants.VENDOR_ID == dev.getVendorId() == Constants.PRODUCT_IDS.contains(dev.getProductId())) {
                        Intent intent = new Intent(Constants.ACTION_USB_PERMISSION)
                                .putExtra(Constants.PARAM_FINGER, finalI);
//                        intent.putExtra(Constants.PARAM_FINGER, f);
                        mPermissionIntent = PendingIntent.getBroadcast(getActivity().getApplicationContext(), Constants.FP_PERMISSION_REQUEST_CODE, intent, PendingIntent.FLAG_UPDATE_CURRENT);

                        manager.requestPermission(dev, mPermissionIntent);
                        return;
                    }
                }

                Messages.toastMessage(getActivity(), "No supported fingerprint device found.");
            };

            f.view.setOnClickListener(l);
            f.textView.setOnClickListener(l);
        }

        if (getActivity() != null) {
            IntentFilter filter = new IntentFilter(Constants.ACTION_USB_PERMISSION);
            getActivity().registerReceiver(mUsbReceiver, filter);

            showFingerprint = (AnimatedVectorDrawable) getActivity().getDrawable(R.drawable.show_fingerprint);
            scanFingerprint = (AnimatedVectorDrawable) getActivity().getDrawable(R.drawable.scan_fingerprint);
            fingerprintToTick = (AnimatedVectorDrawable) getActivity().getDrawable(R.drawable.fingerprint_to_tick);
            fingerprintToCross = (AnimatedVectorDrawable) getActivity().getDrawable(R.drawable.fingerprint_to_cross);
        }
    }


    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        final View root = inflater.inflate(R.layout.activity_qr_code, container, false);
//        root.post(() -> {
//        });
        if (root != null) {
            initializeViews(root);

            new Handler().post(QRCodeFragment.this::updateQRCode);
        }

        return root;
    }

    public void updateQRCode() {
        try {
            JSONObject QrObject = new JSONObject();
            QrObject.put("location", HXApplication.instance().employee.getLocation());
            QrObject.put("timestamp", "" + System.currentTimeMillis());

            Bitmap qrcode = QRCode.generate(QrObject.toString());
            if (qrcode != null) {
                Glide.with(QRCodeFragment.this).load(qrcode).into(mQRCodeView);
            }
            new Handler().postDelayed(this::updateQRCode, 60 * 1000);
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onDestroyView() {
        if (getActivity() != null)
            getActivity().unregisterReceiver(mUsbReceiver);
        stopped = true;
        super.onDestroyView();
    }

    /**
     * Method to update the Attendance for the Employee id.
     *
     * @param employeeID: The Employee id.
     */
    private void giveAttendance(String employeeID) {
        String url = Constants.URL + "attendance?key=" + Constants.API_TOKEN + "&id=" + employeeID;
        ServerConnector connector = new ServerConnector(getActivity(), url, new ServerConnector.ResponseListener() {
            @Override
            public void onResponse(JSONObject object) {
                try {
                    if (object.getBoolean(Constants.JSON_RESPONSE)) {
                        Messages.toastMessage(getActivity(), "Attendance Successful");
                    } else {
                        Messages.toastMessage(getActivity(), "Something went WRONG.", 1);
                    }
                } catch (JSONException e) {
                    Messages.logMessage(TAG, e.toString());
                }
            }

            @Override
            public void onErrorResponse(VolleyError e) {
                Messages.logMessage(TAG, e.toString());
            }
        });
        connector.makeQuery(null, true);
    }
}
