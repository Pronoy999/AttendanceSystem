package com.pw.hyperxchange.visitormanagement.Helper;

import android.content.Context;

import com.android.volley.Request;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.pw.hyperxchange.visitormanagement.Objects.ByteRequest;
import com.pw.hyperxchange.visitormanagement.Objects.SingleTon;

import org.json.JSONException;
import org.json.JSONObject;

public class ServerConnector {
    private String TAG_CLASS = ServerConnector.class.getSimpleName();
    private Context context;
    private String url;

    public interface ResponseListener {
        void onResponse(JSONObject object);

        void onErrorResponse(VolleyError e);
    }

    private ResponseListener responseListener;

    public ServerConnector(Context context, String url, ResponseListener responseListener) {
        this.context = context;
        this.url = url;
        this.responseListener = responseListener;
    }


    /**
     * Method to make a POST Request.
     *
     * @param postData: The POST Data.
     */
    public void makeQuery(JSONObject postData) {
        JsonObjectRequest request = new JsonObjectRequest(Request.Method.POST, url,
                postData, response -> {
            if (responseListener != null) {
                responseListener.onResponse(response);
            }
        }, error -> {
            if (responseListener != null)
                responseListener.onErrorResponse(error);
        });
        SingleTon.getInstance(context).addToRequestQueue(request);
    }

    /**
     * Method to make a GET request.
     */
    public void makeQuery() {
        JsonObjectRequest request = new JsonObjectRequest(Request.Method.GET, url,
                null, response -> {
            if (responseListener != null) {
                responseListener.onResponse(response);
            }
        }, error -> {
            if (responseListener != null) {
                responseListener.onErrorResponse(error);
            }
        });
        SingleTon.getInstance(context).addToRequestQueue(request);
    }

    /**
     * Method to make a PUT Request.
     *
     * @param jsonObject: the JSON object.
     * @param isPut:      true to make a PUT request.
     */
    public void makeQuery(JSONObject jsonObject, boolean isPut) {
        if (isPut) {
            JsonObjectRequest request = new JsonObjectRequest(Request.Method.PUT, url,
                    jsonObject, response -> {
                if (responseListener != null) {
                    responseListener.onResponse(response);
                }
            }, error -> {
                if (responseListener != null)
                    responseListener.onErrorResponse(error);
            });
            SingleTon.getInstance(context).addToRequestQueue(request);
        } else {
            Messages.logMessage(TAG_CLASS, "false request.");
        }
    }

    /**
     * Method to make a POST Query with a byte stream.
     *
     * @param arr: The Byte array.
     */
    public void makeQuery(byte[] arr) {
        ByteRequest byteRequest = new ByteRequest(Request.Method.POST, url, (byte[] response) -> {
            if (responseListener != null) {
                try {
                    responseListener.onResponse(new JSONObject(new String(response)));
                } catch (JSONException e) {
                    Messages.logMessage(TAG_CLASS, e.toString());
                }
            }
        }, error -> {
            if (responseListener != null)
                responseListener.onErrorResponse(new VolleyError(error));
        }) {
            @Override
            public byte[] getBody() {
                return arr;
            }
        };
        SingleTon.getInstance(context).addToRequestQueue(byteRequest);
    }
}



