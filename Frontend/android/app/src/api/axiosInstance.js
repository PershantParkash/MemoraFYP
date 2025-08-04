
import axios from 'axios';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SessionManager from '../utils/sessionManager';

const axiosInstance = axios.create({
  baseURL: Config.API_BASE_URL, 
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Update last activity time
        await SessionManager.updateLastActivity();
      }
    } catch (error) {
      console.error('Error adding auth token to request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear session
      try {
        await SessionManager.clearSession();
        console.log('Session expired, user logged out automatically');
        
        // You can add navigation logic here if needed
        // For now, the app will handle this in the App.tsx component
      } catch (clearError) {
        console.error('Error clearing session data:', clearError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
