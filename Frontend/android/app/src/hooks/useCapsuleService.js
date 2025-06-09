import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // ✅ Replace expo-router with react-navigation
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import axiosInstance from '../api/axiosInstance';

const useCapsuleService = () => {
  const navigation = useNavigation(); // ✅ Replaces useRouter()

  const handleCreateCapsule = async (capsuleInfo) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      const formData = new FormData();
      formData.append('title', capsuleInfo.title);
      formData.append('description', capsuleInfo.description);
      formData.append('unlockDate', moment(capsuleInfo.unlockDate).format('YYYY-M-D'));
      formData.append('capsuleType', capsuleInfo.capsuleType);

      if (capsuleInfo.capsuleType === 'Shared' && capsuleInfo.friends.length > 0) {
        capsuleInfo.friends.forEach((friendId) => {
          formData.append('friends[]', friendId);
        });
      }

      if (capsuleInfo.fileUri) {
        const fileName = capsuleInfo.fileUri.split('/').pop();
        const fileType = fileName.split('.').pop();
        formData.append('file', {
          uri: capsuleInfo.fileUri,
          name: fileName,
          type: `image/${fileType}`,
        });
      } else {
        Alert.alert('Photo Error', 'No valid photo provided.');
        return;
      }

      const response = await axiosInstance.post('/api/timecapsules/create', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Capsule Created', 'Your time capsule has been created successfully.');

      // navigation.navigate('SomeScreen'); // ✅ You can redirect if needed

    } catch (error) {
      console.error('Error:', error);
      const message =
        error.response?.data?.message || 'An error occurred while creating the capsule.';
      Alert.alert('Error Creating Capsule', message);
    }
  };

  const getUserCapsules = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axiosInstance.get('/api/timecapsules/getLoginUserCapsules', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.capsules;
    } catch (error) {
      throw new Error('Failed to load capsules. Please try again later.');
    }
  };

  return { handleCreateCapsule, getUserCapsules };
};

export default useCapsuleService;
