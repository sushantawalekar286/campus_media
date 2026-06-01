import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

async function listModels() {
  try {
    const res = await ai.models.list();
    for await (const model of res) {
      if (model.name.includes("gemini")) {
        console.log(model.name);
      }
    }
  } catch (error) {
    console.log("FAILED:", error.message);
  }
}

listModels();
