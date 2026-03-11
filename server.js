require('dotenv').config(); // This loads the variables from .env
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;



const apiKey = process.env.ANTHROPIC_API_KEY;
console.log("Key loaded:", apiKey ? "Yes" : "No");

app.use(cors());
app.use(express.json());

async function callClaude(system, userMessage) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Anthropic API error ${res.status}: ${errorData.error?.message || res.statusText}`);
  }

  const data = await res.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// POST /api/devotion
// Body: { topic: string }
app.post("/api/devotion", async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: "topic is required" });

  try {
    const result = await callClaude(
      `You are a devotional writer for Perfectly Flawed Leadership — a faith-based leadership ministry. Tone: warm, honest, pastoral. Respond ONLY with valid JSON (no markdown, no backticks): {"title":"...","scripture":{"verse":"exact text","reference":"Book Ch:V"},"body":"3-4 paragraphs separated by \\n\\n","reflection":"one penetrating question","prayer":"2-3 sentence closing prayer"}`,
      `Write a devotion on the topic: ${topic}`
    );
    res.json(result);
  } catch (err) {
    console.error("Devotion error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leadership
// Body: { situation, details, style, teamLevel }
app.post("/api/leadership", async (req, res) => {
  const { situation, details, style, teamLevel } = req.body;
  if (!details) return res.status(400).json({ error: "details is required" });

  try {
    const result = await callClaude(
      `You are a seasoned, faith-grounded leadership advisor for Perfectly Flawed Leadership. Respond ONLY with valid JSON (no markdown, no backticks): {"headline":"bold truth 6-10 words","coretruth":"2-3 sentences","scriptures":[{"verse":"exact text","reference":"Book Ch:V","application":"1 sentence"},{"verse":"...","reference":"...","application":"..."},{"verse":"...","reference":"...","application":"..."}],"framework":{"name":"framework name","insight":"2 sentences applying it to this situation"},"actions":["verb-led action 1","action 2","action 3","action 4"],"caution":"one honest warning or blind spot","prayer_focus":"1-sentence prayer prompt"}`,
      `Situation: ${situation?.label}\nDetails: ${details}\nLeadership style: ${style || "Not specified"}\nTeam readiness: ${teamLevel || "Not specified"}`
    );
    res.json(result);
  } catch (err) {
    console.error("Leadership error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Perfectly Flawed backend running on http://localhost:${PORT}`);
});
