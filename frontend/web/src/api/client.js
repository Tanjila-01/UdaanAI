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
