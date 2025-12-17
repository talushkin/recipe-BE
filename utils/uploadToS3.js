const dotenv = require("dotenv");
dotenv.config({ path: "../config/.env" });

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const configuration = {
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};

const s3 = new S3Client({
  credentials: configuration,
});

const uploadBufferToS3 = async (buffer, fileName, fallbackUrl = null) => {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: "image/png", // Save as a PNG image
  };

  const s3Url = `https://${params.Bucket}.s3.amazonaws.com/${fileName}`;
  
  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);
    console.log("S3 upload successful:", s3Url);
    return s3Url;
  } catch (err) {
    console.error("S3 upload failed:", err.message);
    // Return fallback URL if provided, otherwise return the original buffer as URL if it's a string
    if (fallbackUrl) {
      console.log("Using fallback URL:", fallbackUrl);
      return fallbackUrl;
    }
    // If buffer is actually a URL string, return it
    if (typeof buffer === 'string') {
      console.log("Returning original URL from buffer:", buffer);
      return buffer;
    }
    // If no fallback available, return null
    console.log("No fallback URL available, returning null");
    return null;
  }
};

// Export the function directly for compatibility with destructured imports
module.exports.uploadBufferToS3 = uploadBufferToS3;
