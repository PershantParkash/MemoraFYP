import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance';
import SessionManager from '../utils/sessionManager';

const useAuthService = () => {

  const loginUser = async (email, password) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', {
        email: email.trim(),
        password
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = response.data;
      const { token } = data;

      return {
        success: true,
        token,
        data,
        message: 'Login successful'
      };
    } catch (error) {
      const message = error.response?.data?.message || 'An unexpected error occurred. Please try again.';
      
      return {
        success: false,
        message,
        error
      };
    }
  };

  const logoutUser = async () => {
    try {
      const success = await SessionManager.clearSession();
      
      return {
        success,
        message: success ? 'Logout successful' : 'Error during logout'
      };
    } catch (error) {
      console.error('Error during logout:', error);
      return {
        success: false,
        message: 'Error during logout',
        error
      };
    }
  };

  const checkSessionStatus = async () => {
    try {
      const sessionStatus = await SessionManager.isSessionValid();
      
      if (!sessionStatus.valid) {
        if (sessionStatus.reason === 'expired') {
          return { isLoggedIn: false, sessionExpired: true };
        }
        return { isLoggedIn: false };
      }

      return { isLoggedIn: true };
    } catch (error) {
      console.error('Error checking session status:', error);
      return { isLoggedIn: false };
    }
  };

  const saveLoginSession = async (token, email, userData = null) => {
    try {
      const success = await SessionManager.saveSession(token, email, userData);
      return success;
    } catch (error) {
      console.error('Error saving login session:', error);
      return false;
    }
  };

  const getCurrentSession = async () => {
    try {
      return await SessionManager.getSessionData();
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  };

  const forceLogout = async () => {
    try {
      return await SessionManager.forceLogout();
    } catch (error) {
      console.error('Error during force logout:', error);
      return false;
    }
  };


const registerUser = async (email, password) => {
    try {
        const response = await axiosInstance.post('/api/auth/register', {
            email,
            password,
        });

        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Error during registration.';
        throw new Error(message);
    }
};

const createProfile = async (token, userData) => {
    const { fullName, cnic, dob, gender, address, contactNo, profilePic } = userData;
    
    const formData = new FormData();
    formData.append('username', fullName);
    formData.append('cnic', cnic);
    formData.append('dob', dob);
    formData.append('gender', gender);
    formData.append('address', address);
    formData.append('contactNo', contactNo);

    if (profilePic) {
        const fileName = profilePic.split('/').pop();
        const fileType = fileName.split('.').pop();
        formData.append('file', {
            uri: profilePic,
            name: fileName,
            type: `image/${fileType}`,
        });
    }

    try {
        const response = await axiosInstance.post(
            '/api/profile/createProfile',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Error creating profile.';
        throw new Error(message);
    }
};

  return { 
    loginUser, 
    registerUser, 
    createProfile, 
    logoutUser, 
    checkSessionStatus, 
    saveLoginSession,
    getCurrentSession,
    forceLogout
  };
};

export default useAuthService;
