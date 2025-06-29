import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import axiosInstance from '../api/axiosInstance';

const useCapsuleService = () => {
  const navigation = useNavigation();

  const getFileType = (fileUri, mediaType) => {
    if (!fileUri) return null;

    const fileName = fileUri.split('/').pop();
    const fileExtension = fileName.split('.').pop().toLowerCase();

    // Determine MIME type based on media type and extension
    switch (mediaType) {
      case 'photo':
        if (['jpg', 'jpeg'].includes(fileExtension)) return 'image/jpeg';
        if (fileExtension === 'png') return 'image/png';
        if (fileExtension === 'gif') return 'image/gif';
        return 'image/jpeg'; // default for photos
        
      case 'video':
        if (fileExtension === 'mp4') return 'video/mp4';
        if (fileExtension === 'mov') return 'video/quicktime';
        if (fileExtension === 'avi') return 'video/avi';
        return 'video/mp4'; // default for videos
        
      case 'audio':
        if (fileExtension === 'aac') return 'audio/aac';
        if (fileExtension === 'm4a') return 'audio/m4a';
        if (fileExtension === 'mp3') return 'audio/mpeg';
        if (fileExtension === 'wav') return 'audio/wav';
        return 'audio/aac'; // default for audio
        
      default:
        // Fallback: try to determine from extension
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

  const handleCreateCapsule = async (capsuleInfo) => {
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

      const formData = new FormData();
      formData.append('title', capsuleInfo.title);
      formData.append('description', capsuleInfo.description);
      formData.append('unlockDate', moment(capsuleInfo.unlockDate).format('YYYY-M-D'));
      formData.append('capsuleType', capsuleInfo.capsuleType);

      // Add media type to help backend process the file correctly
      if (capsuleInfo.mediaType) {
        formData.append('mediaType', capsuleInfo.mediaType);
      }

      if (capsuleInfo.capsuleType === 'Shared' && capsuleInfo.friends && capsuleInfo.friends.length > 0) {
        capsuleInfo.friends.forEach((friendId) => {
          formData.append('friends[]', friendId);
        });
      }

      if (capsuleInfo.fileUri) {
        const fileName = capsuleInfo.fileUri.split('/').pop();
        const mediaType = capsuleInfo.mediaType || 'photo'; // fallback to photo
        const fileType = getFileType(capsuleInfo.fileUri, mediaType);
        
        formData.append('file', {
          uri: capsuleInfo.fileUri,
          name: fileName,
          type: fileType,
        });

        console.log(`Uploading ${mediaType} file:`, {
          fileName,
          fileType,
          mediaType
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Media Error',
          text2: 'No valid media file provided.',
        });
        return;
      }

      const response = await axiosInstance.post('/api/timecapsules/create', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout for large files
      });

      const mediaTypeText = capsuleInfo.mediaType || 'media';
      Toast.show({
        type: 'success',
        text1: 'Capsule Created',
        text2: `Your time capsule with ${mediaTypeText} has been created successfully.`,
      });

      // Optional: Navigate to a success screen or back to main screen
      // navigation.navigate('Home');

      return response.data;

    } catch (error) {
      console.error('Error creating capsule:', error);
      
      let message = 'An error occurred while creating the capsule.';
      
      if (error.code === 'ECONNABORTED') {
        message = 'Upload timeout. Please check your connection and try again.';
      } else if (error.response) {
        // Server responded with error
        message = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Network error
        message = 'Network error. Please check your connection.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error Creating Capsule',
        text2: message,
      });
      throw error;
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
    getFileType 
  };
};

export default useCapsuleService;