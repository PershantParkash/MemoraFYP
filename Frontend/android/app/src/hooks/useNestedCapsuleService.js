import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import axiosInstance from '../api/axiosInstance';

const useNestedCapsuleService = () => {
  const navigation = useNavigation();

  const getFileType = (fileUri, mediaType) => {
    if (!fileUri) return null;

    const fileName = fileUri.split('/').pop();
    const fileExtension = fileName.split('.').pop().toLowerCase();

    switch (mediaType) {
      case 'photo':
        if (['jpg', 'jpeg'].includes(fileExtension)) return 'image/jpeg';
        if (fileExtension === 'png') return 'image/png';
        if (fileExtension === 'gif') return 'image/gif';
        return 'image/jpeg'; 
        
      case 'video':
        if (fileExtension === 'mp4') return 'video/mp4';
        if (fileExtension === 'mov') return 'video/quicktime';
        if (fileExtension === 'avi') return 'video/avi';
        return 'video/mp4'; 
        
      case 'audio':
        if (fileExtension === 'aac') return 'audio/aac';
        if (fileExtension === 'm4a') return 'audio/m4a';
        if (fileExtension === 'mp3') return 'audio/mpeg';
        if (fileExtension === 'wav') return 'audio/wav';
        return 'audio/aac'; 
        
      default:
        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
          return `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
        }
        if (['mp4', 'mov', 'avi'].includes(fileExtension)) {
          return fileExtension === 'mov' ? 'video/quicktime' : `video/${fileExtension}`;
        }
        if (['aac', 'm4a', 'mp3', 'wav'].includes(fileExtension)) {
          return fileExtension === 'mp3' ? 'audio/mpeg' : `audio/${fileExtension}`;
        }
        return 'application/octet-stream';
    }
  };

const handleCreateNestedCapsule = async (formData) => {
  try {
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'Please log in again.',
      });
      return;
    }

    // Validate that we received FormData
    if (!(formData instanceof FormData)) {
      console.error('Expected FormData but received:', typeof formData);
      Toast.show({
        type: 'error',
        text1: 'Data Error',
        text2: 'Invalid data format provided.',
      });
      return;
    }

    // Debug: Log what we're sending to the server
    console.log('Sending nested capsule request to:', '/api/nestedcapsules/create');
    console.log('Request headers:', {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    });
    
    // Debug FormData contents
    if (formData._parts) {
      console.log('FormData contents being sent to nested capsule API:');
      formData._parts.forEach(([key, value]) => {
        if (key === 'files') {
          console.log(`${key}:`, { uri: value.uri, name: value.name, type: value.type });
        } else {
          console.log(`${key}:`, value);
        }
      });
    }

    const response = await axiosInstance.post('/api/nestedcapsules/create', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, 
    });

    console.log('Nested capsule creation response:', response.data);

    Toast.show({
      type: 'success',
      text1: 'Nested Capsule Created',
      text2: 'Your nested capsule has been created successfully.',
    });

    return response.data;

  } catch (error) {
    console.error('Error creating nested capsule:', error);
    
    let message = 'An error occurred while creating the nested capsule.';
    
    if (error.code === 'ECONNABORTED') {
      message = 'Upload timeout. Please check your connection and try again.';
    } else if (error.response) {
      console.error('Server response error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      message = error.response.data?.message || `Server error: ${error.response.status}`;
    } else if (error.request) {
      console.error('Network request error:', error.request);
      message = 'Network error. Please check your connection.';
    } else {
      console.error('General error:', error.message);
    }
    
    Toast.show({
      type: 'error',
      text1: 'Error Creating Nested Capsule',
      text2: message,
    });
    throw error;
  }
};

  const getNestedCapsules = async (parentCapsuleId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axiosInstance.get(`/api/nestedcapsules/parent/${parentCapsuleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching nested capsules:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      throw new Error('Failed to load nested capsules. Please try again later.');
    }
  };

  const getAllNestedCapsules = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axiosInstance.get('/api/nestedcapsules/all', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching all nested capsules:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      throw new Error('Failed to load nested capsules. Please try again later.');
    }
  };

  return { 
    handleCreateNestedCapsule, 
    getNestedCapsules, 
    getAllNestedCapsules,
    getFileType 
  };
};

export default useNestedCapsuleService; 