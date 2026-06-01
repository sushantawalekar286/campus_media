import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

async function listModels() {
  try {
    const res = await ai.models.list();
    console.log("Response keys:", Object.keys(res));
    console.log("Response:", res);
  } catch (error) {
    console.log("FAILED:", error.message);
  }
}

listModels();
