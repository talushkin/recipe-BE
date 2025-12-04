const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const {
  translateDirectly,
  createPictureFromText,
  fillRecipe,
  getSongListFromOpenAI,
  getSongLyricsSRT,
  getSongLyricsChords,
  getReactQuestion,
  extractReceiptDataFromImage,
  uploadBufferToS3,
  getSQLQuery,
  getProjectAI
} = require("../controllers/openAIController");

const { 
  getSongListFromYouTube, 
  getPlaylistFromYouTube, 
  getPlaylistFromYouTubePerID,
  getSong10Words,
  getPlaylistById
} = require("../controllers/youTubeController");
const multer = require("multer");
const upload = multer();
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists before saving file
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Route for fetching lyrics and chords for a song (OpenAI fallback)
router.post("/get-song-lyrics-chords", auth, async (req, res) => {
  try {
    const { title, artist } = req.body;
    if (!title || !artist) {
      return res.status(400).json({ error: "Both title and artist are required" });
    }
    const lyricsChords = await getSongLyricsChords({ title, artist });
    res.status(200).json({ title, artist, lyricsChords });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error", details: error?.response?.data });
  }
});

// Route for text translation
router.post("/translate", auth, async (req, res) => {
  try {
    const { text, targetLanguage } = req.body; // Read from the request body
    if (!text) {
      return res.status(400).json({ error: "Text is required", text, targetLanguage });
    }
    const translatedText = await translateDirectly(text, targetLanguage);
    res.status(200).json({ text, targetLanguage, translatedText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error", details: error?.response?.data });
  }
});

// Route for image generation
router.post("/image", auth, async (req, res) => {
  try {
    const { text } = req.body; // Read from the request body
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const { imageUrl, savedPath } = await createPictureFromText(text);
    res.status(200).json({ text, imageUrl, savedPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error", details: error?.response?.data });
  }
});

// New Route for generating ingredients and preparation
router.post("/fill-recipe", auth, async (req, res) => {
  try {
    const { title, recipeId, targetLanguage, categoryName } = req.body; // for example, the recipe title
    // fillRecipe should generate ingredients and preparation using OpenAI
    const recipeData = await fillRecipe({ recipeId, title, categoryName, targetLanguage });
    if (!recipeData) {
      return res.status(404).json({ error: "Recipe not created", recipeData });
    }
    res.status(200).json(recipeData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error", details: error?.response?.data });
  }
});

// Route for getting a song list by title, artist, or genre (OpenAI only)
router.post("/get-song-list", auth, async (req, res) => {
  try {
    const { title, artist, genre } = req.body;
    const songs = await getSongListFromOpenAI({ title, artist, genre });
    res.status(200).json(songs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error", details: error?.response?.data });
  }
});

// Route for getting a song list from YouTube by title, artist, or genre
router.post("/get-youtube-song-list", auth, async (req, res) => {
  try {
    const { title, artist, genre } = req.body;
    const songs = await getSongListFromYouTube({ title, artist, genre });
    res.status(200).json(songs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error", details: error?.response?.data });
  }
});

// Route for fetching playlists from YouTube by query
router.post("/get-playlist-list", auth, async (req, res) => {
  try {
    const { q } = req.body;
    if (!q) {
      return res.status(400).json({ error: "Query (q) is required" });
    }
    const playlists = await getPlaylistFromYouTube({ q });
    res.status(200).json(playlists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error", details: error?.response?.data });
  }
});

// Route for generating SQL query from natural language
router.post("/get-sql-q", auth, async (req, res) => {
  try {
    const { q, csv } = req.body;
    if (!q) {
      return res.status(400).json({ error: "Query (q) is required" });
    }
    const SQLQuery = await getSQLQuery({ q, csv });
    res.status(200).json(SQLQuery);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error", details: error?.response?.data });
  }
});

// Route for fetching songs from a specific YouTube playlist by ID with pagination
router.post("/get-playlist-songs", auth, async (req, res) => {
  try {
    const { playlistId, skip = 0, limit = 10 } = req.body;
    if (!playlistId) {
      return res.status(400).json({ error: "playlistId is required" });
    }
    
    // Validate skip and limit
    const skipNum = Math.max(0, parseInt(skip) || 0);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit) || 10)); // Max 50 items
    
    const songs = await getPlaylistFromYouTubePerID({ 
      playlistId, 
      skip: skipNum, 
      limit: limitNum 
    });
    
    res.status(200).json({
      playlistId,
      skip: skipNum,
      limit: limitNum,
      count: songs.length,
      songs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error", details: error?.response?.data });
  }
});

// Route for fetching first 10 words of a song's lyrics
router.post("/get-song-10-words", auth, async (req, res) => {
  try {
    const { artist, title } = req.body;
    if (!artist || !title) {
      return res.status(400).json({ error: "Both artist and title are required" });
    }
    const result = await getSong10Words({ artist, title });
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error", details: error?.response?.data });
  }
});

// Route for fetching YouTube playlist metadata by ID
router.post("/getPlaylist", auth, async (req, res) => {
  try {
    const { playlistId } = req.body;
    if (!playlistId) {
      return res.status(400).json({ error: "playlistId is required" });
    }
    const playlist = await getPlaylistById({ playlistId });
    res.status(200).json(playlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error", details: error?.response?.data });
  }
});

// Route for fetching SRT lyrics for a song
router.post("/get-song-lyrics-srt", auth, async (req, res) => {
  try {
    const { title, artist } = req.body;
    if (!title || !artist) {
      return res.status(400).json({ error: "Both title and artist are required" });
    }
    const srt = await getSongLyricsSRT({ title, artist });
    res.status(200).json({ title, artist, srt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error", details: error?.response?.data });
  }
});

// Route for generating React multiple-choice questions (customizable)
router.post("/react-questionaire", auth, async (req, res) => {
  try {
    const { numberOfQuestions = 10, numberOfPossibleAnswers = 4, oldQs = [] } = req.body || {};
    const questions = await getReactQuestion({ numberOfQuestions, numberOfPossibleAnswers, oldQs });
    res.status(200).json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error", details: error.details || error?.response?.data });
  }
});

// Route for uploading a receipt image and extracting data using AI
router.post("/pic2hesh", auth, upload.single("image"), async (req, res) => {
  try {
    // If ?url= param is provided, use it for analysis only (no upload)
    const s3Url = req.query.url;
    if (s3Url) {
      // Direct S3 URL analysis
      const receiptData = await extractReceiptDataFromImage({ imageUrl: s3Url });
      return res.status(200).json({ imageUrl: s3Url, receiptData });
    }
    // Validate file presence
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    // Validate file selection
    if (!req.file.originalname) {
      return res.status(400).json({ error: "No file selected" });
    }
    // Validate file extension
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({ error: "Invalid file type. Only JPG, JPEG, and PNG files are allowed" });
    }
    // Save uploaded file temporarily
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
    const filename = `${timestamp}_${req.file.originalname}`;
    const tempPath = path.join(__dirname, "../uploads", filename);
    const fs = require("fs");
    const uploadsDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    fs.writeFileSync(tempPath, req.file.buffer);
    // TODO: Validate image (stub)
    // TODO: Implement validateImage(tempPath) and remove file if invalid
    // Upload to S3
    const imageUrl = await uploadBufferToS3(req.file.buffer, filename);
    // Extract receipt data using S3 URL
    let receiptData = await extractReceiptDataFromImage({ imageUrl });
    // TODO: Handle rotation if needed (stub)
    // TODO: Implement rotation logic and re-upload if required
    // Prepare response
    const image_filename = path.basename(tempPath);
    if (receiptData.error) {
      // Partial result for validation warnings
      const partial = {
        shopName: receiptData.shopName || "",
        amount: receiptData.amount || 0.0,
        date: receiptData.date || "",
        time: receiptData.time,
        receiptNumber: receiptData.receiptNumber || "",
        originalAngle: receiptData.originalAngle || 0,
        boundingBoxes: receiptData.boundingBoxes || {},
        image_url: `/uploads/${image_filename}`,
        validated: false,
        message: receiptData.error,
        s3_url: imageUrl,
        analysis_method: "s3_url",
        prompt: receiptData.prompt || "",
        raw_response: receiptData.raw_response || ""
      };
      return res.status(200).json(partial);
    }
    // Success path: Save to CSV (stub)
    // TODO: Implement saveToCSV logic
    receiptData.image_path = image_filename;
    receiptData.s3_url = imageUrl;
    // Prepare response
    const response_data = {
      shopName: receiptData.shopName,
      amount: receiptData.amount,
      date: receiptData.date,
      time: receiptData.time,
      receiptNumber: receiptData.receiptNumber,
      originalAngle: receiptData.originalAngle || 0,
      boundingBoxes: receiptData.boundingBoxes || {},
      image_url: `/uploads/${image_filename}`,
      expenseId: receiptData.id,
      s3_url: imageUrl,
      confidence: receiptData.confidence || "medium",
      analysis_method: "s3_url",
      prompt: receiptData.prompt || "",
      raw_response: receiptData.raw_response || ""
    };
    // TODO: Add CSV save result to response
    response_data.message = "Data successfully extracted";
    return res.status(200).json(response_data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal server error", details: error });
  }
});

// Route for generating job post with AI
router.post("/project-ai", auth, async (req, res) => {
  try {
    const { 
      lang = "עברית", 
      writingStyle = "Subtle marketing", 
      freeText, 
      jobRole, 
      jobType, 
      yearsExp, 
      mustSkills, 
      niceSkills,
      charCountLimits
    } = req.body;
    
    if (!freeText || !jobRole) {
      return res.status(400).json({ error: "freeText and jobRole are required" });
    }
    
    const result = await getProjectAI({ 
      lang, 
      writingStyle, 
      freeText, 
      jobRole, 
      jobType, 
      yearsExp, 
      mustSkills, 
      niceSkills,
      charCountLimits
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error", details: error?.response?.data });
  }
});

module.exports = router;