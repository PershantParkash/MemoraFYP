import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance'; // Adjust the path as needed

const useFriendService = () => {
  const [allProfiles, setAllProfiles] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingRequestsProfile, setPendingRequestsProfile] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get auth token helper function
  const getAuthToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (!storedToken) {
        Alert.alert('Error', 'Authentication token not found.');
        return null;
      }
      return storedToken;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Fetch all profiles for "Find Friends" section
  const fetchAllProfiles = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await axiosInstance.get('/api/profile/getAllProfiles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      const filteredProfiles = data.filter(
        (profile) => !pendingRequests.some((request) => request.user_id === profile.userId)
      );

      setAllProfiles(filteredProfiles || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      Alert.alert('Error', 'Failed to load profiles.');
    }
  };

  // Fetch pending friend requests
  const fetchPendingRequests = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await axiosInstance.get('/api/friends/getPendingFriendRequests', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      setPendingRequests(data.pendingRequests || []);
      setPendingRequestsProfile(data.pendingRequests || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      Alert.alert('Error', 'Failed to load pending requests.');
    }
  };

  // Accept friend request
  const handleAcceptRequest = async (friendshipId) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await axiosInstance.post(
        '/api/friends/accept',
        { friendshipId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      Alert.alert('Success', data.message || 'Friend request accepted!');
      
      // Update state to remove the accepted request
      setPendingRequests((prev) => prev.filter((r) => r.userId !== friendshipId));
      setPendingRequestsProfile((prev) => prev.filter((p) => p.userId !== friendshipId));
      
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Could not accept request.');
      
      // Fallback: refresh pending requests
      await fetchPendingRequests();
      return { success: false, error: error.message };
    }
  };

  // Decline friend request
  const handleDeclineRequest = async (friendshipId) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await axiosInstance.post(
        '/api/friends/decline',
        { friendshipId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      Alert.alert('Success', data.message || 'Friend request declined!');
      
      // Update state to remove the declined request
      setPendingRequests((prev) => prev.filter((r) => r.userId !== friendshipId));
      setPendingRequestsProfile((prev) => prev.filter((p) => p.userId !== friendshipId));
      
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error declining request:', error);
      Alert.alert('Error', 'Could not decline request.');
      
      // Fallback: refresh pending requests
      await fetchPendingRequests();
      return { success: false, error: error.message };
    }
  };

  // Send friend request
  const sendFriendRequest = async (friend_user_id) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await axiosInstance.post(
        '/api/friends/send',
        { friend_user_id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Success', 'Friend request sent!');
      
      // Remove the user from allProfiles since request was sent
      setAllProfiles((prev) => prev.filter((p) => p.userId !== friend_user_id));
      
      return { success: true, message: 'Friend request sent!' };
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert('Error', 'Could not send request.');
      return { success: false, error: error.message };
    }
  };

  // Refresh all data
  const refreshData = async () => {
    setIsLoading(true);
    await fetchPendingRequests();
    await fetchAllProfiles();
    setIsLoading(false);
  };

  // Load initial data on hook mount
  useEffect(() => {
    refreshData();
  }, []);

  // Update allProfiles when pendingRequests changes
  useEffect(() => {
    if (pendingRequests.length > 0) {
      fetchAllProfiles();
    }
  }, [pendingRequests]);

  return {
    // State
    allProfiles,
    pendingRequests,
    pendingRequestsProfile,
    isLoading,
    
    // Functions
    fetchAllProfiles,
    fetchPendingRequests,
    handleAcceptRequest,
    handleDeclineRequest,
    sendFriendRequest,
    refreshData,
    
    // Setters (if needed for manual state updates)
    setAllProfiles,
    setPendingRequests,
    setPendingRequestsProfile,
    setIsLoading,
  };
};

export default useFriendService;