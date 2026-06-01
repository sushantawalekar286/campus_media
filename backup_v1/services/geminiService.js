import api from "./api";

export const analyzeResumeText = async (text, role, level) => {
  const response = await api.post('/resume/analyze', { text, targetRole: role, experienceLevel: level });
  return response.data;
};

export const generateFeedbackFromTranscript = async (transcript) => {
  const response = await api.post('/interview/feedback', { transcript });
  return response.data;
};

export const generateRoadmap = async (currentSkills, targetDomain) => {
  const response = await api.post('/roadmap', { currentSkills, targetDomain });
  return response.data;
};
