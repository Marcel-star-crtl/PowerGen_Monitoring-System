// import axios from 'axios';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add request interceptor for auth token
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // Generator endpoints
// export const getGenerators = () => api.get('/generators');
// export const createGenerator = (data) => api.post('/generators', data);
// export const updateGenerator = (id, data) => api.put(`/generators/${id}`, data);
// export const deleteGenerator = (id) => api.delete(`/generators/${id}`);
// export const updateGeneratorStatus = (id, status) => api.patch(`/generators/${id}/status`, { status });
// export const getGeneratorTelemetry = (id, params) => api.get(`/generators/${id}/telemetry`, { params });

// // Tower endpoints
// export const getTowers = () => api.get('/towers');
// export const createTower = (data) => api.post('/towers', data);
// export const updateTower = (id, data) => api.put(`/towers/${id}`, data);
// export const deleteTower = (id) => api.delete(`/towers/${id}`);

// // Telemetry endpoints
// export const submitTelemetry = (data) => api.post('/telemetry', data);
// export const getTelemetry = (params) => api.get('/telemetry/tower/:id', { params });

// // Maintenance endpoints
// export const getMaintenance = () => api.get('/maintenance');
// export const getGeneratorMaintenanceHistory = (id) => api.get(`/maintenance/generator/${id}`);
// export const createMaintenance = (data) => api.post('/maintenance', data);
// export const updateMaintenance = (id, data) => api.put(`/maintenance/${id}`, data);
// export const deleteMaintenance = (id) => api.delete(`/maintenance/${id}`);

// // Alert endpoints
// export const getAlerts = () => api.get('/alerts');
// export const resolveAlert = (id) => api.patch(`/alerts/${id}/resolve`);

// // Dashboard endpoints
// export const getDashboardStats = () => api.get('/stats');
// export const getTowerStats = () => api.get('/stats/towers');

// export default api;







// updated with simulation data
import axios from 'axios';
import { setupSocket } from './socket';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Initialize Socket.IO connection
const socket = setupSocket(api);

// Generator endpoints
export const getGenerators = () => api.get('/generators');
export const createGenerator = (data) => api.post('/generators', data);
export const updateGenerator = (id, data) => api.put(`/generators/${id}`, data);
export const deleteGenerator = (id) => api.delete(`/generators/${id}`);
export const updateGeneratorStatus = (id, status) => api.patch(`/generators/${id}/status`, { status });
export const getGeneratorTelemetry = (id, params) => api.get(`/generators/${id}/telemetry`, { params });

// Simulation endpoints
export const getSimulatedTelemetry = (generatorId) => api.get(`/simulation/${generatorId}/telemetry`);
export const startSimulation = (generatorId) => api.post(`/simulation/${generatorId}/start`);
export const stopSimulation = (generatorId) => api.post(`/simulation/${generatorId}/stop`);
export const updateSimulationParams = (generatorId, params) => api.put(`/simulation/${generatorId}/params`, params);

// Real-time telemetry subscription
export const subscribeToTelemetry = (generatorId, callback) => {
  socket.emit('subscribe-telemetry', generatorId);
  socket.on('telemetry-update', callback);
  return () => {
    socket.off('telemetry-update', callback);
    socket.emit('unsubscribe-telemetry', generatorId);
  };
};

// Real-time alerts subscription
export const subscribeToAlerts = (callback) => {
  socket.on('alert', callback);
  return () => {
    socket.off('alert', callback);
  };
};

// Tower endpoints
export const getTowers = () => api.get('/towers');
export const createTower = (data) => api.post('/towers', data);
export const updateTower = (id, data) => api.put(`/towers/${id}`, data);
export const deleteTower = (id) => api.delete(`/towers/${id}`);

// Telemetry endpoints
export const submitTelemetry = (data) => api.post('/telemetry', data);
export const getTelemetry = (params) => api.get('/telemetry', { params });
export const getTelemetryStats = (generatorId) => api.get(`/telemetry/${generatorId}/stats`);
export const exportTelemetry = (generatorId, format = 'csv') => 
  api.get(`/telemetry/${generatorId}/export`, { 
    params: { format },
    responseType: format === 'csv' ? 'blob' : 'json'
  });

// Maintenance endpoints
export const getMaintenance = () => api.get('/maintenance');
export const getGeneratorMaintenanceHistory = (id) => api.get(`/maintenance/generator/${id}`);
export const createMaintenance = (data) => api.post('/maintenance', data);
export const updateMaintenance = (id, data) => api.put(`/maintenance/${id}`, data);
export const deleteMaintenance = (id) => api.delete(`/maintenance/${id}`);
export const completeMaintenance = (id) => api.patch(`/maintenance/${id}/complete`);
export const scheduleMaintenance = (data) => api.post('/maintenance/schedule', data);

// Alert endpoints
export const getAlerts = () => api.get('/alerts');
export const getActiveAlerts = () => api.get('/alerts/active');
export const resolveAlert = (id) => api.patch(`/alerts/${id}/resolve`);
export const acknowledgeAlert = (id) => api.patch(`/alerts/${id}/acknowledge`);
export const getAlertStats = () => api.get('/alerts/stats');

// Dashboard endpoints
export const getDashboardStats = () => api.get('/stats');
export const getTowerStats = () => api.get('/stats/towers');
export const getGeneratorStats = (id) => api.get(`/stats/generators/${id}`);
export const getMaintenanceStats = () => api.get('/stats/maintenance');

// Simulation control endpoints
export const getSimulationStatus = () => api.get('/simulation/status');
// export const getSimulationStats = () => api.get('/simulation/stats');
export const setSimulationSpeed = (speed) => api.post('/simulation/speed', { speed });
export const triggerSimulationEvent = (event) => api.post('/simulation/trigger-event', { event });

export default api;