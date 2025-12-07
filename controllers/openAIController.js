// Generate 10 React questions with 4 possible answers (1 correct), with explanations, in the requested format
exports.getReactQuestion = async ({ oldQs=[], numberOfQuestions = 10, numberOfPossibleAnswers = 4 } = {}) => {
  try {
    // Create the base prompt
    let prompt = `Generate an array of ${numberOfQuestions} multiple-choice questions focused on React, using the following topics and question styles as a guide. Each question should be clear, relevant, and similar in format and difficulty to these topics:

Component Basics: correct syntax for functional components, exporting, return purpose, root elements, React.Fragment, JSX, children, null returns
Props: passing, mutability, required/default values, prop types
State Management: useState, mutability, async updates, initializing from props, setState in render
Hooks: useEffect, useRef, useMemo, cleanup, side effects, one-time effects
Component Composition: composition, passing components as props, controlled/uncontrolled, lifting state, splitting components
React Architecture: container vs presentational, Context API, prop drilling, when to use/avoid Context
Forms and Inputs: handling input, controlled/uncontrolled, validation, preventing default, accessing data
Folder Structure: where to store components, hooks, Redux, index.js, splitting styles
Advanced Concepts: code splitting, React.lazy, Suspense, SSR, hydration

Each question should be an object with:
q: the question (string),
answers: an array of ${numberOfPossibleAnswers} objects, each with { text: string, correct: boolean },
explanation: a string explaining the correct answer.`;

    // Add previous questions to avoid repetition
    if (oldQs && oldQs.length > 0) {
      const previousQuestions = oldQs.map(q => q.q || '').filter(q => q.trim() !== '').join('\n- ');
      if (previousQuestions) {
        prompt += `\n\nCRITICAL REQUIREMENT: Avoid generating questions that are semantically similar to these previously asked questions:\n- ${previousQuestions}\n\nDO NOT create questions that:
- Ask about the same React concept using different wording (e.g., "What is React.lazy?" vs "What does React.lazy do?")
- Cover the same functionality with slightly different phrasing
- Address the same topic from a similar angle
- Use synonyms or paraphrasing of existing questions

Generate completely NEW questions about DIFFERENT React concepts, features, or patterns that haven't been covered yet.`;
      }
    }

    prompt += `\n\nReturn only a valid JSON array, do not include markdown, code blocks, or any extra text.`;
    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: "gpt-4o-mini",
        store: true,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    const content = response.data.choices[0]?.message?.content;
    if (!content) throw new Error("No questions returned");
    let questions;
    try {
      questions = JSON.parse(content);
    } catch (err) {
      throw new Error("Failed to parse OpenAI response as JSON: " + err.message + "\nContent: " + content);
    }
    // Optionally validate/format the questions array here
    return questions;
  } catch (error) {
    const errorDetails = error?.response?.data || error.message || error;
    console.error("Error generating React questions:", errorDetails);
    throw { message: "Failed to generate React questions", details: errorDetails };
  }
};
// Get lyrics and chords for a song by title and artist using OpenAI (fallback if Ultimate Guitar scraping is not available)
exports.getSongLyricsChords = async ({ title, artist }) => {
  try {
    // Prompt OpenAI to return lyrics and chords in a readable format
    const prompt = `For the song '${title}' by '${artist}', return the full lyrics with guitar chords above the corresponding lines. Format as plain text, with chords in brackets above each lyric line. If chords are not available, return only the lyrics. Do not include any explanation, markdown, or extra text.`;
    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: "gpt-4o-mini",
        store: true,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    const lyricsChords = response.data.choices[0]?.message?.content?.trim();
    if (!lyricsChords) throw new Error("No lyrics/chords returned");
    return lyricsChords;
  } catch (error) {
    const errorDetails = error?.response?.data || error.message || error;
    console.error("Error fetching lyrics/chords from OpenAI:", errorDetails);
    throw { message: "Failed to fetch lyrics/chords", details: errorDetails };
  }
};
const path = require("path");
const axios = require("axios"); // Ensure you have axios installed
const dotenv = require("dotenv");
dotenv.config();

