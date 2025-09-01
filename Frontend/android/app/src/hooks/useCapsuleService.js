import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import axiosInstance from '../api/axiosInstance';
import { getCurrentLocation } from './requestLocationPermission'
import { useState } from 'react';

const useCapsuleService = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
 
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

  const handleCreateCapsule = async (capsuleInfoOrFormData) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Error',
          text2: 'Please log in again.',
        });
        return;
      }

      let formData;

      // Case 1: Already FormData
      if (capsuleInfoOrFormData instanceof FormData) {
        formData = capsuleInfoOrFormData;
      } else {
        // Case 2: Plain object capsuleInfo
        const capsuleInfo = capsuleInfoOrFormData;
        formData = new FormData();

        formData.append('title', capsuleInfo.title);
        formData.append('description', capsuleInfo.description || '');
        formData.append(
          'unlockDate',
          moment(capsuleInfo.unlockDate).isValid()
            ? moment(capsuleInfo.unlockDate).toISOString()
            : ''
        );
        formData.append('capsuleType', capsuleInfo.capsuleType);

        if (capsuleInfo.mediaType) {
          formData.append('mediaType', capsuleInfo.mediaType);
        }

        // Friends (for shared capsules)
        if (
          capsuleInfo.capsuleType === 'Shared' &&
          capsuleInfo.friends &&
          capsuleInfo.friends.length > 0
        ) {
          capsuleInfo.friends.forEach((friendId) => {
            formData.append('friends[]', friendId);
          });
        }

        // Location - Get current location SAFELY
        try {
          const location = await getCurrentLocation();
          if (location && location.lat && location.lng) {
            formData.append('lat', location.lat.toString());
            formData.append('lng', location.lng.toString());
            console.log('Location added to capsule:', location);
          } else {
            console.warn('Could not get valid location for capsule');
          }
        } catch (locationError) {
          console.error('Error getting location in service:', locationError);
          // Continue without location - it's not mandatory
        }

        // Media File (if exists)
        if (capsuleInfo.fileUri) {
          const fileName = capsuleInfo.fileUri.split('/').pop();
          const fileType = getFileType(
            capsuleInfo.fileUri,
            capsuleInfo.mediaType || 'photo'
          );

          formData.append('files', {
            uri: capsuleInfo.fileUri,
            name: fileName,
            type: fileType,
          });

          console.log('Uploading media file:', {
            fileName,
            fileType,
            mediaType: capsuleInfo.mediaType,
          });
        }
      }

      const response = await axiosInstance.post(
        '/api/timecapsules/create',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      );

      Toast.show({
        type: 'success',
        text1: 'Capsule Created',
        text2: 'Your time capsule has been created successfully.',
      });

      return { success: true }; 
    } catch (error) {
      console.error('Error creating capsule:', error);
      
      let message = 'An error occurred while creating the capsule.';

      if (error.code === 'ECONNABORTED') {
        message = 'Upload timeout. Please check your connection and try again.';
      } else if (error.response) {
        message =
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        message = 'Network error. Please check your connection.';
      } else {
        message = error.message || 'Unknown error occurred';
      }

      Toast.show({
        type: 'error',
        text1: 'Error Creating Capsule',
        text2: message,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getUserCapsules = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axiosInstance.get('/api/timecapsules/getLoginUserCapsules', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data.capsules;
    } catch (error) {
      console.error('Error fetching capsules:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      throw new Error('Failed to load capsules. Please try again later.');
    }
  };

  const deleteCapsule = async (capsuleId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axiosInstance.delete(`/api/timecapsules/${capsuleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error deleting capsule:', error);
      throw new Error('Failed to delete capsule. Please try again later.');
    }
  };

  return { 
    handleCreateCapsule, 
    getUserCapsules, 
    deleteCapsule,
    getFileType,
    loading 
  };
};

export default useCapsuleService;