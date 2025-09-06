import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  SafeAreaView,
  FlatList,
  ScrollView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance';
import Toast from 'react-native-toast-message';
import useBackButtonHandler from '../hooks/useBackButtonHandler';
import { useNavigationContext } from '../context/NavigationContext';
import { useFocusEffect } from '@react-navigation/native';
import useFriendService from '../hooks/useFriendService';

const { width } = Dimensions.get('window');

const UserProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { addToHistory } = useNavigationContext();
  
  // Use the friend service hook
  const {
    handleAcceptRequest,
    handleDeclineRequest,
    sendFriendRequest,
  } = useFriendService();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('capsules');
  const [capsules, setCapsules] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isLoadingCapsules, setIsLoadingCapsules] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Get both userId and context from route params
  const { userId, context } = route.params || {};
  
  // Use custom back button handler
  useBackButtonHandler();
  
  // Track navigation history
  useFocusEffect(
    React.useCallback(() => {
      addToHistory('UserProfile');
    }, [addToHistory])
  );

  const fetchUserProfile = async () => {
    if (!userId) {
      setError('No user ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // Only fetch profile data
      const response = await axiosInstance.get(`/api/profile/getProfileByID/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfileData(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile data');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load profile data',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's public capsules
  const fetchCapsules = async () => {
    if (!userId) return;
    
    setIsLoadingCapsules(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axiosInstance.get(`/api/profile/getUserPublicCapsules/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCapsules(response.data.capsules || []);
    } catch (error) {
      console.error('Error fetching capsules:', error);
      // Don't show toast error for background loading
      if (activeTab === 'capsules') {
        setError('Failed to load capsules');
      }
    } finally {
      setIsLoadingCapsules(false);
    }
  };

  // Fetch user's friends
  const fetchFriends = async () => {
    if (!userId) return;
    
    setIsLoadingFriends(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axiosInstance.get(`/api/profile/getUserFriends/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      // Don't show toast error for background loading
      if (activeTab === 'friends') {
        setError('Failed to load friends');
      }
    } finally {
      setIsLoadingFriends(false);
    }
  };

  // Handle friend request actions using the pre-built functions
  const handleAcceptFriendRequest = async () => {
    setActionLoading(true);
    try {
      await handleAcceptRequest(userId);
      Toast.show({
        type: 'success',
        text1: 'Friend Request Accepted',
        text2: 'You are now friends! 🎉',
      });
      
      // Navigate back or update UI
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Accept Request Failed',
        text2: 'Unable to accept friend request. Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineFriendRequest = async () => {
    setActionLoading(true);
    try {
      await handleDeclineRequest(userId);
      Toast.show({
        type: 'info',
        text1: 'Friend Request Declined',
        text2: 'Request has been declined.',
      });
      
      // Navigate back or update UI
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Decline Request Failed',
        text2: 'Unable to decline friend request. Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    setActionLoading(true);
    try {
      await sendFriendRequest(userId);
      Toast.show({
        type: 'success',
        text1: 'Friend Request Sent',
        text2: `Request sent to ${profileData?.username} successfully!`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Send Request Failed',
        text2: error.message || 'Unable to send friend request. Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Render action buttons based on context
  const renderActionButtons = () => {
    if (context === 'friendRequest') {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAcceptFriendRequest}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={handleDeclineFriendRequest}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="close" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Decline</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    } else if (context === 'findFriends') {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.addFriendButton]}
            onPress={handleSendFriendRequest}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Add Friend</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  // Fetch all data when component mounts
  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchCapsules();
      fetchFriends();
    }
  }, [userId]);

  // Render capsule item
  const renderCapsuleItem = ({ item }) => (
    <View style={styles.capsuleItem}>
      <View style={styles.capsuleHeader}>
        <Text style={styles.capsuleTitle}>{item.Title || 'Untitled Capsule'}</Text>
        <Text style={styles.capsuleDate}>
          {new Date(item.UnlockDate).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </View>
      <Text style={styles.capsuleDescription} numberOfLines={2}>
        {item.Description || 'No description available'}
      </Text>
      <View style={styles.capsuleFooter}>
        <View style={[styles.statusBadge, { backgroundColor: item.Status === 'Open' ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.statusText}>{item.Status}</Text>
        </View>
        <Text style={styles.capsuleType}>Public</Text>
      </View>
    </View>
  );

  // Render friend item
  const renderFriendItem = ({ item }) => (
    <View style={styles.friendItem}>
      <Image
        source={{
          uri: item.profilePicture 
            ? `${Config.API_BASE_URL}/uploads/${item.profilePicture}` 
            : 'https://via.placeholder.com/50'
        }}
        style={styles.friendImage}
      />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.username || 'Unknown User'}</Text>
        <Text style={styles.friendStatus}>Friend</Text>
      </View>
      <TouchableOpacity 
        style={styles.viewProfileButton}
        onPress={() => navigation.push('UserProfileScreen', { userId: item.userId })}
      >
        <Ionicons name="person-outline" size={20} color="#6BAED6" />
      </TouchableOpacity>
    </View>
  );

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'capsules':
        if (isLoadingCapsules) {
          return (
            <View style={styles.loadingTab}>
              <ActivityIndicator size="large" color="#6BAED6" />
              <Text style={styles.loadingTabText}>Loading capsules...</Text>
            </View>
          );
        }
        return (
          <FlatList
            data={capsules}
            renderItem={renderCapsuleItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tabContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="archive-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>No public capsules</Text>
                <Text style={styles.emptySubtext}>This user hasn't shared any public memories yet</Text>
              </View>
            }
          />
        );

      case 'friends':
        if (isLoadingFriends) {
          return (
            <View style={styles.loadingTab}>
              <ActivityIndicator size="large" color="#6BAED6" />
              <Text style={styles.loadingTabText}>Loading friends...</Text>
            </View>
          );
        }
        return (
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tabContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>No friends yet</Text>
                <Text style={styles.emptySubtext}>This user hasn't added any friends yet</Text>
              </View>
            }
          />
        );

      case 'about':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.aboutCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="person" size={20} color="#6BAED6" />
                <Text style={styles.cardTitle}>About {profileData?.username}</Text>
              </View>

              {profileData?.bio && (
                <View style={styles.detailRow}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="chatbubble-outline" size={18} color="#6BAED6" style={styles.itemIcon} />
                    <Text style={styles.detailLabel}>Bio</Text>
                  </View>
                  <Text style={styles.detailValue}>{profileData.bio}</Text>
                </View>
              )}

              <View style={[styles.detailRow, styles.borderBottom]}>
                <View style={styles.labelContainer}>
                  <Ionicons name="calendar-outline" size={18} color="#6BAED6" style={styles.itemIcon} />
                  <Text style={styles.detailLabel}>Member Since</Text>
                </View>
                <Text style={styles.detailValue}>
                  {new Date(profileData?.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.labelContainer}>
                  <Ionicons
                    name={profileData?.gender === 'male' ? 'male-outline' : 'female-outline'}
                    size={18}
                    color="#6BAED6"
                    style={styles.itemIcon}
                  />
                  <Text style={styles.detailLabel}>Gender</Text>
                </View>
                <Text style={styles.detailValue}>
                  {profileData?.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : 'Not specified'}
                </Text>
              </View>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FCFF" />
        <ActivityIndicator size="large" color="#6BAED6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !profileData) {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FCFF" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF4444" />
          <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#6BAED6" />
      
      {/* Header with Profile Info */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: profileData?.profilePicture 
                  ? `${Config.API_BASE_URL}/uploads/${profileData.profilePicture}`
                  : 'https://via.placeholder.com/100'
              }}
              style={styles.profileImage}
            />
          </View>

          <Text style={styles.username}>{profileData?.username}</Text>
          <Text style={styles.bio}>{profileData?.bio || 'No bio added yet'}</Text>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{capsules.length}</Text>
              <Text style={styles.statLabel}>Public Capsules</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{friends.length}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {renderActionButtons()}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'capsules' && styles.activeTab]}
          onPress={() => setActiveTab('capsules')}
        >
          <Ionicons 
            name="archive-outline" 
            size={20} 
            color={activeTab === 'capsules' ? '#6BAED6' : '#999999'} 
          />
          <Text style={[styles.tabText, activeTab === 'capsules' && styles.activeTabText]}>
            Capsules
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Ionicons 
            name="people-outline" 
            size={20} 
            color={activeTab === 'friends' ? '#6BAED6' : '#999999'} 
          />
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'about' && styles.activeTab]}
          onPress={() => setActiveTab('about')}
        >
          <Ionicons 
            name="information-circle-outline" 
            size={20} 
            color={activeTab === 'about' ? '#6BAED6' : '#999999'} 
          />
          <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
            About
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
      
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FCFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FCFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6BAED6',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6BAED6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#6BAED6',
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    zIndex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  imageContainer: {
    padding: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    letterSpacing: 0.3,
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 16,
    padding: 4,
    shadowColor: 'rgba(107, 174, 214, 0.4)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#F0F8FF',
  },
  tabText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '500',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#6BAED6',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    marginTop: 16,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingTabText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6BAED6',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999999',
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 4,
    textAlign: 'center',
  },
  capsuleItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(107, 174, 214, 0.4)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  capsuleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  capsuleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    marginRight: 12,
  },
  capsuleDate: {
    fontSize: 12,
    color: '#6BAED6',
    fontWeight: '500',
  },
  capsuleDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  capsuleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capsuleType: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(107, 174, 214, 0.4)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F4FC',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  friendStatus: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
    fontWeight: '500',
  },
  viewProfileButton: {
    padding: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 20,
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: 'rgba(107, 174, 214, 0.4)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8F4FC',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
    maxWidth: width * 0.5,
    textAlign: 'right',
    flex: 1,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#FF5252',
  },
  addFriendButton: {
    backgroundColor: '#3f799bff',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default UserProfileScreen;