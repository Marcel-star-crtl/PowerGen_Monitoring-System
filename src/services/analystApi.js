import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/analyst';

const analystApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
analystApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadBreakdownData = (data) => {
  return analystApi.post('/breakdowns/upload', data);
};

export const getBreakdownStats = (params = {}) => {
  return analystApi.get('/breakdowns/stats', { params });
};

export const getClusterPerformance = () => {
  return analystApi.get('/breakdowns/clusters');
};

export const getDurationTrend = (range = '7days') => {
  return analystApi.get(`/breakdowns/trend?range=${range}`);
};

export const getRCAAnalysis = () => {
  return analystApi.get('/breakdowns/rca');
};

export const getPenaltyReport = () => {
  return analystApi.get('/breakdowns/penalties');
};

export default analystApi;