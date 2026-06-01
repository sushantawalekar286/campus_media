import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

async function test() {
  try {
    console.log("Calling Gemini...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello, say hi!",
    });
    console.log("SUCCESS:", response.text);
  } catch (error) {
    console.log("FAILED:", error.message);
  }
}

test();
