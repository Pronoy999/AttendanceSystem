package com.pw.hyperxchange.visitormanagement.Objects;

import android.content.Context;

import com.android.volley.DefaultRetryPolicy;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.toolbox.Volley;

public class SingleTon {
    private RequestQueue requestQueue;
    private String TAG_CLASS = SingleTon.class.getSimpleName();
    private Context context;
    private static SingleTon singleTon;

    /**
     * Private Constructor.
     *
     * @param context: The HXApplication Context.
     */
    private SingleTon(Context context) {
        this.context = context;
        this.requestQueue = getRequestQueue();
    }

    /**
     * Method to initialize the Queue.
     *
     * @return requestQueue.
     */
    private RequestQueue getRequestQueue() {
        if (requestQueue == null)
            requestQueue = Volley.newRequestQueue(context);
        return requestQueue;
    }

    /**
     * Method to get the current instance of the SingleTon class or the Request queue.
     *
     * @param context: The Context of teh application.
     * @return singleTon: object which is either already initialized or will be.
     */
    public static synchronized SingleTon getInstance(Context context) {
        if (singleTon == null) {
            singleTon = new SingleTon(context.getApplicationContext());
        }
        return singleTon;
    }

    /**
     * Method to add the Request to the Queue.
     *
     * @param request: The Request to be added to the queue.
     */
    public void addToRequestQueue(Request request) {
        requestQueue.add(request).setRetryPolicy(new DefaultRetryPolicy());
    }
}
