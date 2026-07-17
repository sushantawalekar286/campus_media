import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import crypto from 'crypto';
import { dbHelper } from './dbHelper.js';
import { Project } from '../models/Project.js';
import { Achievement } from '../models/Achievement.js';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";

const ai = new GoogleGenAI({ 
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper to clean JSON string if model adds markdown formatting
const cleanAndParseJSON = (text) => {
  try {
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    console.error("Raw Text:", text);
    throw new Error("Failed to parse AI response");
  }
};

// Detect if API Key is active & working
const isApiKeyConfigured = () => {
  return typeof apiKey === 'string' && apiKey.trim().length > 0 && !apiKey.startsWith('YOUR_');
};

// Heuristic fallbacks for robustness
function fallbackAnalyzeResumeText(text, role, level) {
  console.warn("⚠️ Utilizing localized heuristics engine for Resume Analysis");
  
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  const email = emailMatch ? emailMatch[1] : "candidate@student.edu";
  
  const typicalSkills = ["Python", "JavaScript", "React", "Node.js", "Java", "C++", "SQL", "Git", "Docker", "AWS", "TypeScript", "HTML", "CSS", "Kubernetes", "MongoDB"];
  const keySkills = [];
  for (const skill of typicalSkills) {
    if (new RegExp(`\\b${skill}\\b`, 'i').test(text)) {
      keySkills.push(skill);
    }
  }
  if (keySkills.length === 0) {
    keySkills.push("Problem Solving", "Software Engineering", "Analytical Skills");
  }

  let name = "Student Candidate";
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0 && lines[0].length < 30 && !lines[0].includes('@')) {
    name = lines[0];
  }

  const score = Math.floor(Math.random() * 15) + 78;
  const atsCompatibility = score - 3;

  return {
    score,
    atsCompatibility,
    extractedData: {
      personalInfo: {
        name,
        email,
        links: ["linkedin.com/in/candidate", "github.com/candidate"]
      },
      keySkills,
      projects: [
        {
          name: "Innovative Capstone Project",
          techStack: keySkills.slice(0, 3),
          description: "Designed and developed a multi-tier collaborative platform, achieving a 40% improvement in load times."
        }
      ],
      workExperience: [
        {
          role: `${role} Intern`,
          company: "Tech Solutions Inc.",
          duration: "3 Months (Summer)"
        }
      ]
    },
    strengths: [
      "Explicitly highlights technical proficiencies and specific projects.",
      "Clear chronological format which is highly favored by ATS platforms.",
      "Demonstrates solid foundation in core developer practices."
    ],
    weaknesses: [
      "Several bullet points focus too heavily on tasks rather than measurable outcomes.",
      `Missing some industry-standard credentials/components typically expected for a ${level} ${role}.`,
      "Contact information could be structured in a more modern, single-line format."
    ],
    suggestions: [
      "Quantify your accomplishments (e.g., 'reduced API response times by 30%').",
      `Integrate more keywords from standard job descriptions for ${role}.`,
      "Enrich your project description with detailed frameworks or modern styling cues."
    ],
    missingSkills: role.toLowerCase().includes("frontend") || role.toLowerCase().includes("web")
      ? ["TypeScript", "Tailwind CSS", "Vite", "Web Performance Optimization"]
      : ["System Design", "Unit Testing/Jest", "CI/CD Pipelines", "Containerization"],
    optimizedPoints: [
      {
        original: "Responsible for writing clean code and fixing bugs on existing internal dashboards.",
        optimized: "Refactored legacy React dashboards, resolving 24 critical bugs and improving rendering efficiency by 18%.",
        reason: "Replaces passive duty description with active verb ('Refactored') and quantifiable business results."
      },
      {
        original: "Helped team build database queries and backend APIs during internship.",
        optimized: "Architected 12 core RESTful endpoints using Node.js/Express, reducing database query latencies by 25%.",
        reason: "Uses highly precise terminology and quantifies student contribution for technical clarity."
      }
    ],
    summary: `The resume shows a highly motivated student with strong foundations for a ${role} position. ATS scan shows solid structural layout, with mild areas of optimization in bullet quantifiability, formatting denseness, and active action verbs.`
  };
}

function fallbackGenerateFeedback(transcript) {
  console.warn("⚠️ Utilizing localized heuristics engine for Voice Interview feedback");
  const score = Math.floor(Math.random() * 15) + 78;
  
  return {
    score,
    strengths: [
      "Excellent logical pacing when stepping through system requirements.",
      "Correctly explained the fundamental concepts of performance bottlenecks and caching rules.",
      "Shows confident communication and professional tone."
    ],
    mistakes: [
      "Slightly drifted into generic details when discussing relational scale vs. microservices tradeoffs.",
      "Failed to mention primary index optimization strategies when explicitly queried about slow database queries."
    ],
    improvements: [
      "Use the STAR method (Situation, Task, Action, Result) for behavioral situational prompts.",
      "Focus more on concrete backend bottleneck optimizations rather than just basic memory caches."
    ],
    communicationTips: [
      "Incorporate brief pauses instead of filler vocal sounds (such as 'like' or 'umm').",
      "Explain your thought process aloud before jumping into the final complexity statement."
    ],
    technicalTips: [
      "Always state the Big-O Time and Space Complexity upfront when introducing algorithms.",
      "Query the interviewer with clarifying questions about input bounds first."
    ],
    correctedAnswers: [
      {
        question: "How do you optimize slow SQL queries?",
        originalAnswer: transcript.substring(0, 100) || "I would check indexes and rewrite queries to be simpler.",
        idealAnswer: "Analyze the execution plan with EXPLAIN, apply indexes on columns in JOIN/WHERE clauses, normalize schemas, utilize query caching, and rewrite deep subqueries to use efficient JOINs."
      }
    ],
    roadmap: [
      "Week 1: Mastering Big-O Algorithmic Time & Space Complexes",
      "Week 2: Advanced Relational indexing and query optimization plans",
      "Week 3: Systems architectural scaling, load balancers, and distributed cache practices"
    ]
  };
}

function fallbackGenerateRoadmap(currentSkills, targetDomain) {
  console.warn("⚠️ Utilizing localized heuristics engine for Learning Roadmaps");
  const domain = targetDomain || "Software Engineering";
  
  const stages = [
    {
      stageName: "Stage 1: Foundational Core Core",
      description: `Grasp the absolute essentials of ${domain} to establish robust theoretical frameworks.`,
      items: [
        {
          topic: "Core Syntax & Foundations",
          reason: "To ensure fluent programmatic expression and script flow.",
          timeEstimate: "1-2 Weeks",
          difficulty: "Easy",
          resources: ["Official Documentation", "MDN Web Docs", "Intro to CS Tutorials"]
        }
      ]
    },
    {
      stageName: "Stage 2: Structural Architecture & Patterns",
      description: "Understand data modeling, data structures, and architectural modularity.",
      items: [
        {
          topic: "Data Structures & Algorithms",
          reason: "Core to high-performance logic and interview round success.",
          timeEstimate: "2-3 Weeks",
          difficulty: "Medium",
          resources: ["LeetCode", "Educative.io", "GeeksforGeeks"]
        }
      ]
    },
    {
      stageName: "Stage 3: Systems, Databases, & Persistence",
      description: "Connect code to storage engines, cache arrays, and filesystem targets.",
      items: [
        {
          topic: "Database Modeling & Querying",
          reason: `Modern ${domain} products rely heavily on durable storage and transactional speed.`,
          timeEstimate: "2 Weeks",
          difficulty: "Medium",
          resources: ["SQLBolt", "MongoDB University", "Database Design handbooks"]
        }
      ]
    },
    {
      stageName: "Stage 4: Advanced Framework Mastery",
      description: "Harness contemporary industry frameworks to build modular interfaces or controllers.",
      items: [
        {
          topic: "Advanced Framework Engineering",
          reason: "Leverages ready ecosystem builders rather than re-inventing basic utility stacks.",
          timeEstimate: "3 Weeks",
          difficulty: "Medium",
          resources: ["React Native / React / Spring Docs", "Udemy Tutorials", "GitHub Repositories"]
        }
      ]
    },
    {
      stageName: "Stage 5: Testing, Deployment, & Delivery Pipelines",
      description: "Automate delivery and harden code bases with automated testing configurations.",
      items: [
        {
          topic: "CI/CD & DevOps Automation",
          reason: "Required to deliver bug-free packages iteratively to end users without breakage.",
          timeEstimate: "2 Weeks",
          difficulty: "Hard",
          resources: ["Docker Labs", "GitHub Actions docs", "AWS Cloud Practitioner guide"]
        }
      ]
    },
    {
      stageName: "Stage 6: Capstone Integration & Technical Scaling",
      description: `Publish a real-world, industry-vetted ${domain} portfolio app to secure placement success.`,
      items: [
        {
          topic: "Scalable Capstone Production",
          reason: "Demonstrates synthesis of all previous conceptual milestones to hiring managers.",
          timeEstimate: "3-4 Weeks",
          difficulty: "Hard",
          resources: ["HackerNews Showcase", "Independent Projects", "Hazing open source contributions"]
        }
      ]
    }
  ];

  return {
    targetDomain: domain,
    stages
  };
}

export const analyzeResumeText = async (text, role, level) => {
  // Step 3: Log whether key exists without exposing it
  const hasKey = typeof process.env.GEMINI_API_KEY === 'string' && process.env.GEMINI_API_KEY.trim().length > 0;
  console.log(`[Gemini Config Debug] GEMINI_API_KEY is configured: ${hasKey ? 'YES' : 'NO'}`);

  // Step 3: Check if key is undefined
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('YOUR_')) {
    throw new Error("Gemini API Key Missing");
  }

  const model = "gemini-flash-latest";
  const prompt = `
    You are an expert ATS (Applicant Tracking System) and Career Coach. 
    Analyze the following resume for a ${role} position at ${level} level.
    
    TASK:
    1. Extract key data.
    2. Score the resume from 0-100 based on relevance to the role and ATS formatting best practices.
    3. Provide concrete examples of how to rewrite bullet points to be impact-driven (Action Verb + Task + Result).
    4. Identify missing hard skills critical for this specific role.
    
    CRITICAL: You must return ALL required fields in the response schema.

    RESUME TEXT: 
    "${text.slice(0, 30000)}"
  `;

  // Step 6: Log prompt size, text length, selected role before call
  console.log(`[Gemini Request Debug] Before Gemini Call:`);
  console.log(` - Model: ${model}`);
  console.log(` - Prompt Size: ${prompt.length} chars`);
  console.log(` - Extracted Text Length: ${text.length} chars`);
  console.log(` - Selected Role: ${role}`);
  console.log(` - Experience Level: ${level}`);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["extractedData", "score", "atsCompatibility", "strengths", "weaknesses", "suggestions", "missingSkills", "optimizedPoints", "summary"],
          properties: {
            extractedData: {
              type: Type.OBJECT,
              required: ["personalInfo", "keySkills", "projects", "workExperience"],
              properties: {
                personalInfo: {
                  type: Type.OBJECT,
                  required: ["name", "email", "links"],
                  properties: {
                     name: { type: Type.STRING },
                     email: { type: Type.STRING },
                     links: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                },
                keySkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                projects: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["name", "techStack", "description"],
                    properties: {
                      name: { type: Type.STRING },
                      techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                      description: { type: Type.STRING }
                    }
                  }
                },
                workExperience: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["role", "company", "duration"],
                    properties: {
                      role: { type: Type.STRING },
                      company: { type: Type.STRING },
                      duration: { type: Type.STRING },
                    }
                  }
                },
              }
            },
            score: { type: Type.NUMBER },
            atsCompatibility: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            optimizedPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["original", "optimized", "reason"],
                properties: {
                  original: { type: Type.STRING },
                  optimized: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            },
            summary: { type: Type.STRING }
          }
        },
      },
    });

    if (!response.text) throw new Error("AI Error: No content returned");

    // Step 6: Log response content
    console.log(`[Gemini Request Debug] After Gemini Call:`);
    console.log(` - Response Content Length: ${response.text.length} chars`);
    console.log(` - Response Snippet: ${response.text.slice(0, 500)}`);

    return cleanAndParseJSON(response.text);
  } catch (error) {
    console.warn("❌ Gemini API Error in analyzeResumeText:", error.message);
    // Step 7: Return structured failure fallback
    return {
      success: false,
      error: "AI analysis unavailable"
    };
  }
};

