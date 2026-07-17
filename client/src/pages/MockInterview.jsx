import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, PhoneOff, Award, RotateCcw, Volume2, Activity, FileText } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { generateFeedbackFromTranscript } from '../services/geminiService';
import { useApp } from '../context/AppContext';
import { base64ToUint8Array, arrayBufferToBase64, decodeAudioData, float32ToInt16 } from '../utils/audioUtils';
import api from '../services/api';

export const MockInterview = () => {
  const { resumeContext } = useApp();
  
  // Config State
  const [role, setRole] = useState('');
  const [type, setType] = useState('Technical');
  const [level, setLevel] = useState('Entry-Level');

  // Centralized AI Profile State
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to load profile for AI Interview:", err);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, []);

  // Session State
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // AI Speaking
  const [userSpeaking, setUserSpeaking] = useState(false); // User Speaking visualizer
  const [feedback, setFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  
  // Transcripts
  const transcriptRef = useRef("");

  // Audio Refs
  const inputAudioContextRef = useRef(null);
  const outputAudioContextRef = useRef(null);
  const inputSourceRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  
  const sessionRef = useRef(null);
  const nextStartTimeRef = useRef(0);
  const sourceNodesRef = useRef(new Set());
  const isSessionActiveRef = useRef(false);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    if (!role) return;
    
    // Ensure previous session is fully cleaned up
    await stopSession();
    
    transcriptRef.current = "";
    setFeedback(null);
    isSessionActiveRef.current = true;
    
    try {
      let apiKey = import.meta.env?.VITE_GEMINI_API_KEY || '';
      try {
        const configRes = await api.get('/config/gemini-key');
        if (configRes.data?.apiKey) {
          apiKey = configRes.data.apiKey;
        }
      } catch (err) {
        console.warn("Could not fetch API key from backend config:", err);
      }

      if (!apiKey) {
        alert("Gemini API Key is not configured. Please ensure VITE_GEMINI_API_KEY or backend GEMINI_API_KEY is set.");
        await stopSession();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      inputAudioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      
      inputSourceRef.current = source;
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioCtx.destination);

      const outCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      outputAudioContextRef.current = outCtx;
      
      // Construct the dynamic interview context from the AI Profile
      let interviewContextSnippet = "";
      if (profile && profile.aiProfile && Object.keys(profile.aiProfile).length > 0 && (profile.aiProfile.skills?.length || profile.aiProfile.programmingLanguages?.length)) {
        const p = profile.aiProfile;
        interviewContextSnippet = `
          CANDIDATE PROFILE (CENTRALIZED AI PROFILE):
          - Preferred Job Roles: ${p.preferredRoles?.join(', ') || 'Not specified'}
          - Selected Interview Role: ${role}
          - Target Experience Level: ${level}
          - Resume Score: ${p.resumeScore || 0}/100
          - Career Interests: ${p.careerInterests?.join(', ') || 'Not specified'}
          - Domains of Interest: ${p.domains?.join(', ') || 'Not specified'}
          
          TECHNICAL SKILLS:
          - Programming Languages: ${p.programmingLanguages?.join(', ') || 'Not specified'}
          - Frameworks: ${p.frameworks?.join(', ') || 'Not specified'}
          - Libraries: ${p.libraries?.join(', ') || 'Not specified'}
          - Databases: ${p.databases?.join(', ') || 'Not specified'}
          - Cloud Platforms: ${p.cloudPlatforms?.join(', ') || 'Not specified'}
          - DevOps Tools: ${p.devopsTools?.join(', ') || 'Not specified'}
          - Version Control: ${p.versionControl?.join(', ') || 'Not specified'}
          - Operating Systems: ${p.operatingSystems?.join(', ') || 'Not specified'}
          - Development Tools: ${p.developmentTools?.join(', ') || 'Not specified'}
          - Testing Tools: ${p.testingTools?.join(', ') || 'Not specified'}
          - AI/ML Technologies: ${p.aiMlTechnologies?.join(', ') || 'Not specified'}
          - Other Technical Skills: ${p.skills?.join(', ') || 'Not specified'}
          
          SOFT SKILLS:
          - ${p.softSkills?.join(', ') || 'Not specified'}
          
          ACADEMIC INFORMATION:
          - College: ${p.college || 'Not specified'}
          - Department: ${p.department || 'Not specified'}
          - Branch: ${p.branch || 'Not specified'}
          - Current Year: ${p.year || 'Not specified'}
          - CGPA: ${p.cgpa || 'Not specified'}
          - Education History:
            ${(p.education || []).map(edu => `  * ${edu.degree} in ${edu.fieldOfStudy} at ${edu.school} (${edu.startYear}-${edu.endYear}) - CGPA: ${edu.cgpa}`).join('\n')}
            
          PROJECTS:
          ${(p.projects || []).map((proj, idx) => `  ${idx + 1}. Title: ${proj.title || proj.name}\n     Role: ${proj.role || 'Developer'}\n     Duration: ${proj.duration || ''}\n     Tech Stack: ${proj.techStack?.join(', ') || ''}\n     Description: ${proj.description}`).join('\n\n')}
          
          ACHIEVEMENTS:
          ${(p.achievements || []).map((ach, idx) => `  * [${ach.type}] ${ach.title}: ${ach.description} (${ach.date || ''})`).join('\n')}
          
          WORK EXPERIENCE:
          ${(p.experience || []).map((exp, idx) => `  * ${exp.role} at ${exp.company} (${exp.duration}): ${exp.description}`).join('\n')}
        `;
      } else {
        interviewContextSnippet = resumeContext.rawText 
          ? `CANDIDATE RESUME: "${resumeContext.rawText.slice(0, 5000)}"` 
          : "CANDIDATE RESUME: Not provided. Ask general questions.";
      }

      const systemInstruction = `
        You are an expert Voice Interviewer for a "${role}" role (${type}, ${level}).
        
        ${interviewContextSnippet}

        PROTOCOL (STRICTLY FOLLOW THIS SEQUENCE):
        1. GREETING: Brief, friendly welcome.
        2. QUESTION 1 (EASY): Based on a specific skill in their resume/profile.
        3. QUESTION 2 (EASY): Based on another skill/intro.
        4. QUESTION 3 (MEDIUM): Scenario based on their projects/experience.
        5. QUESTION 4 (MEDIUM): Technical depth question on their domain.
        6. QUESTION 5 (MEDIUM): Problem-solving scenario.
        7. QUESTION 6 (HARD): Advanced edge-case or system design question.
        8. QUESTION 7 (HARD): Deep dive into a resume/profile project's architecture.
        9. CLOSING: Thank them.

        RULES:
        - ASK ONLY ONE QUESTION AT A TIME.
        - WAIT for the user to answer before proceeding.
        - Keep your speech CONCISE (2-3 sentences max).
        - Speak naturally, acknowledge answers briefly ("Good point", "I see") before the next question.
        - DO NOT list the questions. Perform the interview live.
      `;

      // Create GoogleGenAI instance right before starting the session as per guidelines
      const ai = new GoogleGenAI({ apiKey });
      // Updated model to the latest gemini-2.5-flash-native-audio-preview-12-2025
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: systemInstruction,
          inputAudioTranscription: {}, 
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log("Session Opened");
            setIsConnected(true);
          },
          onmessage: async (message) => {
            if (!isSessionActiveRef.current) return;

            if (message.serverContent?.outputTranscription?.text) {
               transcriptRef.current += `AI: ${message.serverContent.outputTranscription.text}\n`;
            }
            if (message.serverContent?.inputTranscription?.text) {
               transcriptRef.current += `User: ${message.serverContent.inputTranscription.text}\n`;
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              try {
                // Ensure output context is valid
                if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') return;

                const audioData = base64ToUint8Array(base64Audio);
                const audioBuffer = await decodeAudioData(audioData, outputAudioContextRef.current, 24000, 1);
                
                // Double check active state after async decode
                if (!isSessionActiveRef.current || !outputAudioContextRef.current) return;

                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContextRef.current.destination);
                
                const currentTime = outputAudioContextRef.current.currentTime;
                const startTime = Math.max(currentTime, nextStartTimeRef.current);
                source.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration;
                
                sourceNodesRef.current.add(source);
                source.onended = () => {
                  sourceNodesRef.current.delete(source);
                  if (sourceNodesRef.current.size === 0) setIsSpeaking(false);
                };
              } catch (err) {
                console.error("Audio decoding/playback error:", err);
              }
            }

            if (message.serverContent?.interrupted) {
              sourceNodesRef.current.forEach(node => {
                try { node.stop(); } catch(e) {}
              });
              sourceNodesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onclose: (e) => {
            console.log("Session Closed", e);
            if (isSessionActiveRef.current) {
                stopSession();
            }
          },
          onerror: (e) => {
            console.error("Session Error", e);
            if (isSessionActiveRef.current) {
                stopSession();
            }
          }
        }
      });

      sessionRef.current = sessionPromise;

      processor.onaudioprocess = (e) => {
        if (!isSessionActiveRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const sum = inputData.reduce((a, b) => a + Math.abs(b), 0);
        setUserSpeaking(sum > 10);

        const pcm16 = float32ToInt16(inputData);
        const uint8 = new Uint8Array(pcm16.buffer);
        const base64 = arrayBufferToBase64(uint8.buffer);
        
        const currentSessionPromise = sessionRef.current;
        if (currentSessionPromise) {
            currentSessionPromise.then(async (session) => {
                if (isSessionActiveRef.current) {
                    try {
                      await session.sendRealtimeInput({
                        media: {
                          mimeType: 'audio/pcm;rate=16000',
                          data: base64
                        }
                      });
                    } catch (error) {
                      // Suppress network errors from sending to closed session
                      console.debug("Send input failed (session likely closed):", error);
                    }
                }
            }).catch(() => {
                // Ignore promise rejection if session connect failed
            });
        }
      };

    } catch (error) {
      console.error("Failed to start session", error);
      alert("Could not access microphone or start session.");
      stopSession();
    }
  };

  const stopSession = async () => {
    isSessionActiveRef.current = false;
    setIsConnected(false);
    setIsSpeaking(false);
    setUserSpeaking(false);

    // 1. Close Session
    if (sessionRef.current) {
      const currentSessionPromise = sessionRef.current;
      sessionRef.current = null; // Prevent re-entry
      try {
        const session = await currentSessionPromise;
        await session.close();
      } catch (e) {
        console.debug("Session close error ignored", e);
      }
    }

    // 2. Stop Media Stream (Release Microphone)
    if (streamRef.current) {
        try {
            streamRef.current.getTracks().forEach(track => track.stop());
        } catch(e) {}
        streamRef.current = null;
    }
    
    // 3. Disconnect Nodes
    if (inputSourceRef.current) {
      try { inputSourceRef.current.disconnect(); } catch (e) {}
      inputSourceRef.current = null;
    }
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch (e) {}
      processorRef.current = null;
    }
    
    // 4. Stop All Audio Sources
    sourceNodesRef.current.forEach(n => {
        try { n.stop(); } catch (e) {}
    });
    sourceNodesRef.current.clear();
    nextStartTimeRef.current = 0;

    // 5. Close Audio Contexts Safely
    const closeContext = async (ref) => {
        if (ref.current) {
            const ctx = ref.current;
            ref.current = null; // Prevent re-entry
            try {
                if (ctx.state !== 'closed') {
                    await ctx.close();
                }
            } catch (e) {
                // Ignore "Cannot close a closed AudioContext" errors
                console.debug("AudioContext close ignored", e);
            }
        }
    };

    await Promise.all([
        closeContext(inputAudioContextRef),
        closeContext(outputAudioContextRef)
    ]);
  };

  const handleEndSession = async () => {
     await stopSession();
     if (!transcriptRef.current) return;
     setLoadingFeedback(true);
     try {
       const result = await generateFeedbackFromTranscript(transcriptRef.current);
       setFeedback(result);
     } catch (e) {
       console.error("Feedback generation failed", e);
       alert("Could not generate feedback report.");
     } finally {
       setLoadingFeedback(false);
     }
  };

  const reset = () => {
    setFeedback(null);
    transcriptRef.current = "";
  };

  if (feedback) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Performance Report</h1>
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <RotateCcw size={18} /> New Interview
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-indigo-600 flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-medium">Interview Score</p>
            <p className="text-5xl font-bold text-slate-800">{feedback.score}<span className="text-2xl text-slate-400">/10</span></p>
          </div>
          <Award size={64} className="text-yellow-500" />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 text-lg">Corrected Answers (Learning Moments)</h3>
          <div className="space-y-4">
             {feedback.correctedAnswers?.map((item, i) => (
               <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="font-bold text-indigo-900 text-sm mb-2">Q: {item.question}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                     <div className="text-red-700 bg-red-50 p-2 rounded">
                        <span className="font-bold block text-xs uppercase mb-1">You Said:</span>
                        {item.originalAnswer || "No clear answer"}
                     </div>
                     <div className="text-green-700 bg-green-50 p-2 rounded">
                        <span className="font-bold block text-xs uppercase mb-1">Ideal Answer:</span>
                        {item.idealAnswer}
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-green-50 p-6 rounded-xl border border-green-100">
             <h3 className="font-bold text-green-800 mb-3 text-lg">Strengths</h3>
             <ul className="space-y-2">
               {(feedback.strengths || []).map((s, i) => (
                 <li key={i} className="flex items-start gap-2 text-green-700">
                   <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" /> {s}
                 </li>
               ))}
             </ul>
           </div>
           <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
             <h3 className="font-bold text-blue-800 mb-3 text-lg">Improvements</h3>
             <ul className="space-y-2">
               {(feedback.improvements || []).map((s, i) => (
                 <li key={i} className="flex items-start gap-2 text-blue-700">
                   <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" /> {s}
                 </li>
               ))}
             </ul>
           </div>
        </div>
      </div>
    );
  }

  if (loadingFeedback) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="text-xl font-bold text-slate-800">Generating Feedback Report...</h2>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-900 rounded-2xl relative overflow-hidden text-white p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 opacity-50"></div>
        <div className="relative z-10 flex flex-col items-center space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">{role} Interview</h2>
            <p className="text-indigo-200">AI is listening...</p>
          </div>
          <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${isSpeaking ? 'bg-indigo-500/20 scale-110 shadow-[0_0_50px_rgba(99,102,241,0.5)]' : 'bg-slate-800'}`}>
            <div className={`w-36 h-36 rounded-full flex items-center justify-center bg-indigo-600 transition-all duration-150 ${isSpeaking ? 'scale-105' : 'scale-100'}`}>
               <Mic size={64} className="text-white" />
            </div>
          </div>
          <div className="text-center space-y-2 h-16">
            <p className="text-xl font-medium animate-pulse">
              {isSpeaking ? "Interviewer Speaking..." : userSpeaking ? "You are speaking..." : "Listening..."}
            </p>
          </div>
          <button 
            onClick={handleEndSession}
            className="group flex items-center gap-3 bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-red-500/30"
          >
            <PhoneOff size={24} className="group-hover:scale-110 transition-transform" /> End
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto w-full my-auto bg-white p-8 rounded-2xl shadow-lg border border-indigo-50">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mic size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Voice AI Interviewer</h1>
        <p className="text-slate-500 mt-2">Realistic 7-Question Interview Flow based on your resume.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Role</label>
          <input
            type="text"
            placeholder="e.g. Product Manager"
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select 
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option>Technical</option>
              <option>HR</option>
              <option>Managerial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
            <select 
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option>Entry-Level</option>
              <option>Mid-Level</option>
              <option>Senior</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
           <div className="flex items-center gap-2 mb-2">
             <FileText size={18} className="text-slate-500" />
             <span className="text-sm font-bold text-slate-700">Interview Context Source</span>
           </div>
           {profile?.aiProfile && Object.keys(profile.aiProfile).length > 0 && (profile.aiProfile.skills?.length || profile.aiProfile.programmingLanguages?.length) ? (
             <div className="text-xs text-green-600 font-medium flex items-center gap-1">
               <span className="w-2 h-2 bg-green-500 rounded-full"></span>
               Centralized Student AI Profile active
             </div>
           ) : resumeContext.rawText ? (
             <div className="text-xs text-indigo-600 font-medium flex items-center gap-1">
               <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
               Temporary Resume Context loaded ({resumeContext.rawText.length} chars)
             </div>
           ) : (
             <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
               <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
               No profile or resume detected. Questions will be generic. (Go to Resume AI first)
             </div>
           )}
        </div>

        <button
          onClick={startSession}
          disabled={!role}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Play size={20} fill="currentColor" /> Start Interview
        </button>
      </div>
    </div>
  );
};