const uploadToS3Module = require("../utils/uploadToS3");
console.log('DEBUG uploadToS3Module:', uploadToS3Module);
const { uploadBufferToS3 } = uploadToS3Module;
exports.uploadBufferToS3 = uploadBufferToS3;
const Recipe = require("../models/Recipe"); // Make sure this path is correct
const Category = require("../models/Category");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = process.env.OPENAI_API_URL;
//console.log("OPENAI_API_KEY", OPENAI_API_KEY);
exports.translateDirectly = async (text, targetLanguage = "en") => {
  try {
    const prompt = `translate the following text to ${targetLanguage}:"${text}" , return only the trimmed Translation in the selected language, do not return any other text or explanation.`;
    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: "gpt-4o-mini",
        store: true,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    let result = response.data.choices[0]?.message?.content?.trim() || text;
    if (result.startsWith('"') && result.endsWith('"')) {
      result = result.slice(1, -1);
    }
    return result;
  } catch (error) {
    const errorDetails = error?.response?.data || error.message || error;
    console.error("Translation error details:", errorDetails);
    throw { message: "Translation failed", details: errorDetails };
  }
};

exports.createPictureFromText = async (text) => {
  try {
    const prompt = text;
    const response = await axios.post(
      `${OPENAI_API_URL}/images/generations`,
      {
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024", // changed from 256x256 to supported value
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    const imageUrl = response.data.data[0]?.url;
    if (!imageUrl) {
      console.error("OpenAI image response:", response.data);
      throw new Error("Failed to generate image");
    }
    // Fetch the image data using axios
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
    if (imageResponse.status !== 200) {
      throw new Error("Failed to download the image");
    }
    const imageBuffer = Buffer.from(imageResponse.data);
    // Replace text spaces or special characters to "-" on filename
    const sanitizedText = text.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${sanitizedText}-generated-image.png`;
    // Upload the image buffer to S3 using the uploadBufferToS3 utility
    const s3Url = await uploadBufferToS3(imageBuffer, filename);
    console.log("S3 URL:", s3Url);
    return { imageUrl: s3Url };
  } catch (error) {
    const errorDetails = error?.response?.data || error.message || error;
    console.error("Image generation error:", errorDetails);
    throw { message: "Image generation and saving failed", details: errorDetails };
  }
};

// New function: fillRecipe
// This function accepts an object containing recipeId and title,
// generates ingredients and preparation steps using OpenAI,
exports.fillRecipe = async ({ recipeId, title, categoryName='Salads', targetLanguage='en' }) => {
  try {
    // Generate prompt for OpenAI to return JSON with "ingredients" and "preparation"
    const prompt = title ? `Given the recipe title: (translate to en from ${targetLanguage}) "${title}", generate a list of ingredients and detailed preparation steps for a delicious recipe. \nReturn the result in en as JSON with two keys: "ingredients" (an array of strings) and "preparation" (a string).`
      : `create recipe with title for category: (translate to en from ${targetLanguage}) "${categoryName}", generate title, and a list of ingredients and detailed preparation steps for a delicious recipe. \nReturn the result in en as JSON with two keys: "title" (a string) "ingredients" (an array of strings) and "preparation" (a string).`;

    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: "gpt-4o-mini",
        store: true,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    // Get the AI response text
    const aiText = response.data.choices[0]?.message?.content;
    if (!aiText) {
      throw new Error("Failed to generate recipe details");
    }

    // Try to parse the response as JSON
    let recipeDetails;
    // If the response is not a valid JSON, it will throw an error
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in AI response");
      }
      recipeDetails = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      throw new Error("Failed to parse OpenAI response as JSON: " + parseError.message);
    }

    if (recipeId) {
      recipeDetails.recipeId = recipeId;
      const updatedRecipe = await Recipe.findByIdAndUpdate(
        recipeId,
        {
          ingredients: recipeDetails.ingredients,
          preparation: recipeDetails.preparation,
        },
        { new: true }
      );

      if (!updatedRecipe) {
        throw new Error(`RecipeId ${recipeId} not found or update failed`);
      }

      return updatedRecipe;
    }
    // If no recipeId, just return the filled recipe
    return recipeDetails;
  } catch (error) {
    const errorDetails = error?.response?.data || error.message || error;
    console.error("Fill recipe error:", errorDetails);
    throw { message: "Failed to fill recipe details", details: errorDetails };
  }
};

// Get a song list from OpenAI based on title, artist, or genre
exports.getSongListFromOpenAI = async ({ title, artist, genre }) => {
  try {
    let query = "Give me a JSON array of 15 popular songs";
    if (title || artist || genre) {
      query += " matching the following criteria:";
      if (title) query += ` title: '${title}',`;
      if (artist) query += ` artist: '${artist}',`;
      if (genre) query += ` genre: '${genre}',`;
    }
    query += " Each item should have: image (YouTube thumbnail), title, artist, url (YouTube), lyrics (first line), duration (mm:ss), createdAt (dd-mm-yyyy). Return only a valid JSON array, do not include markdown, code blocks, or any special characters before or after the JSON.";
    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: "gpt-4o-mini",
        store: true,
        messages: [{ role: "user", content: query }],
        temperature: 0.3,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const songList = response.data.choices[0]?.message?.content;
    if (!songList) {
      throw new Error("Failed to generate song list");
    }
console.log("OpenAI song list response:", songList);
    // Try to parse the response as JSON
    let songs;
    try {
      songs = JSON.parse(songList);
    } catch (parseError) {
      throw new Error("Failed to parse OpenAI song list response as JSON: " + parseError.message);
    }

    return songs;
  } catch (error) {
    const errorDetails = error?.response?.data || error.message || error;
    console.error("Error fetching song list from OpenAI:", errorDetails);
    throw { message: "Failed to fetch song list", details: errorDetails };
  }
};

// Fetch lyrics and chords for a song by scraping CifraClub (cheerio/axios)
// Requires: npm install axios cheerio
const cheerio = require('cheerio');
exports.getSongLyricsSRT = async ({ title, artist }) => {
  function buildUrl(artist, song) {
    const artistSlug = artist.toLowerCase().replace(/\s+/g, '-');
    const songSlug = song.toLowerCase().replace(/\s+/g, '-');
    return `https://www.cifraclub.com.br/${artistSlug}/${songSlug}/letra`;
  }
  try {
    if (!title || !artist) throw new Error('Both title and artist are required');
    const url = buildUrl(artist, title);
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    // Try .letra-l first, then fallback to .letra
    let lyrics = '';
    let letraDiv = $('.letra-l');
    if (letraDiv.length) {
      // Each <p> is a paragraph, each <span class="l_row"><span>...</span></span> is a line
      letraDiv.find('p').each((i, p) => {
        const lines = [];
        $(p).find("span.l_row").each((j, row) => {
          const line = $(row).text().trim();
          if (line) lines.push(line);
        });
        if (lines.length) {
          lyrics += lines.join("\n") + "\n";
        }
      });
    }
    if (!lyrics) {
      // Fallback: extract from .letra (each <p> is a paragraph)
      letraDiv = $('.letra');
      if (letraDiv.length) {
        letraDiv.find('p').each((i, p) => {
          const paragraph = $(p).text().replace(/\s*<br\s*\/?>/gi, '\n').trim();
          if (paragraph) lyrics += paragraph + "\n";
        });
      }
    }
    lyrics = lyrics.trim();
    if (!lyrics) {
      throw new Error('Lyrics not found. The structure may have changed.');
    }
    return lyrics;
  } catch (error) {
    console.error('Error fetching from CifraClub:', error.message || error);
    throw new Error('Lyrics not found or error occurred.');
  }
};

// Extract receipt data from image using AI prompt
const extractReceiptDataFromImage = async ({ imageUrl }) => {
  try {
    const prompt_text = `Please analyze this receipt image and extract the following information with MAXIMUM ACCURACY:

1. Shop Name (CRITICAL - the name of the store/restaurant):
- Look at the TOP of the receipt - the business name is usually the largest text at the top
- Check for Hebrew names with patterns like: "[Name] בעמ", "[Name] בע״מ", "[Name] ש.מ."
- Look for text that appears to be a business name, not addresses or other details
- Hebrew business names often contain words like: חברת, מרכז, חנות, בית, קניות, סופר, etc.
- English business names might have Ltd, Inc, Corp, Store, Market, etc.
- If multiple potential names exist, choose the most prominent one at the top
- Do NOT use address information as shop name
- Do NOT use product names or descriptions as shop name

2. Total Amount (the final amount paid, as a number):
- Look for words like: "סה״כ", "סך הכל", "סכום", "Total", "Amount", "כ"סה"
- Find the LARGEST amount on the receipt (usually at the bottom)
- CAREFULLY read ALL digits - look for amounts that might be 100+ shekels
- Pay special attention to the first digit which might be faint or partially visible
- Look at the complete number including leading digits (119.62, not 19.62)
- Include only the numeric value (no currency symbols)
- Double-check you're reading the complete total amount, not a partial view

3. Date (in DD-MM-YYYY format):
- Look for date near the top or bottom of receipt
- Common Hebrew date labels: "תאריך", "יום", "ת."
- Convert any format to DD-MM-YYYY (like 15-09-2025)
- For 2025 dates, use full year format (2025, not 25)

4. Time (in HH:MM format, 24-hour):
- Look for time next to the date
- Hebrew time labels: "שעה", "זמן", "ש."
- Convert to 24-hour format if needed

5. Receipt Number (if visible):
- Look for receipt/invoice numbers
- Common Hebrew labels: "מס' קבלה", "קבלה", "חשבונית"
- Return the number only

6. Text Rotation Analysis:
- Is the text rotated? If so, by how many degrees?
- Return 0 if upright, 90 if rotated 90° clockwise, -90 if counter-clockwise, 180 if upside down

RESPONSE FORMAT:
Return a JSON object with these exact keys:
{
    "shopName": "detected business name",
    "amount": 0.0,
    "date": "DD-MM-YYYY",
    "time": "HH:MM",
    "receiptNumber": "receipt number or empty string",
    "originalAngle": 0,
    "boundingBoxes": {},
    "confidence": "high/medium/low"
}

If you cannot clearly read any field, use empty string for text fields, 0.0 for amount, and "low" confidence.
BE EXTREMELY CAREFUL with the amount - make sure you read ALL digits correctly.`;

    const prompt = [
      {
        role: "system",
        content: "You are an expert at reading receipts and extracting business information with high accuracy. Focus especially on identifying the correct business name from receipt headers."
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt_text },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ];

    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: "gpt-4o-mini",
        messages: prompt,
        max_tokens: 500,
        temperature: 0.1
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const content = response.data.choices[0]?.message?.content;
    // Clean and parse JSON response
    let result;
    try {
      let cleaned = content.trim();
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      result = JSON.parse(cleaned);
      // Validate and clean the data
      result = {
        shopName: String(result.shopName || "").trim(),
        amount: result.amount ? parseFloat(result.amount) : 0.0,
        date: String(result.date || "").trim(),
        time: String(result.time || "").trim(),
        receiptNumber: String(result.receiptNumber || "").trim(),
        originalAngle: result.originalAngle ? parseInt(result.originalAngle) : 0,
        boundingBoxes: result.boundingBoxes || {},
        confidence: String(result.confidence || "medium").trim(),
        raw_response: content,
        prompt: prompt_text
      };
      // Validate date format
      if (result.date && !/^\d{2}-\d{2}-\d{4}$/.test(result.date)) {
        result.date = "";
      }
      // Validate time format
      if (result.time && !/^\d{2}:\d{2}$/.test(result.time)) {
        result.time = "";
      }
      return result;
    } catch (e) {
      // Fallback: try to extract basic info with regex
      return {
        shopName: "",
        amount: 0.0,
        date: "",
        time: "",
        receiptNumber: "",
        originalAngle: 0,
        boundingBoxes: {},
        confidence: "low",
        error: `Failed to parse OpenAI response: ${e}`
      };
    }
  } catch (error) {
    return {
      shopName: "",
      amount: 0.0,
      date: "",
      time: "",
      receiptNumber: "",
      originalAngle: 0,
      boundingBoxes: {},
      confidence: "low",
      error: `OpenAI processing failed: ${error}`
    };
  }
};
exports.extractReceiptDataFromImage = extractReceiptDataFromImage;

// Function to generate SQL queries from natural language using AI
exports.getSQLQuery = async ({ q, csv = null }) => {
  const fs = require("fs");
  const path = require("path");
  
  try {
    let tableSchemas = "";
    
    if (csv && Array.isArray(csv) && csv.length > 0) {
      // Use custom CSV data provided in the request
      for (const csvData of csv) {
        try {
          if (csvData.name && csvData.content) {
            const lines = csvData.content.split("\n");
            const headers = lines[0].split(",");
            const tableName = csvData.name.replace(/\.csv$/i, "");
            
            tableSchemas += `Table: ${tableName}\nColumns: ${headers.join(", ")}\n`;
            
            // Include sample data if available (first few rows)
            if (lines.length > 1) {
              tableSchemas += `Sample data (first 3 rows):\n`;
              for (let i = 1; i <= Math.min(3, lines.length - 1); i++) {
                if (lines[i].trim()) {
                  tableSchemas += `${lines[i]}\n`;
                }
              }
            }
            tableSchemas += "\n";
          }
        } catch (csvError) {
          console.warn(`Could not process CSV data for ${csvData.name}:`, csvError.message);
        }
      }
    } else {
      // Use default xplaceTables/csv files
      const csvPath = path.join(__dirname, "xplaceTables", "csv");
      const csvFiles = [
        "01_category.csv",
        "02_company.csv", 
        "03_project.csv",
        "04_bid.csv",
        "05_message.csv",
        "06_company_prefs.csv",
        "07_user_session.csv"
      ];
      
      // Read each CSV file and extract headers for schema
      for (const csvFile of csvFiles) {
        try {
          const filePath = path.join(csvPath, csvFile);
          const csvContent = fs.readFileSync(filePath, "utf8");
          const lines = csvContent.split("\n");
          const headers = lines[0].split(",");
          const tableName = csvFile.replace(/^\d+_/, "").replace(".csv", "");
          
          tableSchemas += `Table: ${tableName}\nColumns: ${headers.join(", ")}\n\n`;
        } catch (fileError) {
          console.warn(`Could not read ${csvFile}:`, fileError.message);
        }
      }
    }

    // Create AI prompt with table schemas
    const prompt = `You are an expert SQL query generator. Based on the following database schema, generate a SQL query to answer the user's question.

Database Schema:
${tableSchemas}

User Question: "${q}"

Rules:
1. Generate only the SQL query, no explanation
2. Use proper SQL syntax
3. Use table and column names exactly as provided
4. If the question cannot be answered with the available tables, return "Cannot generate query: insufficient table information"
5. For joins, use appropriate foreign key relationships (e.g., company_id references company table)
6. Return only the SQL query without any markdown formatting or code blocks

SQL Query:`;

    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: "gpt-4o-mini",
        store: true,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const sqlQuery = response.data.choices[0]?.message?.content?.trim();
    if (!sqlQuery) {
      throw new Error("No SQL query returned from AI");
    }

    return {
      query: q,
      sqlQuery: sqlQuery,
      tableSchemas: tableSchemas
    };

  } catch (error) {
    const errorDetails = error?.response?.data || error.message || error;
    console.error("Error generating SQL query:", errorDetails);
    throw { message: "Failed to generate SQL query", details: errorDetails };
  }
};

// Stub for GET /api/ai/pic2hesh
exports.pic2hesh = async () => {
  // Replace with actual logic as needed
  return { message: "pic2hesh endpoint response" };
};

// Generate job post using AI with specific format requirements
exports.getProjectAI = async ({ 
  lang = "עברית", 
  writingStyle = "Subtle marketing", 
  freeText, 
  jobRole = "", 
  jobType = "", 
  yearsExp = "", 
  mustSkills = "", 
  niceSkills = "",
  charCountLimits = {} 
}) => {
  try {
    if (!freeText) {
      throw new Error("freeText is required");
    }

    // Set default character limits if not provided
    const titleLimit = charCountLimits.title || 200;
    const descriptionLimit = charCountLimits.description || 300;
    const requirementsLimit = charCountLimits.requirements || 300;
    
    // Calculate minimum description length (70% of limit or 50 words minimum)
    const minDescriptionChars = Math.floor(descriptionLimit * 0.7);
    const minDescriptionWords = 50;

    const MODEL = process.env.MODEL || "gpt-4o-mini";

    // Build the prompt with all the rules and requirements
    const prompt = `
You are a human resources professional who creates job postings for freelance projects and gigs.
Your goal is to advertise a ${lang} project/job posting in a very convincing and professional way.
The posting is for a PROJECT (פרויקט), not a full-time employee position.
The job post must be clear, concise, and appealing to freelancers/contractors who want to work on this project.
It must include project benefits and use three text fields only: title, description, requirements.

IMPORTANT - SUPREME RULE:
- Title MUST be at most ${titleLimit} characters in the chosen language (${lang}).
- Description MUST be at least ${minDescriptionChars} characters (70% of ${descriptionLimit}) OR at least ${minDescriptionWords} words, AND at most ${descriptionLimit} characters in the chosen language (${lang}).
- Requirements MUST be at most ${requirementsLimit} characters in the chosen language (${lang}).
Do not exceed these character limits for any field.
CRITICAL: The description must be detailed and comprehensive, reaching at least 70% of the maximum allowed characters.

The job post output MUST follow exactly this structure:

||| title
%%% description
&&& requirements ^^^

Placeholders (replace before sending):
- %lang% -> ${lang}
- %writingstyle% -> ${writingStyle}
- %freetext% -> ${freeText}
- %jobrole% -> ${jobRole}
- %jobtype% -> ${jobType || ""}
- %yearsexp% -> ${yearsExp || ""}
- %mustskills% -> ${mustSkills || ""}
- %niceskills% -> ${niceSkills || ""}

KEY RULES (condensed, follow exactly):
- If job role contains English or is English, do not translate the job role.
- לעולם אל תרשום בטקסט של המשרה את תחום החברה.
- אל תעשה הטיות במילה מורה; אל תעשה הטיה בביטוי "דרוש ניסיון" או "נדרשת יכולת".
- Never write the company name.
- Use "אחריות" instead of "אחראיות".
- After דרוש/ה must appear the job role, then the job scope.
- developer = מפתח/ת.
- If the job language is ${lang}, description and requirements must be in ${lang}.
- Title must start with ||| and be up to ${titleLimit} characters.
- Description must start with %%% and be max ${descriptionLimit} characters.
- Requirements must start with &&& and end with ^^^ and be max ${requirementsLimit} characters.
- Use only round bullets (•) in requirements.
- Do not write "המשרה דורשת", "דרושה למשרה", "דרוש למשרה".
- Job type must be written only in the requirements section, not in the title.
- For experience:
  - 0 -> "אין צורך בניסיון קודם" or "ללא ניסיון"
  - 1-2 -> "ניסיון של שנה-שנתיים"
- MUST embed ${mustSkills || ""} as mandatory skills (חובה).
- NICE TO HAVE: ${niceSkills || ""} as יתרון.
- Use writing style: ${writingStyle} in title and description.
- MUST embed the project description from freeText (${freeText}) in the first two lines of the description, in Hebrew. This is the main project description that explains what the project is about.
- The advert must finish with the last requirement and not include any call-to-action, emails, or company identifiers.
- Never use emojis or the character " or /.
- If job role includes VP, keep as-is; in Hebrew description clarify VP means סמנכ"ל.
- Do not translate backend/frontend or other English tech terms.
- If job role is general, put "איש/אשת" before the role.
- If job role contains a hyphen, do not write the left side (domain) in the title.
- End the description with the job scope phrase (e.g., "העבודה במשרה מלאה").

Make sure the generated text strictly respects the 300-letters-per-field supreme rule and all other constraints above.
`;

    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [
          { role: "system", content: "You are a precise assistant that follows instructions exactly." },
          { role: "user", content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.2,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const output = response.data.choices?.[0]?.message?.content || response.data.choices?.[0]?.text;
    
    if (!output) {
      throw new Error("No response from AI");
    }

    // Parse the output to extract title, description, and requirements
    const outputText = output.trim();
    
    // Extract sections using regex
    const titleMatch = outputText.match(/\|\|\|\s*(.+?)(?=%%%|$)/s);
    const descriptionMatch = outputText.match(/%%%\s*(.+?)(?=&&&|$)/s);
    const requirementsMatch = outputText.match(/&&&\s*(.+?)(?=\^\^\^|$)/s);
    
    const title = titleMatch ? titleMatch[1].trim() : "";
    const description = descriptionMatch ? descriptionMatch[1].trim() : "";
    const requirements = requirementsMatch ? requirementsMatch[1].trim() : "";
    
    // Helper function to count words
    const countWords = (text) => {
      return text.split(/\s+/).filter(word => word.length > 0).length;
    };
    
    // Count characters for each section
    const charCount = {
      title: title.length,
      description: description.length,
      requirements: requirements.length
    };
    
    // Count words for each section
    const wordCount = {
      title: countWords(title),
      description: countWords(description),
      requirements: countWords(requirements)
    };

    return {
      lang,
      writingStyle,
      freeText,
      jobRole,
      jobType,
      yearsExp,
      mustSkills,
      niceSkills,
      charCountLimits: {
        title: titleLimit,
        description: descriptionLimit,
        requirements: requirementsLimit
      },
      output: outputText,
      charCount,
      wordCount,
      parsed: {
        title,
        description,
        requirements
      }
    };

  } catch (error) {
    const errorDetails = error?.response?.data || error.message || error;
    console.error("Error generating job post:", errorDetails);
    throw { message: "Failed to generate job post", details: errorDetails };
  }
};

