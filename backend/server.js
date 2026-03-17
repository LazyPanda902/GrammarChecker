const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Grammar App backend is running." });
});

app.post("/api/grammar-check", async (req, res) => {
  try {
    const { text, mode } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required." });
    }

    let instruction = "";

    if (mode === "formal") {
      instruction = "Rewrite the text in a formal and professional tone. Keep the meaning the same.";
    } else if (mode === "casual") {
      instruction = "Rewrite the text in a casual, natural, and friendly tone. Keep the meaning the same.";
    } else if (mode === "rewrite") {
      instruction = "Rewrite the text clearly and naturally while preserving the meaning.";
    } else {
      instruction = "Correct the grammar, spelling, punctuation, and sentence structure while preserving the original meaning.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${instruction}

Return only the improved text and no extra commentary.

Text:
${text}`,
    });

    const result = response.text || "No result returned.";

    res.json({ result });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      error: "Failed to process text. Check your Gemini API key and backend logs.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});