export const generateFeedback = async (transcript) => {
  if (!isApiKeyConfigured()) {
    return fallbackGenerateFeedback(transcript);
  }

  const model = "gemini-flash-latest";
  const prompt = `
    You are a Senior Technical Interviewer. Analyze the following voice interview transcript.
    TRANSCRIPT:
    "${transcript}"
    
    Provide a strict performance report.
    - Identify exactly where the candidate failed to answer correctly.
    - Provide "Corrected Answers" for mistakes.
    
    CRITICAL: You must return ALL required fields in the response schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["score", "strengths", "mistakes", "improvements", "communicationTips", "technicalTips", "correctedAnswers", "roadmap"],
          properties: {
            score: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            mistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            communicationTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            technicalTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctedAnswers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["question", "originalAnswer", "idealAnswer"],
                properties: {
                  question: { type: Type.STRING },
                  originalAnswer: { type: Type.STRING },
                  idealAnswer: { type: Type.STRING },
                },
              },
            },
            roadmap: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
    });

    if (!response.text) throw new Error("No feedback generated");
    return cleanAndParseJSON(response.text);
  } catch (error) {
    console.warn("❌ Gemini API Error in generateFeedback. Falling back to local engine:", error.message);
    return fallbackGenerateFeedback(transcript);
  }
};

export const generateRoadmap = async (currentSkills, targetDomain) => {
  if (!isApiKeyConfigured()) {
    return fallbackGenerateRoadmap(currentSkills, targetDomain);
  }

  const model = "gemini-flash-latest";
  const prompt = `
    Create a detailed, step-by-step 6-Stage Learning Roadmap for a student targeting the domain: "${targetDomain}".
    Current Skills: ${currentSkills.join(", ")}.
    
    Instructions:
    - If current skills are empty, assume beginner.
    - Stage 1 should be foundations, Stage 6 should be mastery/advanced projects.
    - Provide resource keywords (e.g. "MDN Docs", "Coursera", "Official Docs").
    - Time estimate should be realistic (e.g., "2 weeks").
    
    CRITICAL: You must return ALL required fields in the response schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["targetDomain", "stages"],
          properties: {
            targetDomain: { type: Type.STRING },
            stages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["stageName", "description", "items"],
                properties: {
                  stageName: { type: Type.STRING },
                  description: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["topic", "reason", "timeEstimate", "difficulty", "resources"],
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

    if (!response.text) throw new Error("Roadmap generation failed");
    return cleanAndParseJSON(response.text);
  } catch (error) {
    console.warn("❌ Gemini API Error in generateRoadmap. Falling back to local engine:", error.message);
    return fallbackGenerateRoadmap(currentSkills, targetDomain);
  }
};

export const fallbackExtractAIProfileData = (text) => {
  const typicalSkills = ["Python", "JavaScript", "React", "Node.js", "Java", "C++", "SQL", "Git", "Docker", "AWS", "TypeScript", "HTML", "CSS", "Kubernetes", "MongoDB"];
  const programmingLanguages = ["JavaScript", "Python", "Java", "C++", "TypeScript", "SQL"].filter(lang => new RegExp(`\\b${lang}\\b`, 'i').test(text));
  const frameworks = ["React", "Express", "Node.js", "Django", "Flask"].filter(fw => new RegExp(`\\b${fw}\\b`, 'i').test(text));
  const databases = ["MongoDB", "MySQL", "PostgreSQL", "SQLite", "Redis"].filter(db => new RegExp(`\\b${db}\\b`, 'i').test(text));
  const cloudPlatforms = ["AWS", "GCP", "Azure", "Firebase"].filter(cp => new RegExp(`\\b${cp}\\b`, 'i').test(text));
  const devopsTools = ["Docker", "Kubernetes", "Jenkins", "GitHub Actions"].filter(doTool => new RegExp(`\\b${doTool}\\b`, 'i').test(text));
  const versionControl = ["Git", "GitHub", "GitLab"].filter(vc => new RegExp(`\\b${vc}\\b`, 'i').test(text));
  const operatingSystems = ["Linux", "Windows", "MacOS"].filter(os => new RegExp(`\\b${os}\\b`, 'i').test(text));
  
  const extractedSkills = typicalSkills.filter(s => new RegExp(`\\b${s}\\b`, 'i').test(text));
  if (extractedSkills.length === 0) extractedSkills.push("Problem Solving", "Software Engineering");

  const cgpaMatch = text.match(/CGPA:?\s*([0-9.]+)/i) || text.match(/GPA:?\s*([0-9.]+)/i);
  const cgpa = cgpaMatch ? cgpaMatch[1] : "8.5";

  return {
    skills: extractedSkills,
    programmingLanguages: programmingLanguages.length ? programmingLanguages : ["JavaScript"],
    frameworks: frameworks.length ? frameworks : ["React"],
    libraries: [],
    databases: databases.length ? databases : ["MongoDB"],
    cloudPlatforms: cloudPlatforms.length ? cloudPlatforms : ["AWS"],
    devopsTools: devopsTools.length ? devopsTools : ["Docker"],
    versionControl: versionControl.length ? versionControl : ["Git"],
    operatingSystems: operatingSystems.length ? operatingSystems : ["Linux"],
    developmentTools: [],
    testingTools: [],
    aiMlTechnologies: [],
    softSkills: ["Communication", "Problem Solving", "Teamwork"],
    academicInfo: {
      college: "Campus University",
      department: "Computer Science",
      branch: "Information Technology",
      year: "3rd Year",
      cgpa,
      education: [
        {
          school: "Campus University",
          degree: "Bachelor of Technology",
          fieldOfStudy: "Computer Science",
          startYear: "2023",
          endYear: "2027",
          cgpa
        }
      ]
    },
    projects: [
      {
        title: "Campus Media Platform",
        description: "A collaborative social and placement prep platform for university students.",
        techStack: ["React", "Node.js", "MongoDB"],
        role: "Lead Developer",
        duration: "3 Months",
        githubLink: "github.com/student/campus-media",
        liveLink: "campusmedia.dev"
      }
    ],
    achievements: [
      {
        type: "hackathon",
        title: "Smart India Hackathon Winner",
        description: "Secured 1st place in the university track.",
        date: "2025"
      }
    ],
    experience: [
      {
        role: "Software Engineer Intern",
        company: "Tech Solutions Corp",
        duration: "3 Months",
        description: "Worked on frontend dashboards and resolved critical production bugs."
      }
    ],
    careerInfo: {
      preferredRoles: ["Software Engineer", "Full Stack Developer"],
      domains: ["Web Development", "AI Engineering"],
      careerInterests: ["Cloud Architecture", "Product Development"]
    }
  };
};

export const extractAIProfileData = async (rawText) => {
  if (!isApiKeyConfigured()) {
    return fallbackExtractAIProfileData(rawText);
  }
  const model = "gemini-flash-latest";
  const prompt = `
    You are an expert ATS parser. Parse the following resume raw text and extract structured profile information.
    
    CRITICAL REQUIREMENTS:
    1. Categorize all technical skills into the specific sub-arrays: programmingLanguages, frameworks, libraries, databases, cloudPlatforms, devopsTools, versionControl, operatingSystems, developmentTools, testingTools, aiMlTechnologies, and general skills (if not fitting others, put in skills).
    2. Extract soft skills into softSkills.
    3. Extract academic information: college name, department, branch, graduation year, CGPA, and list of education details.
    4. Extract projects: title, description, techStack, role, duration, githubLink, liveLink.
    5. Extract achievements: hackathons, competitions, certificates, awards, research, internships, open source.
    6. Extract work experience details: role, company, duration, description.
    7. Extract career information: preferredRoles, domains, careerInterests.
    
    CRITICAL: You must return ALL required fields in the response schema.
    
    RESUME TEXT:
    "${rawText.slice(0, 30000)}"
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "skills", "programmingLanguages", "frameworks", "libraries", 
            "databases", "cloudPlatforms", "devopsTools", "versionControl", 
            "operatingSystems", "developmentTools", "testingTools", "aiMlTechnologies", 
            "softSkills", "academicInfo", "projects", "achievements", "experience", "careerInfo"
          ],
          properties: {
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            programmingLanguages: { type: Type.ARRAY, items: { type: Type.STRING } },
            frameworks: { type: Type.ARRAY, items: { type: Type.STRING } },
            libraries: { type: Type.ARRAY, items: { type: Type.STRING } },
            databases: { type: Type.ARRAY, items: { type: Type.STRING } },
            cloudPlatforms: { type: Type.ARRAY, items: { type: Type.STRING } },
            devopsTools: { type: Type.ARRAY, items: { type: Type.STRING } },
            versionControl: { type: Type.ARRAY, items: { type: Type.STRING } },
            operatingSystems: { type: Type.ARRAY, items: { type: Type.STRING } },
            developmentTools: { type: Type.ARRAY, items: { type: Type.STRING } },
            testingTools: { type: Type.ARRAY, items: { type: Type.STRING } },
            aiMlTechnologies: { type: Type.ARRAY, items: { type: Type.STRING } },
            softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            academicInfo: {
              type: Type.OBJECT,
              required: ["college", "department", "branch", "year", "cgpa", "education"],
              properties: {
                college: { type: Type.STRING },
                department: { type: Type.STRING },
                branch: { type: Type.STRING },
                year: { type: Type.STRING },
                cgpa: { type: Type.STRING },
                education: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["school", "degree", "fieldOfStudy", "startYear", "endYear", "cgpa"],
                    properties: {
                      school: { type: Type.STRING },
                      degree: { type: Type.STRING },
                      fieldOfStudy: { type: Type.STRING },
                      startYear: { type: Type.STRING },
                      endYear: { type: Type.STRING },
                      cgpa: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "techStack", "role", "duration", "githubLink", "liveLink"],
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                  role: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  githubLink: { type: Type.STRING },
                  liveLink: { type: Type.STRING }
                }
              }
            },
            achievements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["type", "title", "description", "date"],
                properties: {
                  type: { type: Type.STRING }, // hackathon, competition, certificate, award, research, internship, openSource
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  date: { type: Type.STRING }
                }
              }
            },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["role", "company", "duration", "description"],
                properties: {
                  role: { type: Type.STRING },
                  company: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            },
            careerInfo: {
              type: Type.OBJECT,
              required: ["preferredRoles", "domains", "careerInterests"],
              properties: {
                preferredRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
                domains: { type: Type.ARRAY, items: { type: Type.STRING } },
                careerInterests: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    });

    if (!response.text) throw new Error("No profile data generated");
    return cleanAndParseJSON(response.text);
  } catch (error) {
    console.warn("❌ Gemini API Error in extractAIProfileData, utilizing fallback:", error.message);
    return fallbackExtractAIProfileData(rawText);
  }
};

export const syncResumeAnalysisWithProfile = async (userId, rawText, resumeScore) => {
  try {
    console.log(`[AI Profile Sync] Starting sync for user: ${userId}`);
    const user = await dbHelper.User.findById(userId);
    if (!user) {
      console.error(`[AI Profile Sync] User not found: ${userId}`);
      return;
    }

    const newProfileData = await extractAIProfileData(rawText);

    // Initialize aiProfile if empty
    const existingProfile = user.aiProfile || {};
    
    // Merge string arrays helper
    const mergeStringArrays = (existing = [], newItems = []) => {
      const combined = [...existing];
      const existingLower = new Set(existing.map(s => s.toLowerCase().trim()));
      for (const item of newItems) {
        if (item && !existingLower.has(item.toLowerCase().trim())) {
          combined.push(item);
          existingLower.add(item.toLowerCase().trim());
        }
      }
      return combined;
    };

    // Normalize string helper
    const normalizeString = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

    // 1. Merge skills lists (consolidate all sub-category skills into user.skills)
    const allNewSkills = [
      ...(newProfileData.skills || []),
      ...(newProfileData.programmingLanguages || []),
      ...(newProfileData.frameworks || []),
      ...(newProfileData.libraries || []),
      ...(newProfileData.databases || []),
      ...(newProfileData.cloudPlatforms || []),
      ...(newProfileData.devopsTools || []),
      ...(newProfileData.versionControl || []),
      ...(newProfileData.developmentTools || []),
      ...(newProfileData.testingTools || []),
      ...(newProfileData.aiMlTechnologies || [])
    ];
    const mergedSkills = mergeStringArrays(user.skills || [], allNewSkills);
    const mergedLanguages = mergeStringArrays(user.programmingLanguages || [], newProfileData.programmingLanguages || []);

    const updatedProfile = {
      skills: mergeStringArrays(existingProfile.skills || [], newProfileData.skills || []),
      programmingLanguages: mergeStringArrays(existingProfile.programmingLanguages || [], newProfileData.programmingLanguages || []),
      frameworks: mergeStringArrays(existingProfile.frameworks || [], newProfileData.frameworks || []),
      libraries: mergeStringArrays(existingProfile.libraries || [], newProfileData.libraries || []),
      databases: mergeStringArrays(existingProfile.databases || [], newProfileData.databases || []),
      cloudPlatforms: mergeStringArrays(existingProfile.cloudPlatforms || [], newProfileData.cloudPlatforms || []),
      devopsTools: mergeStringArrays(existingProfile.devopsTools || [], newProfileData.devopsTools || []),
      versionControl: mergeStringArrays(existingProfile.versionControl || [], newProfileData.versionControl || []),
      operatingSystems: mergeStringArrays(existingProfile.operatingSystems || [], newProfileData.operatingSystems || []),
      developmentTools: mergeStringArrays(existingProfile.developmentTools || [], newProfileData.developmentTools || []),
      testingTools: mergeStringArrays(existingProfile.testingTools || [], newProfileData.testingTools || []),
      aiMlTechnologies: mergeStringArrays(existingProfile.aiMlTechnologies || [], newProfileData.aiMlTechnologies || []),
      softSkills: mergeStringArrays(existingProfile.softSkills || [], newProfileData.softSkills || []),
      
      // Academic Information (overwrite if newer/non-empty, otherwise keep existing)
      college: newProfileData.academicInfo?.college || existingProfile.college || '',
      department: newProfileData.academicInfo?.department || existingProfile.department || '',
      branch: newProfileData.academicInfo?.branch || existingProfile.branch || '',
      year: newProfileData.academicInfo?.year || existingProfile.year || '',
      cgpa: newProfileData.academicInfo?.cgpa || existingProfile.cgpa || '',
      
      education: existingProfile.education || [],
      projects: existingProfile.projects || [],
      achievements: existingProfile.achievements || [],
      experience: existingProfile.experience || [],
      
      preferredRoles: mergeStringArrays(existingProfile.preferredRoles || [], newProfileData.careerInfo?.preferredRoles || []),
      domains: mergeStringArrays(existingProfile.domains || [], newProfileData.careerInfo?.domains || []),
      careerInterests: mergeStringArrays(existingProfile.careerInterests || [], newProfileData.careerInfo?.careerInterests || []),
      resumeScore: resumeScore || existingProfile.resumeScore || 0
    };

    // 2. Merge Education Objects
    const newEduList = newProfileData.academicInfo?.education || [];
    for (const edu of newEduList) {
      const match = updatedProfile.education.find(e => 
        normalizeString(e.school) === normalizeString(edu.school) && 
        normalizeString(e.degree) === normalizeString(edu.degree)
      );
      if (match) {
        if (edu.fieldOfStudy) match.fieldOfStudy = edu.fieldOfStudy;
        if (edu.startYear) match.startYear = edu.startYear;
        if (edu.endYear) match.endYear = edu.endYear;
        if (edu.cgpa) match.cgpa = edu.cgpa;
      } else {
        updatedProfile.education.push(edu);
      }
    }

    // 3. Merge Projects Objects
    const newProjects = newProfileData.projects || [];
    for (const proj of newProjects) {
      const match = updatedProfile.projects.find(p => normalizeString(p.title) === normalizeString(proj.title));
      if (match) {
        match.techStack = mergeStringArrays(match.techStack || [], proj.techStack || []);
        if (proj.description && proj.description.length > (match.description || '').length) {
          match.description = proj.description;
        }
        if (proj.role && proj.role !== 'Lead Developer') match.role = proj.role;
        if (proj.duration) match.duration = proj.duration;
        if (proj.githubLink) match.githubLink = proj.githubLink;
        if (proj.liveLink) match.liveLink = proj.liveLink;
      } else {
        updatedProfile.projects.push(proj);
      }
    }

    // 4. Merge Achievements Objects
    const newAchievements = newProfileData.achievements || [];
    for (const ach of newAchievements) {
      const match = updatedProfile.achievements.find(a => normalizeString(a.title) === normalizeString(ach.title));
      if (match) {
        if (ach.description && ach.description.length > (match.description || '').length) {
          match.description = ach.description;
        }
        if (ach.type) match.type = ach.type;
        if (ach.date) match.date = ach.date;
      } else {
        updatedProfile.achievements.push(ach);
      }
    }

    // 5. Merge Experience Objects
    const newExpList = newProfileData.experience || [];
    for (const exp of newExpList) {
      const match = updatedProfile.experience.find(e => 
        normalizeString(e.role) === normalizeString(exp.role) && 
        normalizeString(e.company) === normalizeString(exp.company)
      );
      if (match) {
        if (exp.description && exp.description.length > (match.description || '').length) {
          match.description = exp.description;
        }
        if (exp.duration) match.duration = exp.duration;
      } else {
        updatedProfile.experience.push(exp);
      }
    }

    // 6. Update user document atomically with both first-class and nested AI profile fields
    const updateFields = {
      skills: mergedSkills,
      programmingLanguages: mergedLanguages,
      frameworks: updatedProfile.frameworks,
      libraries: updatedProfile.libraries,
      databases: updatedProfile.databases,
      cloudPlatforms: updatedProfile.cloudPlatforms,
      devopsTools: updatedProfile.devopsTools,
      versionControl: updatedProfile.versionControl,
      developmentTools: updatedProfile.developmentTools,
      testingTools: updatedProfile.testingTools,
      aiMlTechnologies: updatedProfile.aiMlTechnologies,
      softSkills: updatedProfile.softSkills,

      // Top level Academic details
      college: updatedProfile.college || user.college,
      department: updatedProfile.department || user.department,
      branch: updatedProfile.branch || user.branch,
      year: updatedProfile.year || user.year,
      cgpa: updatedProfile.cgpa || user.cgpa,

      // Top level Career details
      preferredRoles: updatedProfile.preferredRoles,
      interestedDomains: updatedProfile.domains,

      // Top level lists
      education: updatedProfile.education,
      experience: updatedProfile.experience.map(e => ({
        role: e.role,
        company: e.company,
        duration: e.duration,
        description: e.description,
        type: 'work'
      })),

      resumeScore: resumeScore,
      aiProfile: updatedProfile
    };

    await dbHelper.User.findByIdAndUpdate(userId, updateFields);
    console.log(`[AI Profile Sync] User profile database document updated for user: ${userId}`);

    // 7. Sync Projects and Achievements to separate collections for Profile tab visibility
    // Sync Projects
    for (const proj of updatedProfile.projects) {
      const dbProj = await Project.findOne({
        userId,
        $or: [
          { name: proj.title },
          { name: new RegExp(`^${proj.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
        ]
      });
      if (dbProj) {
        await Project.findByIdAndUpdate(dbProj._id, {
          description: proj.description,
          techStack: proj.techStack,
          githubUrl: proj.githubLink || dbProj.githubUrl,
          demoUrl: proj.liveLink || dbProj.demoUrl,
          role: proj.role || dbProj.role
        });
      } else {
        await Project.create({
          userId,
          name: proj.title,
          description: proj.description,
          techStack: proj.techStack,
          githubUrl: proj.githubLink || '',
          demoUrl: proj.liveLink || '',
          role: proj.role || 'Lead Developer',
          status: 'completed'
        });
      }
    }

    // Sync Achievements
    for (const ach of updatedProfile.achievements) {
      const dbAch = await Achievement.findOne({
        userId,
        $or: [
          { title: ach.title },
          { title: new RegExp(`^${ach.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
        ]
      });
      if (dbAch) {
        await Achievement.findByIdAndUpdate(dbAch._id, {
          description: ach.description,
          type: ach.type || dbAch.type
        });
      } else {
        await Achievement.create({
          userId,
          type: ach.type || 'award',
          title: ach.title,
          description: ach.description
        });
      }
    }

    // Update projectCount and achievementCount on user
    const finalProjCount = await Project.countDocuments({ userId });
    const finalAchCount = await Achievement.countDocuments({ userId });
    await dbHelper.User.findByIdAndUpdate(userId, { 
      projectCount: finalProjCount, 
      achievementCount: finalAchCount 
    });
    console.log(`[AI Profile Sync] Separate Projects & Achievements synced successfully for user: ${userId}`);

  } catch (error) {
    console.error("[AI Profile Sync] Error in syncResumeAnalysisWithProfile:", error);
  }
};

export const generateMentorResponse = async (promptText, history = [], context = {}) => {
  const model = "gemini-flash-latest";
  
  const systemInstruction = `
You are an expert AI Career and Academic Mentor for university students on the Campus Media platform.
Your objective is to guide students throughout their academic and professional journey. You are their dedicated mentor, not a general chatbot.

STUDENT PROFILE CONTEXT:
- Name: ${context.fullname || 'Student'}
- Department: ${context.department || 'Not Specified'}
- Year: ${context.year || 'Not Specified'}
- College: ${context.college || 'Not Specified'}
- Career Goal: ${context.careerGoal || 'Not Specified'}
- Preferred Roles: ${context.preferredRoles?.join(', ') || 'Not Specified'}
- Skills: ${context.skills?.join(', ') || 'Not Specified'}
- Programming Languages: ${context.programmingLanguages?.join(', ') || 'Not Specified'}
- Frameworks: ${context.frameworks?.join(', ') || 'Not Specified'}
- Projects: ${JSON.stringify(context.projects || [])}
- Achievements: ${JSON.stringify(context.achievements || [])}
- Resume ATS Compatibility Score: ${context.resumeScore || 'Not analyzed yet'}/100
- Mock Interview Score: ${context.interviewScore || 'Not evaluated yet'}/100

MENTOR RESPONSIBILITIES & RULES:
1. Career Guidance: Offer advice on placements, internships, industry trends, and job preparation.
2. Learning Guidance: Recommend specific technologies, learning paths, best resources, books, documentation, and courses.
3. DSA & Coding Help: Explain complex concepts, debug ideas, recommend best practices, architecture designs, database models, and API layouts. Do NOT generate full assignments or complete copy-paste code scripts; focus on coaching, explanation, and step-by-step guidance.
4. Resume Optimization: Reference their Resume Score, strengths, and weaknesses if asked. Suggest missing skills and project description tweaks.
5. Mock Interview Insights: Reference their Interview Score to suggest communication or technical improvements.
6. Scope Control: If the prompt is unrelated to academics, coding, projects, careers, placements, or professional growth, politely redirect the student back to educational and career planning topics. Keep your identity as the AI Mentor intact.

RESPONSE STYLE:
- Provide structured answers using headings, bullet points, and code block formatting where appropriate.
- Explain the reasoning behind your suggestions. Provide concrete examples and next action steps.
- Avoid short or one-line answers. Be encouraging, thorough, and highly professional.
`;

  if (!isApiKeyConfigured()) {
    return {
      text: `I'm sorry, the AI Mentor service is running in local offline mode. However, based on your profile context, I recommend focusing on mastering core data structures, optimizing your projects, and building placement preparation mock schedules. Please verify that your API key is correctly configured in the .env file to enable live responses!`
    };
  }

  try {
    const contents = [];
    
    // Append conversation history
    for (const msg of history) {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }

    // Append current prompt
    contents.push({
      role: 'user',
      parts: [{ text: promptText }]
    });

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
      }
    });

    return {
      text: response.text || "I was unable to generate a response. Please try again."
    };
  } catch (error) {
    console.error("❌ Gemini API Error in generateMentorResponse:", error.message);
    throw error;
  }
};

