import { useState, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance'; 

const useFriendService = () => {
  const [allProfiles, setAllProfiles] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingRequestsProfile, setPendingRequestsProfile] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  
  const getAuthToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (!storedToken) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Authentication token not found.',
        });
        return null;
      }
      return storedToken;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load profiles.',
      });
    }
  };

  
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load pending requests.',
      });
    }
  };

  
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
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: data.message || 'Friend request accepted!',
      });
      
     
      setPendingRequests((prev) => prev.filter((r) => r.userId !== friendshipId));
      setPendingRequestsProfile((prev) => prev.filter((p) => p.userId !== friendshipId));
      
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error accepting request:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not accept request.',
      });
      
      
      await fetchPendingRequests();
      return { success: false, error: error.message };
    }
  };

 
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
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: data.message || 'Friend request declined!',
      });
      
      
      setPendingRequests((prev) => prev.filter((r) => r.userId !== friendshipId));
      setPendingRequestsProfile((prev) => prev.filter((p) => p.userId !== friendshipId));
      
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error declining request:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not decline request.',
      });
      
      
      await fetchPendingRequests();
      return { success: false, error: error.message };
    }
  };


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

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Friend request sent!',
      });
     
      setAllProfiles((prev) => prev.filter((p) => p.userId !== friend_user_id));
      
      return { success: true, message: 'Friend request sent!' };
    } catch (error) {
      console.error('Error sending request:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not send request.',
      });
      return { success: false, error: error.message };
    }
  };

 
  const refreshData = async () => {
    setIsLoading(true);
    await fetchPendingRequests();
    await fetchAllProfiles();
    setIsLoading(false);
  };

  
  useEffect(() => {
    refreshData();
  }, []);


  useEffect(() => {
    if (pendingRequests.length > 0) {
      fetchAllProfiles();
    }
  }, [pendingRequests]);

  return {
   
    allProfiles,
    pendingRequests,
    pendingRequestsProfile,
    isLoading,
    
   
    fetchAllProfiles,
    fetchPendingRequests,
    handleAcceptRequest,
    handleDeclineRequest,
    sendFriendRequest,
    refreshData,
    
   
    setAllProfiles,
    setPendingRequests,
    setPendingRequestsProfile,
    setIsLoading,
  };
};

export default useFriendService;