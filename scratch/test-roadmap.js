import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

async function test() {
  const model = "gemini-3.5-flash";
  const prompt = `
    Create a detailed, step-by-step 6-Stage Learning Roadmap for a student targeting the domain: "React Developer".
    Current Skills: JavaScript, HTML, CSS.
    
    Instructions:
    - If current skills are empty, assume beginner.
    - Stage 1 should be foundations, Stage 6 should be mastery/advanced projects.
    - Provide resource keywords (e.g. "MDN Docs", "Coursera", "Official Docs").
    - Time estimate should be realistic (e.g., "2 weeks").
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetDomain: { type: Type.STRING },
            stages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stageName: { type: Type.STRING },
                  description: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        topic: { type: Type.STRING },
                        reason: { type: Type.STRING },
                        timeEstimate: { type: Type.STRING },
                        difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
                        resources: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }
                    }
                  }
                }
              }
            }
          }
        },
      },
    });

    console.log("SUCCESS!");
    console.log(response.text);
  } catch (error) {
    console.log("FAILED:", error.message);
  }
}

test();
