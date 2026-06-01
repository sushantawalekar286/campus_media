import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

async function test() {
  const model = "gemini-2.5-flash";
  const prompt = "Say hi!";
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    console.log("SUCCESS:", response.text);
  } catch (error) {
    console.log("FAILED:", error.message);
  }
}

test();
