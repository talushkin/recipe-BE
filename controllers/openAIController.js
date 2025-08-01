// Generate 10 React questions with 4 possible answers (1 correct), with explanations, in the requested format
exports.getReactQuestion = async ({ numberOfQuestions = 10, numberOfPossibleAnswers = 4 } = {}) => {
  try {
    const prompt = `Generate an array of ${numberOfQuestions} multiple-choice questions focused on React, using the following topics and question styles as a guide. Each question should be clear, relevant, and similar in format and difficulty to these topics:

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
explanation: a string explaining the correct answer.
Return only a valid JSON array, do not include markdown, code blocks, or any extra text.`;
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

const { uploadBufferToS3 } = require("../utils/uploadToS3");
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

