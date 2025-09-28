const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth");
const multer = require("multer");
const upload = multer();
const {
  translateDirectly,
  createPictureFromText,
  fillRecipe,
  getSongListFromOpenAI,
  getSongLyricsSRT,
  getSongLyricsChords,
  getReactQuestion,
  uploadBufferToS3,
  extractReceiptDataFromImage
} = require("../controllers/openAIController");

// POST /api/ai/pic2hesh: Upload receipt image and extract data
router.post("/pic2hesh", auth, upload.single("image"), async (req, res) => {
  try {
    console.log('req.file:', req.file);
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "No image file uploaded" });
    }
    const originalName = req.file.originalname || "receipt";
    // Upload to S3
    const { imageUrl } = await uploadBufferToS3(req.file.buffer, originalName);
    // Extract receipt data using AI prompt
    const receiptData = await extractReceiptDataFromImage({ imageUrl });
    // Return both S3 URL and extracted data
    res.status(200).json({ imageUrl, receiptData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error", details: error?.response?.data });
  }
});

module.exports = router;
