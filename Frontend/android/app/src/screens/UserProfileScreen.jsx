import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance';
import Toast from 'react-native-toast-message';
import useBackButtonHandler from '../hooks/useBackButtonHandler';
import { useNavigationContext } from '../context/NavigationContext';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const THEME = {
  primary: '#6BAED6',
  primaryDark: '#4A90C2',
  primaryLight: '#9BC4E2',
  secondary: '#5DADE2',
  accent: '#85C1E9',
  error: '#FF4444',
  success: '#52C41A',
  warning: '#FAAD14',
  background: '#F8FCFF',
  text: '#333333',
  textLight: '#666666',
  border: '#E2E8F0',
};

const UserProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { addToHistory } = useNavigationContext();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Get the user ID from route params
  const { userId, username, profilePicture } = route.params || {};
  
  // Use custom back button handler
  useBackButtonHandler();
  
  // Track navigation history
  useFocusEffect(
    React.useCallback(() => {
      addToHistory('UserProfile');
    }, [addToHistory])
  );

  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const response = await axiosInstance.get('/api/profile/getProfile', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setCurrentUserId(response.data.userId);
        }
      } catch (error) {
        console.error('Error getting current user ID:', error);
      }
    };

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

    getCurrentUserId();
    fetchUserProfile();
  }, [userId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getGenderIcon = (gender) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return 'male';
      case 'female':
        return 'female';
      default:
        return 'person';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={THEME.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: THEME.primary }]}
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
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Image and Basic Info */}
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            <Image
              source={
                profileData?.profilePicture
                  ? { uri: `${Config.API_BASE_URL}/uploads/${profileData.profilePicture}` }
                  : require('../assets/images/avatar.png')
              }
              style={styles.profileImage}
              onError={() => console.log('Failed to load profile picture')}
            />
          </View>
          
          <Text style={styles.username}>{profileData?.username || 'Unknown User'}</Text>
          
          {profileData?.bio && (
            <Text style={styles.bio}>{profileData.bio}</Text>
          )}
        </View>

        {/* Personal Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="person" size={20} color={THEME.primary} />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="badge" size={16} color={THEME.textLight} />
            <Text style={styles.infoLabel}>CNIC:</Text>
            <Text style={styles.infoValue}>{profileData?.cnic || 'Not specified'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={16} color={THEME.textLight} />
            <Text style={styles.infoLabel}>Contact:</Text>
            <Text style={styles.infoValue}>{profileData?.contactNo || 'Not specified'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="cake" size={16} color={THEME.textLight} />
            <Text style={styles.infoLabel}>Date of Birth:</Text>
            <Text style={styles.infoValue}>{formatDate(profileData?.dob)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name={getGenderIcon(profileData?.gender)} size={16} color={THEME.textLight} />
            <Text style={styles.infoLabel}>Gender:</Text>
            <Text style={styles.infoValue}>
              {profileData?.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={16} color={THEME.textLight} />
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{profileData?.address || 'Not specified'}</Text>
          </View>
        </View>

        {/* Additional Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="info" size={20} color={THEME.primary} />
            <Text style={styles.cardTitle}>Additional Information</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="schedule" size={16} color={THEME.textLight} />
            <Text style={styles.infoLabel}>Member Since:</Text>
            <Text style={styles.infoValue}>
              {profileData?.createdAt ? formatDate(profileData.createdAt) : 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Show if this is the current user's profile */}
        {currentUserId === userId && (
          <View style={styles.currentUserCard}>
            <MaterialIcons name="check-circle" size={20} color={THEME.success} />
            <Text style={styles.currentUserText}>This is your profile</Text>
          </View>
        )}
      </ScrollView>
      
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    backgroundColor: THEME.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginRight: 40, // Compensate for back button width
  },
  headerSpacer: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: THEME.primary,
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
    color: THEME.textLight,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  imageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: THEME.primary,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: THEME.textLight,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width - 64,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.text,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  infoLabel: {
    fontSize: 14,
    color: THEME.textLight,
    fontWeight: '500',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: THEME.text,
  },
  currentUserCard: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentUserText: {
    fontSize: 16,
    color: THEME.success,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default UserProfileScreen; 