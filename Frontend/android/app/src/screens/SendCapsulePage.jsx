import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RadioButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useCreateCapsule } from '../hooks/useCapsuleService';
import useCapsuleService from '../hooks/useCapsuleService';
import { MyContext } from '../context/MyContext';
import axiosInstance from '../api/axiosInstance';
import { useNavigation } from '@react-navigation/native';
import Config from 'react-native-config';

const SendCapsulePage = () => {
  const context = useContext(MyContext);
  const { handleCreateCapsule } = useCapsuleService();
  const { capsuleInfo, setCapsuleInfo } = context;

  const [title, setTitle] = useState(capsuleInfo.title);
  const [description, setDescription] = useState(capsuleInfo.description);
  const [capsuleType, setCapsuleType] = useState(capsuleInfo.capsuleType);
  const [unlockDate, setUnlockDate] = useState(capsuleInfo.unlockDate);
  const [fileUri, setFileUri] = useState(capsuleInfo.fileUri);

  const navigation = useNavigation();
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isSendingCapsule, setIsSendingCapsule] = useState(false);

  const fetchFriends = async () => {
    setIsLoadingFriends(true);
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      Alert.alert('Error', 'No authentication token found.');
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
      Alert.alert('Error', 'Failed to fetch friends data.');
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
      Alert.alert('Error', 'Please select at least one friend to send the capsule.');
      return;
    }

    setIsSendingCapsule(true);
    try {
      await handleCreateCapsule({
        title,
        description,
        unlockDate,
        capsuleType,
        fileUri,
        friends: selectedFriends,
      });
      navigation.navigate('Tab'); 
    } catch (error) {
      console.error('Error sending capsule:', error);
      Alert.alert('Error', 'Failed to send capsule. Please try again.');
    } finally {
      setIsSendingCapsule(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

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
      <Text style={styles.title}>Select Friends to Send Capsule</Text>
      {friends.length === 0 ? (
        <View style={styles.noFriendsContainer}>
          <Text style={styles.noFriendsText}>No friends found. Add friends to send capsules!</Text>
        </View>
      ) : (
        <ScrollView>
          {friends.map((friend) => (
            <TouchableOpacity
              key={friend._id}
              style={[
                styles.friendContainer,
                selectedFriends.includes(friend._id) && styles.selectedFriendContainer,
              ]}
              onPress={() => handleSelectFriend(friend._id)}
              disabled={isSendingCapsule}
            >
              <Image
                source={{ uri: `${Config.API_BASE_URL}/uploads/${friend.profilePicture}` }}
                style={styles.profilePic}
              />
              <Text style={styles.friendName}>{friend.username}</Text>
              <RadioButton
                value={friend._id}
                status={selectedFriends.includes(friend._id) ? 'checked' : 'unchecked'}
                onPress={() => handleSelectFriend(friend._id)}
                disabled={isSendingCapsule}
              />
            </TouchableOpacity>
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
          <Text style={styles.sendButtonText}>Send Capsule</Text>
        )}
      </TouchableOpacity>
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
  selectedFriendContainer: {
    backgroundColor: '#e0f7fa',
    borderColor: '#26c6da',
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
});

export default SendCapsulePage;
