import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Crops API
export const getCrops = () => api.get('/crops');
export const getCrop = (id) => api.get(`/crops/${id}`);
export const createCrop = (data) => api.post('/crops', data);
export const updateCrop = (id, data) => api.put(`/crops/${id}`, data);
export const deleteCrop = (id) => api.delete(`/crops/${id}`);

// Weather API
export const getWeather = () => api.get('/weather');

// Soil API
export const getSoilData = () => api.get('/soil');

// Market Prices API
export const getMarketPrices = () => api.get('/market-prices');

// Alerts API
export const getAlerts = () => api.get('/alerts');
export const markAlertRead = (id) => api.put(`/alerts/${id}/read`);
export const deleteAlert = (id) => api.delete(`/alerts/${id}`);

// AI API
export const predictYield = (cropId) => api.post('/ai/yield-prediction', { crop_id: cropId });
export const analyzeCropHealth = (cropId, symptoms) => api.post('/ai/crop-health', { crop_id: cropId, symptoms });

// Dashboard API
export const getDashboardStats = () => api.get('/dashboard/stats');

export default api;
