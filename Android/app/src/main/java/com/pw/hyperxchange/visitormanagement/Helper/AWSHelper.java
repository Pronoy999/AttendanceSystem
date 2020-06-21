package com.pw.hyperxchange.visitormanagement.Helper;

import android.content.Context;

import com.amazonaws.auth.CognitoCachingCredentialsProvider;
import com.amazonaws.mobileconnectors.s3.transferutility.TransferUtility;
import com.amazonaws.regions.Region;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3Client;

public class AWSHelper {
    private AmazonS3Client s3Client;
    private CognitoCachingCredentialsProvider credentialsProvider;
    private TransferUtility transferUtility;

    /**
     * Method to get the Credentials for the S3 Bucket.
     *
     * @param context: The Context of the HXApplication.
     * @return credentialProvider: The newly initialized Credential Provider.
     */
    private CognitoCachingCredentialsProvider getCredentialsProvider(Context context) {
        if (credentialsProvider == null) {
            credentialsProvider = new CognitoCachingCredentialsProvider(context.getApplicationContext(),
                    Constants.COGNITO_POOL_ID, Regions.fromName(Constants.BUCKET_REGION));
        }
        return credentialsProvider;
    }

    /**
     * This is the method to get the S3 Client.
     *
     * @param context: The Context of the HXApplication.
     * @return S3Client: The initialized s3 client.
     */
    public AmazonS3Client getS3Client(Context context) {
        if (s3Client == null) {
            s3Client = new AmazonS3Client(getCredentialsProvider(context));
            s3Client.setRegion(Region.getRegion(Regions.fromName(Constants.BUCKET_REGION)));
        }
        return s3Client;
    }

    /**
     * This is the method to get the Transfer Utility client.
     *
     * @param context: The Context of the HXApplication.
     * @return transferUtility: The initialized Transfer Utility Client.
     */
    public TransferUtility getTransferUtility(Context context) {
        if (transferUtility == null) {
            transferUtility = TransferUtility.builder()
                    .context(context)
                    .s3Client(getS3Client(context))
                    .defaultBucket(Constants.BUCKET_NAME)
                    .build();
        }
        return transferUtility;
    }
}
