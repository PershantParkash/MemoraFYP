
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert, // ✅ Added missing import
} from 'react-native';
import { RadioButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import useCapsuleService from '../hooks/useCapsuleService';
import { MyContext } from '../context/MyContext';
import axiosInstance from '../api/axiosInstance';
import { useNavigation } from '@react-navigation/native';
import Config from 'react-native-config';

const SendCapsulePage = () => {
  const context = useContext(MyContext);
  const { handleCreateCapsule, getFileType } = useCapsuleService();
  const { capsuleInfo, setCapsuleInfo } = context;

  const [title, setTitle] = useState(capsuleInfo.title);
  const [description, setDescription] = useState(capsuleInfo.description);
  const [capsuleType, setCapsuleType] = useState(capsuleInfo.capsuleType);
  const [unlockDate, setUnlockDate] = useState(capsuleInfo.unlockDate);
  const [fileUri, setFileUri] = useState(capsuleInfo.fileUri);
  const [location, setLocation] = useState(capsuleInfo.location); // ✅ Fixed typo

  const navigation = useNavigation();
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isSendingCapsule, setIsSendingCapsule] = useState(false);

  const fetchFriends = async () => {
    setIsLoadingFriends(true);
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'No authentication token found. Please login again.',
      });
      setIsLoadingFriends(false);
      return;
    }

    try {
      const response = await axiosInstance.get('/api/friends/user-friends', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      if (data && data.friends) {
        const friendsData = await Promise.all(
          data.friends.map(async (friend) => {
            const profile = await fetchProfileByID(friend._id);
            return {
              ...friend,
              profilePicture: profile ? profile.profilePicture : null,
              username: profile ? profile.username : null,
            };
          })
        );
        setFriends(friendsData);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Failed to fetch friends data. Please check your connection.',
      });
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const fetchProfileByID = async (friendId) => {
    const token = await AsyncStorage.getItem('authToken');
    try {
      const response = await axiosInstance.get(`/api/profile/getProfileByID/${friendId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching profile by ID:', error);
      return null;
    }
  };

  const handleSelectFriend = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleSendCapsule = async () => {
    if (selectedFriends.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Recipients Selected',
        text2: 'Please select at least one friend to send the capsule.',
      });
      return;
    }

    setIsSendingCapsule(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      // Create the shared capsule with selected friends
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description || '');
      formData.append('unlockDate', unlockDate.toISOString());
      formData.append('capsuleType', capsuleType || 'Shared'); // ✅ Use state value with fallback
      
      // ✅ Add location data if available
      if (location?.lat && location?.lng) {
        formData.append('lat', location.lat.toString());
        formData.append('lng', location.lng.toString());
      } 

      // ✅ Add file with proper validation
      if (capsuleInfo.fileUri) {
        const fileName = capsuleInfo.fileUri.split('/').pop();
        const fileType = getFileType(
          capsuleInfo.fileUri,
          capsuleInfo.mediaType || 'photo'
        );

        formData.append('files', {
          uri: capsuleInfo.fileUri,
          name: fileName || 'uploaded_file',
          type: fileType,
        });
      } else {
        console.error('No file provided');
        Alert.alert('Error', 'Please select a file for the capsule.');
        setIsSendingCapsule(false);
        return;
      }

      // ✅ FIXED: Send friends as JSON string (matches backend expectation)
      formData.append('friends', JSON.stringify(selectedFriends));
      
      console.log('Sending capsule with friends:', selectedFriends);
      
      const response = await axiosInstance.post('/api/timecapsules/create', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      Toast.show({
        type: 'success',
        text1: 'Capsule Shared! 🎉',
        text2: `Successfully shared with ${selectedFriends.length} friend${selectedFriends.length > 1 ? 's' : ''}`,
      });
      
      // Clear the capsule info from context
      setCapsuleInfo({});
      
      setTimeout(() => {
        navigation.navigate('Tab');
      }, 500);
      
    } catch (error) {
      console.error('Error sharing capsule:', error);
      console.error('Error details:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 'Failed to share capsule. Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Share Failed',
        text2: errorMessage,
      });
    } finally {
      setIsSendingCapsule(false);
    }
  };

  const handleProfilePress = (friend) => {
    navigation.navigate('UserProfileScreen', {
      userId: friend._id,
      username: friend.username,
      profilePicture: friend.profilePicture,
    });
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  // ✅ Debug log to see what data we have
  useEffect(() => {
    console.log('SendCapsulePage - capsuleInfo:', {
      title,
      description,
      capsuleType,
      unlockDate,
      fileUri,
      location,
      selectedFriends: selectedFriends.length
    });
  }, [title, description, capsuleType, unlockDate, fileUri, location, selectedFriends]);

  if (isLoadingFriends) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6BAED6" />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Friends to Share With</Text>

      {/* ✅ Debug info for development */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Debug: {selectedFriends.length} friends selected
          </Text>
          {location && (
            <Text style={styles.debugText}>
              Location: {location.lat?.toFixed(4)}, {location.lng?.toFixed(4)}
            </Text>
          )}
        </View>
      )}

      {friends.length === 0 ? (
        <View style={styles.noFriendsContainer}>
          <Text style={styles.noFriendsText}>
            You don't have any friends to share this capsule with.
          </Text>
        </View>
      ) : (
        <ScrollView>
          {friends.map((friend) => (
            <View key={friend._id} style={styles.friendContainer}>
              <TouchableOpacity
                style={styles.profileSection}
                onPress={() => handleProfilePress(friend)}
              >
                <Image
                  source={{ uri: `${Config.API_BASE_URL}/uploads/${friend.profilePicture}` }}
                  style={styles.profilePic}
                />
                <Text style={styles.friendName}>{friend.username}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  selectedFriends.includes(friend._id) && styles.selectedButton,
                ]}
                onPress={() => handleSelectFriend(friend._id)}
                disabled={isSendingCapsule}
              >
                <RadioButton
                  value={friend._id}
                  status={selectedFriends.includes(friend._id) ? 'checked' : 'unchecked'}
                  onPress={() => handleSelectFriend(friend._id)}
                  disabled={isSendingCapsule}
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity
        style={[styles.sendButton, isSendingCapsule && styles.disabledButton]}
        onPress={handleSendCapsule}
        disabled={isSendingCapsule || selectedFriends.length === 0}
      >
        {isSendingCapsule ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator size="small" color="white" />
            <Text style={[styles.sendButtonText, styles.loadingButtonText]}>Sending...</Text>
          </View>
        ) : (
          <Text style={styles.sendButtonText}>
            Send Capsule {selectedFriends.length > 0 && `(${selectedFriends.length})`}
          </Text>
        )}
      </TouchableOpacity>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6BAED6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  debugInfo: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
  },
  friendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  friendName: {
    fontSize: 16,
    flex: 1,
  },
  noFriendsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noFriendsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#a5d6a7',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingButtonText: {
    marginLeft: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectButton: {
    padding: 10,
  },
  selectedButton: {
    backgroundColor: '#26c6da',
  },
});

export default SendCapsulePage;