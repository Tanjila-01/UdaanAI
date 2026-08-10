import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const checkGatewayHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message || 'API Gateway Unavailable' };
  }
};

export const registerApi = async (data) => {
  const response = await apiClient.post('/api/v1/auth/register', data);
  return response.data;
};

export const loginApi = async (data) => {
  const response = await apiClient.post('/api/v1/auth/login', data);
  return response.data;
};

export const getCurrentUserApi = async () => {
  const response = await apiClient.get('/api/v1/auth/me');
  return response.data;
};

export const logoutApi = async () => {
  try {
    const response = await apiClient.post('/api/v1/auth/logout');
    return response.data;
  } catch (e) {
    return { success: true };
  }
};

export const createProfileApi = async (data) => {
  const response = await apiClient.post('/api/v1/students/profile', data);
  return response.data;
};

export const getMyProfileApi = async () => {
  const response = await apiClient.get('/api/v1/students/profile/me');
  return response.data;
};

export const updateMyProfileApi = async (data) => {
  const response = await apiClient.put('/api/v1/students/profile/me', data);
  return response.data;
};

export const getPathwaysApi = async (params = {}) => {
  const cleanParams = {};
  if (params.education_level && typeof params.education_level === 'string' && params.education_level.trim()) {
    cleanParams.education_level = params.education_level.trim();
  }
  if (params.stream && typeof params.stream === 'string' && params.stream.trim()) {
    cleanParams.stream = params.stream.trim();
  }
  const response = await apiClient.get('/api/v1/roadmaps/pathways', { params: cleanParams });
  return response.data;
};

export const getPathwayDetailApi = async (pathwayId) => {
  const response = await apiClient.get(`/api/v1/roadmaps/pathways/${encodeURIComponent(pathwayId)}`);
  return response.data;
};

// --- Assessment Service APIs ---

export const getAssessmentsApi = async () => {
  const response = await apiClient.get('/api/v1/assessments');
  return response.data;
};

export const getAssessmentDetailApi = async (assessmentId) => {
  const response = await apiClient.get(`/api/v1/assessments/${encodeURIComponent(assessmentId)}`);
  return response.data;
};

export const startAssessmentAttemptApi = async (assessmentId) => {
  const response = await apiClient.post(`/api/v1/assessments/${encodeURIComponent(assessmentId)}/attempts`);
  return response.data;
};

export const submitAssessmentAnswerApi = async (attemptId, questionId, selectedOptionId) => {
  const response = await apiClient.post(`/api/v1/assessments/attempts/${encodeURIComponent(attemptId)}/answers`, {
    question_id: questionId,
    selected_option_id: selectedOptionId,
  });
  return response.data;
};

export const completeAssessmentAttemptApi = async (attemptId) => {
  const response = await apiClient.post(`/api/v1/assessments/attempts/${encodeURIComponent(attemptId)}/complete`);
  return response.data;
};

export const getAttemptDetailApi = async (attemptId) => {
  const response = await apiClient.get(`/api/v1/assessments/attempts/${encodeURIComponent(attemptId)}`);
  return response.data;
};

export const getAttemptResultApi = async (attemptId) => {
  const response = await apiClient.get(`/api/v1/assessments/attempts/${encodeURIComponent(attemptId)}/result`);
  return response.data;
};

export const getMyLatestAssessmentResultApi = async () => {
  const response = await apiClient.get('/api/v1/assessments/my-latest-result');
  return response.data;
};


