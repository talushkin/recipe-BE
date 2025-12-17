const { S3Client, HeadBucketCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

/**
 * Check if S3 is accessible and configured correctly
 * @returns {Promise<{success: boolean, message: string, bucket: string}>}
 */
const checkS3Connection = async () => {
  const bucketName = process.env.BUCKET_NAME;
  const accessKeyId = process.env.ACCESS_KEY_ID;
  const secretAccessKey = process.env.SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION;

  // Check if all required environment variables are set
  if (!bucketName) {
    return {
      success: false,
      message: "❌ S3 Check: BUCKET_NAME not configured",
      bucket: null
    };
  }

  if (!accessKeyId || !secretAccessKey) {
    return {
      success: false,
      message: "❌ S3 Check: AWS credentials not configured",
      bucket: bucketName
    };
  }

  if (!region) {
    return {
      success: false,
      message: "❌ S3 Check: AWS_REGION not configured",
      bucket: bucketName
    };
  }

  try {
    // Create S3 client
    const s3Client = new S3Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    });

    // Try to access the bucket
    const command = new HeadBucketCommand({ Bucket: bucketName });
    await s3Client.send(command);

    return {
      success: true,
      message: `✅ S3 Check: Connected successfully to bucket "${bucketName}" in region "${region}"`,
      bucket: bucketName
    };
  } catch (error) {
    if (error.name === "NotFound") {
      return {
        success: false,
        message: `❌ S3 Check: Bucket "${bucketName}" does not exist`,
        bucket: bucketName,
        error: error.message
      };
    } else if (error.name === "Forbidden") {
      return {
        success: false,
        message: `❌ S3 Check: Access denied to bucket "${bucketName}" - check credentials and permissions`,
        bucket: bucketName,
        error: error.message
      };
    } else {
      return {
        success: false,
        message: `❌ S3 Check: Failed to connect - ${error.message}`,
        bucket: bucketName,
        error: error.message
      };
    }
  }
};

module.exports = { checkS3Connection };
