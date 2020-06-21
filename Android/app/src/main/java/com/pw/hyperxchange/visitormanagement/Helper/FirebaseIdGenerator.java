package com.pw.hyperxchange.visitormanagement.Helper;

import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.FirebaseInstanceIdService;

public class FirebaseIdGenerator extends FirebaseInstanceIdService {
    private String TAG_CLASS = FirebaseIdGenerator.class.getSimpleName();

    @Override
    public void onTokenRefresh() {
        String token = FirebaseInstanceId.getInstance().getToken();
        Messages.logMessage(TAG_CLASS, "TOKEN *** - " + token);
        Constants.EMPLOYEE_DEVICE_TOKEN = token;
    }
}
