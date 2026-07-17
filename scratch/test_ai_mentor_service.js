import dotenv from 'dotenv';
import { generateMentorResponse } from '../server/services/aiService.js';

dotenv.config();

async function runTest() {
  console.log("=== Starting AI Mentor Service Verification ===");

  const mockContext = {
    fullname: "Test Student",
    department: "Computer Science",
    year: "3rd Year",
    college: "Campus Tech University",
    careerGoal: "Full Stack Engineer",
    preferredRoles: ["Frontend Developer", "Full Stack Developer"],
    skills: ["JavaScript", "React", "Node.js", "MongoDB", "Express"],
    programmingLanguages: ["JavaScript", "HTML", "CSS"],
    frameworks: ["React", "Express"],
    projects: [
      {
        title: "E-Commerce App",
        description: "Built a fully functional storefront with checkout capability.",
        techStack: ["React", "Node.js", "MongoDB"]
      }
    ],
    achievements: [
      {
        title: "Hackathon Finalist",
        description: "Developed an AI chatbot in under 24 hours.",
        type: "hackathon"
      }
    ],
    resumeScore: 82,
    interviewScore: 78
  };

  const testPrompts = [
    "How can I improve my resume based on my profile?",
    "Should I learn Docker or Kubernetes first?",
    "What is the weather today in New York?" // This should trigger the scope guard redirection
  ];

  for (const prompt of testPrompts) {
    console.log(`\nPrompt: "${prompt}"`);
    try {
      const response = await generateMentorResponse(prompt, [], mockContext);
      console.log("Response Preview:");
      console.log(response.text.substring(0, 400) + "...\n");
      if (!response.text) {
        throw new Error("Empty response text returned!");
      }
      console.log("✅ Response generated successfully.");
    } catch (err) {
      console.error("❌ Test failed for prompt:", prompt, err);
      process.exit(1);
    }
  }

  console.log("\n=== All AI Mentor Service Tests Passed Successfully! ===");
}

runTest();
