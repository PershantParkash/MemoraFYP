import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  FlatList
} from 'react-native';
 
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { MyContext } from '../../context/MyContext';
import useProfileService from '../../hooks/useProfileService';
import useBackButtonHandler from '../../hooks/useBackButtonHandler'
import Config from 'react-native-config';
import { useNavigationContext } from '../../context/NavigationContext';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../api/axiosInstance';
import Toast from 'react-native-toast-message';
import useCapsuleService from '../../hooks/useCapsuleService'

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const { fetchProfileData } = useProfileService();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('capsules');
  const [capsules, setCapsules] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isLoadingCapsules, setIsLoadingCapsules] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [error, setError] = useState(null);
    const { getUserCapsules } = useCapsuleService();
  const context = useContext(MyContext);
  const { userDetails, setUserDetails } = context;
  const { addToHistory } = useNavigationContext();

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

  
  // Use custom back button handler
  useBackButtonHandler();
  
  // Track navigation history
  useFocusEffect(
    React.useCallback(() => {
      addToHistory('profile');
    }, [addToHistory])
  );

  const goToEditProfile = () => {
    navigation.navigate('EditProfileScreen');
  };

  // Fetch user profile data
  useEffect(() => {
    const getProfileData = async () => {
      const response = await fetchProfileData();
      setUserDetails(response);
      setLoading(false);
    };

    getProfileData();
  }, []);

  // Fetch user capsules
  const fetchCapsules = async () => {
    setIsLoadingCapsules(true);
    setError(null);

    try {
      const data = await getUserCapsules();

      setCapsules(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoadingCapsules(false);
    }
  };

  // Fetch user friends
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

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'capsules' && capsules.length === 0) {
      fetchCapsules();
    } else if (activeTab === 'friends' && friends.length === 0) {
      fetchFriends();
    }
  }, [activeTab]);

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
        {item.Description || 'No emotional message attached'}
      </Text>
      {/* <View style={styles.capsuleFooter}>
        <Text style={styles.capsuleRecipient}>To: {item.RecipientName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'sent' ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View> */}
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
        <Text style={styles.friendStatus}>Connected</Text>
      </View>
      <TouchableOpacity style={styles.messageButton}>
        <Ionicons name="chatbubble-outline" size={20} color="#6BAED6" />
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
                <Text style={styles.emptyText}>No capsules yet</Text>
                <Text style={styles.emptySubtext}>Create your first memory capsule!</Text>
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
                <Text style={styles.emptySubtext}>Add friends to share memories!</Text>
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
                <Text style={styles.cardTitle}>Personal Information</Text>
              </View>

              <View style={[styles.detailRow, styles.borderBottom]}>
                <View style={styles.labelContainer}>
                  <Ionicons name="call-outline" size={18} color="#6BAED6" style={styles.itemIcon} />
                  <Text style={styles.detailLabel}>Contact</Text>
                </View>
                <Text style={styles.detailValue}>{userDetails.contactNo}</Text>
              </View>

              <View style={[styles.detailRow, styles.borderBottom]}>
                <View style={styles.labelContainer}>
                  <Ionicons name="card-outline" size={18} color="#6BAED6" style={styles.itemIcon} />
                  <Text style={styles.detailLabel}>CNIC</Text>
                </View>
                <Text style={styles.detailValue}>{userDetails.cnic}</Text>
              </View>

              <View style={[styles.detailRow, styles.borderBottom]}>
                <View style={styles.labelContainer}>
                  <Ionicons name="calendar-outline" size={18} color="#6BAED6" style={styles.itemIcon} />
                  <Text style={styles.detailLabel}>Birthday</Text>
                </View>
                <Text style={styles.detailValue}>
                  {new Date(userDetails.dob).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={[styles.detailRow, styles.borderBottom]}>
                <View style={styles.labelContainer}>
                  <Ionicons
                    name={userDetails.gender === 'male' ? 'male-outline' : 'female-outline'}
                    size={18}
                    color="#6BAED6"
                    style={styles.itemIcon}
                  />
                  <Text style={styles.detailLabel}>Gender</Text>
                </View>
                <Text style={styles.detailValue}>
                  {userDetails.gender.charAt(0).toUpperCase() + userDetails.gender.slice(1)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.labelContainer}>
                  <Ionicons name="location-outline" size={18} color="#6BAED6" style={styles.itemIcon} />
                  <Text style={styles.detailLabel}>Address</Text>
                </View>
                <Text style={styles.detailValue}>{userDetails.address}</Text>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.editButton} onPress={goToEditProfile} activeOpacity={0.8}>
                <Ionicons name="create-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
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
        <Text style={styles.loadingText}>Loading your memories...</Text>
      </View>
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

        <TouchableOpacity style={styles.settingsButton} onPress={goToEditProfile}>
          <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: `${Config.API_BASE_URL}/uploads/${userDetails.profilePicture}`,
              }}
              style={styles.profileImage}
            />
          </View>

          <Text style={styles.username}>{userDetails.username}</Text>
          <Text style={styles.bio}>{userDetails.bio || 'No bio added yet'}</Text>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{capsules.length}</Text>
              <Text style={styles.statLabel}>Capsules</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{friends.length}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CameraScreen')}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Create Memory</Text>
          </TouchableOpacity>
        </View>
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
            About You
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
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
  settingsButton: {
    position: 'absolute',
    right: 16,
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
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  createButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4A89B8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: '#4A89B8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
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
  capsuleRecipient: {
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
  messageButton: {
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
    alignItems: 'center',
    paddingVertical: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8F4FC',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    maxWidth: width * 0.45,
    textAlign: 'right',
  },
  actionsContainer: {
    paddingHorizontal: 0,
  },
  editButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6BAED6',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#6BAED6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
});

export default ProfileScreen;