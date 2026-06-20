// API client — all requests go to Flask backend on port 5000
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// Attach token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login    = (email, password) => API.post('/auth/login', { email, password });
export const logout   = () => API.post('/auth/logout');
export const register = (data) => API.post('/auth/register', data);

// Stores
export const getStores  = () => API.get('/stores');
export const addStore   = (data) => API.post('/stores', data);

// Products
export const getProducts  = (storeId) => API.get(`/stores/${storeId}/products`);
export const addProduct   = (storeId, data) => API.post(`/stores/${storeId}/products`, data);
export const updateProduct = (storeId, productId, data) => API.put(`/stores/${storeId}/products/${productId}`, data);

// Excel upload
export const downloadTemplate = (storeId) =>
  API.get(`/stores/${storeId}/upload/template`, { responseType: 'blob' });
export const uploadExcelData = (storeId, file) => {
  const form = new FormData();
  form.append('file', file);
  return API.post(`/stores/${storeId}/upload/data`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Dashboard
export const getDashboard = (storeId) => API.get(`/stores/${storeId}/dashboard`);

// Inventory
export const getInventory = (storeId) => API.get(`/stores/${storeId}/inventory`);

// Insights
export const getInsights         = (storeId) => API.get(`/stores/${storeId}/insights`);
export const getAllRecommendations = () => API.get('/owner/all-recommendations');

// Sales
export const getMonthlySales   = (storeId) => API.get(`/stores/${storeId}/sales/monthly`);
export const getCategorySales  = (storeId) => API.get(`/stores/${storeId}/sales/category`);
export const getStockoutLosses = (storeId) => API.get(`/stores/${storeId}/sales/stockout-losses`);
export const getGstSummary     = (storeId) => API.get(`/stores/${storeId}/sales/gst-summary`);

export default API;
