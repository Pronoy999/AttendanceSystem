package com.pw.hyperxchange.visitormanagement.Activities;

import android.graphics.Bitmap;
import android.graphics.Matrix;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;

import com.pw.hyperxchange.visitormanagement.Helper.Constants;
import com.pw.hyperxchange.visitormanagement.Objects.SquareImageView;
import com.pw.hyperxchange.visitormanagement.R;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import io.fotoapparat.Fotoapparat;
import io.fotoapparat.configuration.CameraConfiguration;
import io.fotoapparat.parameter.Resolution;
import io.fotoapparat.parameter.ScaleType;
import io.fotoapparat.result.PhotoResult;
import io.fotoapparat.selector.LensPositionSelectorsKt;
import io.fotoapparat.selector.ResolutionSelectorsKt;
import io.fotoapparat.view.CameraView;
import kotlin.Unit;

public class CameraActivity extends AppCompatActivity {

    private CameraView mCamView;
    private Fotoapparat mFotoapparat;
    private SquareImageView mCapture;
    private SquareImageView mSwitchCam;

    private boolean backlens = true;

    String phoneNumber;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_camera);

        mCamView = findViewById(R.id.camView);
        mCapture = findViewById(R.id.captureButton);
        mSwitchCam = findViewById(R.id.switchCam);

        if (getIntent().getExtras() != null) {
            phoneNumber = getIntent().getExtras().getString(Constants.PARAM_PHONE_NUMBER);

            if (phoneNumber == null || phoneNumber.isEmpty()) {
                setResult(RESULT_CANCELED);
                finish();
            }
        } else {
            setResult(RESULT_CANCELED);
            finish();
        }

        mFotoapparat = Fotoapparat.with(this)
                .into(mCamView)
                .previewScaleType(ScaleType.CenterCrop)
                .photoResolution(ResolutionSelectorsKt.highestResolution())
                .lensPosition(backlens ? LensPositionSelectorsKt.back() : LensPositionSelectorsKt.front()).build();

        mFotoapparat.start();

        mCapture.setOnClickListener(v -> {
            PhotoResult bP = mFotoapparat.takePicture();

            File outfile = new File(getFilesDir(), String.format(Constants.VISITOR_IMAGE_PATH, phoneNumber));
            bP.toBitmap(resolution -> resolution.getAspectRatio() > 1 ? new Resolution((int) (512 * resolution.getAspectRatio()), 512) : new Resolution(512, (int) (512 / resolution.getAspectRatio()))).whenAvailable(bitmapPhoto -> {
                if (bitmapPhoto != null) {
                    Matrix matrix = new Matrix();
                    matrix.postRotate(-bitmapPhoto.rotationDegrees);

                    int height = bitmapPhoto.bitmap.getHeight();
                    int width = bitmapPhoto.bitmap.getWidth();

                    Bitmap modded_bitmap;

                    if (width >= height) {
                        modded_bitmap = Bitmap.createBitmap(bitmapPhoto.bitmap, width / 2 - height / 2, 0, height, height, matrix, true);
                    } else {
                        modded_bitmap = Bitmap.createBitmap(bitmapPhoto.bitmap, 0, height / 2 - width / 2, width, width, matrix, true);
                    }

                    outfile.getParentFile().mkdirs();

                    // save bitmap to file
                    try (FileOutputStream stream = new FileOutputStream(outfile)) {
                        modded_bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream);
                        modded_bitmap.recycle();

                        stream.flush();
                        setResult(RESULT_OK);
                    } catch (IOException e) {
                        e.printStackTrace();

                        setResult(RESULT_CANCELED);
                    }
                    mFotoapparat.stop();
                    finish();
                }
                return Unit.INSTANCE;
            });
        });

        mSwitchCam.setOnClickListener(v -> {
            mFotoapparat.switchTo(backlens ? LensPositionSelectorsKt.front() : LensPositionSelectorsKt.back(), CameraConfiguration.standard());

            backlens = !backlens;
        });
    }

    @Override
    protected void onStart() {
        super.onStart();
        mFotoapparat.start();
    }

    @Override
    protected void onStop() {
        super.onStop();
        mFotoapparat.stop();
    }
}
