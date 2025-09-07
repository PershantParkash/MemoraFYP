import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance';
import Toast from 'react-native-toast-message';
import useBackButtonHandler from '../hooks/useBackButtonHandler';
import { useNavigationContext } from '../context/NavigationContext';
import { useFocusEffect } from '@react-navigation/native';
import useFriendService from '../hooks/useFriendService';
import moment from 'moment';

// Try to import optional dependencies
let Video = null;
let LinearGradient = null;

try {
  Video = require('react-native-video').default;
} catch (e) {
  console.log('react-native-video not installed');
}

try {
  LinearGradient = require('react-native-linear-gradient').default;
} catch (e) {
  console.log('react-native-linear-gradient not installed');
}

const { width } = Dimensions.get('window');

const THEME = {
  primary: '#6BAED6',
  primaryDark: '#4A90C2',
  primaryLight: '#9BC4E2',
  secondary: '#5DADE2',
  accent: '#85C1E9',
  error: '#FF4444',
  success: '#52C41A',
  warning: '#FAAD14',
  like: '#FF3040',
  comment: '#4A90E2',
};

// Fallback component for LinearGradient
const FallbackGradient = ({ children, style, colors }) => (
  <View style={[style, { backgroundColor: colors?.[0] || '#000' }]}>
    {children}
  </View>
);

const GradientComponent = LinearGradient || FallbackGradient;

const UserProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { addToHistory } = useNavigationContext();
  
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
  
  // Media and Modal states
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingLike, setLoadingLike] = useState({});
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  
  // Emotional Connection Modal
  const [isEmotionalConnectionModalVisible, setIsEmotionalConnectionModalVisible] = useState(false);

  // Media playback states
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const waveAnimation = useRef(new Animated.Value(1)).current;
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  
  const { userId, context } = route.params || {};
  
  useBackButtonHandler();
  
  useFocusEffect(
    React.useCallback(() => {
      addToHistory('UserProfile');
    }, [addToHistory])
  );

  // Media helper functions
  const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
  };

  const getMediaType = (filename) => {
    const extension = getFileExtension(filename);
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'image';
      case 'mov':
      case 'mp4':
      case 'avi':
        return 'video';
      case 'wav':
      case 'mp3':
      case 'm4a':
      case 'aac':
        return 'audio';
      default:
        return 'unknown';
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVideoPlayback = () => {
    setIsVideoPlaying(!isVideoPlaying);
  };

  const toggleAudioPlayback = () => {
    if (!Video) {
      console.log('Video library not available for audio playback');
      return;
    }
    setIsAudioPlaying(!isAudioPlaying);
  };

  // Animation effect for audio waveform
  useEffect(() => {
    if (isAudioPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnimation, {
            toValue: 1.5,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      waveAnimation.setValue(1);
    }
  }, [isAudioPlaying]);

  // Media rendering function
  const renderMediaContent = (mediaFile) => {
    const mediaType = getMediaType(mediaFile);
    const mediaUrl = `${Config.API_BASE_URL}/uploads/${mediaFile}`;

    switch (mediaType) {
      case 'image':
        return (
          <Image
            source={{ uri: mediaUrl }}
            style={styles.mediaImage}
            resizeMode="contain"
          />
        );
        
      case 'video':
        return (
          <View style={styles.videoContainer}>
            {Video ? (
              <>
                <Video
                  ref={videoRef}
                  source={{ uri: mediaUrl }}
                  style={styles.mediaVideo}
                  paused={!isVideoPlaying}
                  resizeMode="contain"
                  onLoad={(data) => {
                    setVideoDuration(data.duration);
                  }}
                  onProgress={(data) => {
                    setVideoProgress(data.currentTime);
                  }}
                  onEnd={() => {
                    setIsVideoPlaying(false);
                    setVideoProgress(0);
                  }}
                  onError={(error) => {
                    console.log('Video playback error:', error);
                  }}
                />
                
                <TouchableOpacity style={styles.videoOverlay} onPress={toggleVideoPlayback}>
                  <View style={styles.videoControls}>
                    <MaterialIcons 
                      name={isVideoPlaying ? "pause" : "play-arrow"} 
                      size={80} 
                      color="rgba(255,255,255,0.9)" 
                    />
                  </View>
                </TouchableOpacity>
                
                {videoDuration > 0 && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${(videoProgress / videoDuration) * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.timeText}>
                      {formatTime(Math.floor(videoProgress))} / {formatTime(Math.floor(videoDuration))}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.mediaFallback}>
                <MaterialIcons name="play-circle-filled" size={120} color={THEME.primary} />
                <Text style={styles.mediaText}>Video File</Text>
                <Text style={styles.fallbackText}>Install react-native-video for preview</Text>
              </View>
            )}
          </View>
        );
        
      case 'audio':
        return (
          <GradientComponent colors={[THEME.primary, THEME.primaryDark]} style={styles.audioContainer}>
            {Video && (
              <Video
                ref={audioRef}
                source={{ uri: mediaUrl }}
                style={{ width: 0, height: 0 }}
                paused={!isAudioPlaying}
                onLoad={(data) => {
                  setAudioDuration(data.duration);
                }}
                onProgress={(data) => {
                  setAudioProgress(data.currentTime);
                }}
                onEnd={() => {
                  setIsAudioPlaying(false);
                  setAudioProgress(0);
                }}
                onError={(error) => {
                  console.log('Audio playback error:', error);
                  setIsAudioPlaying(false);
                }}
              />
            )}
            
            <View style={styles.audioVisualization}>
              <MaterialIcons name="audiotrack" size={120} color="white" />
              
              <View style={styles.waveformContainer}>
                {[...Array(20)].map((_, i) => (
                  <Animated.View 
                    key={i}
                    style={[
                      styles.waveformBar,
                      { 
                        height: Math.random() * 40 + 20,
                        opacity: isAudioPlaying ? 1 : 0.5,
                        transform: [{ 
                          scaleY: isAudioPlaying ? 
                            Animated.multiply(waveAnimation, 1 + Math.random() * 0.5) : 1 
                        }]
                      }
                    ]} 
                  />
                ))}
              </View>
              
              <Text style={styles.audioFileName}>{mediaFile}</Text>
              
              {Video ? (
                <>
                  <TouchableOpacity style={styles.audioPlayButton} onPress={toggleAudioPlayback}>
                    <MaterialIcons 
                      name={isAudioPlaying ? "pause" : "play-arrow"} 
                      size={50} 
                      color="white" 
                    />
                  </TouchableOpacity>
                  
                  {audioDuration > 0 && (
                    <View style={styles.audioProgressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${(audioProgress / audioDuration) * 100}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.timeText}>
                        {formatTime(Math.floor(audioProgress))} / {formatTime(Math.floor(audioDuration))}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.fallbackText}>
                  Audio File Recorded{'\n'}
                  Install react-native-video for preview
                </Text>
              )}
            </View>
          </GradientComponent>
        );
        
      default:
        return (
          <View style={styles.unsupportedContainer}>
            <FontAwesome name="file-o" size={80} color="white" />
            <Text style={styles.unsupportedText}>
              Unsupported media type: {getFileExtension(mediaFile)}
            </Text>
            <Text style={styles.unsupportedSubText}>{mediaFile}</Text>
          </View>
        );
    }
  };

  const closeMedia = () => {
    setIsVideoPlaying(false);
    setIsAudioPlaying(false);
    setVideoProgress(0);
    setVideoDuration(0);
    setAudioProgress(0);
    setAudioDuration(0);
    setSelectedMedia(null);
  };

  const handleEmotionalConnectionPress = (capsule) => {
    setSelectedCapsule(capsule);
    setIsEmotionalConnectionModalVisible(true);
  };

  const handleCloseEmotionalConnectionModal = () => {
    setIsEmotionalConnectionModalVisible(false);
    setSelectedCapsule(null);
  };

  // Toggle like function
  const toggleLike = async (capsuleId) => {
    console.log('[UserProfileScreen] toggleLike called for capsule:', capsuleId);
    
    try {
      setLoadingLike(prev => ({ ...prev, [capsuleId]: true }));
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      console.log('[UserProfileScreen] Making API call to toggle like');
      const response = await axiosInstance.post(
        `/api/likes/toggle/${capsuleId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('[UserProfileScreen] Like toggle response:', response.data);

      setCapsules(prevCapsules => {
        const updatedCapsules = prevCapsules.map(capsule => 
          capsule._id === capsuleId
            ? {
                ...capsule,
                IsLikedByUser: response.data.isLiked,
                LikesCount: response.data.isLiked 
                  ? (capsule.LikesCount || 0) + 1
                  : Math.max((capsule.LikesCount || 0) - 1, 0)
              }
            : capsule
        );
        console.log('[UserProfileScreen] Updated capsules state');
        return updatedCapsules;
      });

    } catch (error) {
      console.error('[UserProfileScreen] Error toggling like:', {
        capsuleId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to update like. Please try again.'
      );
    } finally {
      setLoadingLike(prev => ({ ...prev, [capsuleId]: false }));
    }
  };

  // Get comments function
  const getComments = async (capsuleId, page = 1) => {
    console.log('[UserProfileScreen] getComments called:', { capsuleId, page });
    
    try {
      setLoadingComments(true);
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      const response = await axiosInstance.get(
        `/api/comments/${capsuleId}?page=${page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('[UserProfileScreen] Comments response:', {
        capsuleId,
        page,
        commentsCount: response.data.comments?.length,
        hasNextPage: response.data.pagination?.hasNextPage
      });

      const { comments, pagination } = response.data;
      
      if (page === 1) {
        setComments(comments);
      } else {
        setComments(prev => [...prev, ...comments]);
      }
      
      setHasMoreComments(pagination.hasNextPage);
      setCommentPage(page);

    } catch (error) {
      console.error('[UserProfileScreen] Error fetching comments:', {
        capsuleId,
        page,
        error: error.message,
        status: error.response?.status
      });
      
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to load comments. Please try again.'
      );
    } finally {
      setLoadingComments(false);
    }
  };

  // Add comment function
  const addComment = async () => {
    if (!newComment.trim()) {
      console.log('[UserProfileScreen] Empty comment, not submitting');
      return;
    }

    console.log('[UserProfileScreen] Adding comment:', {
      capsuleId: selectedCapsule?._id,
      content: newComment.trim()
    });

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      const response = await axiosInstance.post(
        `/api/comments/${selectedCapsule._id}`,
        { content: newComment.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('[UserProfileScreen] Comment added successfully:', response.data);

      // Add the new comment to the beginning of the list
      setComments(prev => [response.data.comment, ...prev]);
      setNewComment('');

      // Update the comments count in the capsule
      setCapsules(prevCapsules => 
        prevCapsules.map(capsule => 
          capsule._id === selectedCapsule._id
            ? { ...capsule, CommentsCount: (capsule.CommentsCount || 0) + 1 }
            : capsule
        )
      );

      // Update selected capsule
      setSelectedCapsule(prev => ({
        ...prev,
        CommentsCount: (prev.CommentsCount || 0) + 1
      }));

    } catch (error) {
      console.error('[UserProfileScreen] Error adding comment:', {
        capsuleId: selectedCapsule?._id,
        error: error.message,
        status: error.response?.status
      });
      
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to add comment. Please try again.'
      );
    }
  };

  // Open comments modal
  const openCommentsModal = (capsule) => {
    console.log('[UserProfileScreen] Opening comments modal for capsule:', capsule._id);
    setSelectedCapsule(capsule);
    setIsCommentsModalVisible(true);
    getComments(capsule._id, 1);
  };

  // Close comments modal
  const closeCommentsModal = () => {
    console.log('[UserProfileScreen] Closing comments modal');
    setIsCommentsModalVisible(false);
    setSelectedCapsule(null);
    setComments([]);
    setNewComment('');
    setCommentPage(1);
    setHasMoreComments(false);
  };

  // Load more comments
  const loadMoreComments = () => {
    if (hasMoreComments && !loadingComments && selectedCapsule) {
      console.log('[UserProfileScreen] Loading more comments, page:', commentPage + 1);
      getComments(selectedCapsule._id, commentPage + 1);
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
      if (activeTab === 'capsules') {
        setError('Failed to load capsules');
      }
    } finally {
      setIsLoadingCapsules(false);
    }
  };

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
      if (activeTab === 'friends') {
        setError('Failed to load friends');
      }
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    setActionLoading(true);
    try {
      await handleAcceptRequest(userId);
      Toast.show({
        type: 'success',
        text1: 'Friend Request Accepted',
        text2: 'You are now friends! 🎉',
      });

       setTimeout(() => {
          navigation.navigate('Tab');
        }, 500);
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
      setTimeout(() => {
          navigation.navigate('Tab');
        }, 500);
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
       setTimeout(() => {
          navigation.navigate('Tab');
        }, 500);
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

  // Cleanup on unmount
  useEffect(() => {
    console.log('UserProfileScreen mounted');
    return () => {
      console.log('UserProfileScreen unmounting - cleaning up state');
      setIsCommentsModalVisible(false);
      setSelectedCapsule(null);
      setComments([]);
      setLoadingLike({});
      setIsVideoPlaying(false);
      setIsAudioPlaying(false);
      setSelectedMedia(null);
    };
  }, []);

  // Enhanced capsule rendering with media support and nested capsules
  const renderCapsuleItem = ({ item }) => (
    <View style={styles.capsuleContainer}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{item.Title || 'Untitled Capsule'}</Text>
        <View style={styles.statusContainer}>
          <FontAwesome
            name={item.IsPublic ? "globe" : "user"}
            size={18}
            color={item.IsPublic ? THEME.primary : '#666'}
            style={styles.publicIcon}
          />
          <FontAwesome
            name={item.Status === 'Locked' ? 'lock' : 'unlock'}
            size={20}
            color={item.Status === 'Locked' ? THEME.error : THEME.success}
          />
        </View>
      </View>

      {/* Emotional Connection Button */}
      {item.Description && item.Description.trim() !== '' && (
        <TouchableOpacity
          style={[styles.emotionalConnectionButton, { backgroundColor: THEME.primary }]}
          onPress={() => handleEmotionalConnectionPress(item)}
        >
          <MaterialIcons name="chat" size={16} color="white" />
          <Text style={styles.emotionalConnectionText}>💬 Emotional Message</Text>
        </TouchableOpacity>
      )}

      {/* Creation Date */}
      <View style={styles.dateContainer}>
        <MaterialIcons name="schedule" size={16} color="#666" />
        <Text style={styles.dateText}>
          Created: {moment(item.CreatedAt).format('MMM DD, YYYY')}
        </Text>
      </View>

      {/* Recipient Information */}
      {item.RecipientName && (
        <View style={styles.dateContainer}>
          <MaterialIcons name="person" size={16} color="#666" />
          <Text style={styles.dateText}>
            Recipient: {item.RecipientName}
          </Text>
        </View>
      )}

      {/* Media Type Indicator */}
      {item.Media && (
        <View style={styles.mediaTypeContainer}>
          <MaterialIcons
            name={
              getMediaType(item.Media) === 'image'
                ? 'photo'
                : getMediaType(item.Media) === 'video'
                ? 'videocam'
                : getMediaType(item.Media) === 'audio'
                ? 'audiotrack'
                : 'insert-drive-file'
            }
            size={16}
            color="#666"
          />
          <Text style={styles.mediaTypeText}>
            {getMediaType(item.Media).charAt(0).toUpperCase() + 
             getMediaType(item.Media).slice(1)} File
          </Text>
        </View>
      )}

      {/* Nested Capsules Section */}
      {item.NestedCapsules && item.NestedCapsules.length > 0 && (
        <View style={styles.nestedCapsulesContainer}>
          <Text style={styles.nestedCapsulesTitle}>Nested Capsules ({item.NestedCapsules.length})</Text>
          {item.NestedCapsules.map((nestedCapsule, index) => (
            <View key={nestedCapsule._id || index} style={styles.nestedCapsuleItem}>
              <View style={styles.nestedCapsuleHeader}>
                <Text style={styles.nestedCapsuleTitle}>{nestedCapsule.Title}</Text>
                <FontAwesome
                  name={nestedCapsule.Status === 'Locked' ? 'lock' : 'unlock'}
                  size={16}
                  color={nestedCapsule.Status === 'Locked' ? THEME.error : THEME.success}
                />
              </View>
              {nestedCapsule.Description && (
                <Text style={styles.nestedCapsuleDescription}>
                  {nestedCapsule.Description}
                </Text>
              )}
              {nestedCapsule.Status === 'Open' ? (
                <TouchableOpacity
                  style={[styles.nestedCapsuleButton, { backgroundColor: THEME.primary }]}
                  onPress={() => setSelectedMedia(nestedCapsule.Media)}
                >
                  <Text style={styles.nestedCapsuleButtonText}>View Nested Capsule</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.nestedCapsuleLockedText}>
                  Locked (unlocks with parent)
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Likes and Comments Section */}
      <View style={styles.interactionSection}>
        <View style={styles.interactionStats}>
          <View style={styles.statItem}>
            <FontAwesome name="heart" size={16} color={THEME.like} />
            <Text style={styles.statText}>{item.LikesCount || 0} likes</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="comment" size={16} color={THEME.comment} />
            <Text style={styles.statText}>{item.CommentsCount || 0} comments</Text>
          </View>
        </View>

        <View style={styles.interactionButtons}>
          <TouchableOpacity
            style={[
              styles.interactionButton,
              item.IsLikedByUser && styles.likedButton
            ]}
            onPress={() => toggleLike(item._id)}
            disabled={loadingLike[item._id]}
          >
            {loadingLike[item._id] ? (
              <ActivityIndicator size="small" color={THEME.like} />
            ) : (
              <FontAwesome 
                name={item.IsLikedByUser ? "heart" : "heart-o"} 
                size={18} 
                color={item.IsLikedByUser ? THEME.like : "#666"} 
              />
            )}
            <Text style={[
              styles.interactionButtonText,
              item.IsLikedByUser && styles.likedButtonText
            ]}>
              {item.IsLikedByUser ? 'Liked' : 'Like'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => openCommentsModal(item)}
          >
            <MaterialIcons name="comment" size={18} color="#666" />
            <Text style={styles.interactionButtonText}>Comment</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Button */}
      {item.Status === 'Open' ? (
        <TouchableOpacity
          style={[styles.viewButton, { backgroundColor: THEME.primary }]}
          onPress={() => setSelectedMedia(item.Media)}
        >
          <MaterialIcons name="visibility" size={20} color="white" />
          <Text style={styles.buttonText}>View Capsule Media</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.lockedButton, { backgroundColor: THEME.error }]}>
          <MaterialIcons name="lock" size={20} color="white" />
          <Text style={styles.buttonText}>
            Unlocks: {moment(item.UnlockDate).format('MMM DD, YYYY')}
          </Text>
        </TouchableOpacity>
      )}
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

  // Render comment item
  const renderComment = ({ item }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        {item.UserProfile?.profilePicture ? (
          <Image 
            source={{ uri: `${Config.API_BASE_URL}/uploads/${item.UserProfile.profilePicture}` }}
            style={styles.commentUserPic}
          />
        ) : (
          <View style={styles.defaultCommentUserPic}>
            <MaterialIcons name="person" size={20} color="#666" />
          </View>
        )}
        <View style={styles.commentUserInfo}>
          <Text style={styles.commentUsername}>
            {item.UserProfile?.username || 'Anonymous'}
          </Text>
          <Text style={styles.commentDate}>
            {moment(item.CreatedAt).fromNow()}
          </Text>
        </View>
      </View>
      <Text style={styles.commentContent}>{item.Content}</Text>
    </View>
  );

  // Render comments modal
  const renderCommentsModal = () => (
    <Modal
      visible={isCommentsModalVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={closeCommentsModal}
    >
      <KeyboardAvoidingView 
        style={styles.commentsModalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.commentsHeader}>
          <TouchableOpacity onPress={closeCommentsModal}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.commentsTitle}>
            Comments ({selectedCapsule?.CommentsCount || 0})
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Comments List */}
        <FlatList
          data={comments}
          keyExtractor={(item) => item._id}
          renderItem={renderComment}
          contentContainerStyle={styles.commentsListContainer}
          refreshing={loadingComments && commentPage === 1}
          onRefresh={() => selectedCapsule && getComments(selectedCapsule._id, 1)}
          onEndReached={loadMoreComments}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() => 
            loadingComments && commentPage > 1 ? (
              <ActivityIndicator size="small" color={THEME.primary} style={{ padding: 20 }} />
            ) : null
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyCommentsContainer}>
              <MaterialIcons name="comment" size={50} color="#ccc" />
              <Text style={styles.emptyCommentsText}>No comments yet</Text>
              <Text style={styles.emptyCommentsSubText}>Be the first to share your thoughts!</Text>
            </View>
          )}
        />

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            value={newComment}
            onChangeText={setNewComment}
            maxLength={1000}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { opacity: newComment.trim() ? 1 : 0.5 }
            ]}
            onPress={addComment}
            disabled={!newComment.trim()}
          >
            <MaterialIcons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Render emotional connection modal
  const renderEmotionalConnectionModal = () => (
    <Modal
      visible={isEmotionalConnectionModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseEmotionalConnectionModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Emotional Message</Text>
          <ScrollView style={styles.modalScrollView}>
            <Text style={styles.modalDescription}>
              {selectedCapsule?.Description || 'No emotional message available.'}
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: THEME.primary }]}
            onPress={handleCloseEmotionalConnectionModal}
          >
            <Text style={styles.modalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
      
      {selectedMedia ? (
        <View style={styles.mediaContainer}>
          {renderMediaContent(selectedMedia)}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: THEME.error }]}
            onPress={closeMedia}
          >
            <MaterialIcons name="close" size={24} color="white" />
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
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
              <Text style={styles.bio}>{profileData?.bio || `No bio added yet`}</Text>

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
        </>
      )}

      {/* Modals */}
      {renderEmotionalConnectionModal()}
      {renderCommentsModal()}
      
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

  // Enhanced Capsule Styles
  capsuleContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: THEME.primary,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  publicIcon: {
    marginRight: 8,
  },
  emotionalConnectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 10,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  emotionalConnectionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  mediaTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  mediaTypeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },

  // Nested Capsules Styles
  nestedCapsulesContainer: {
    marginTop: 15,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  nestedCapsulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
  },
  nestedCapsuleItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderLeftWidth: 3,
    borderLeftColor: THEME.primary,
  },
  nestedCapsuleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  nestedCapsuleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  nestedCapsuleDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  nestedCapsuleLockedText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  nestedCapsuleButton: {
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  nestedCapsuleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Interaction Styles
  interactionSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  interactionStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
    gap: 20,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  interactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  likedButton: {
    backgroundColor: '#ffe6e6',
  },
  interactionButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
    fontWeight: '500',
  },
  likedButtonText: {
    color: THEME.like,
  },

  viewButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
    marginTop: 10,
  },
  lockedButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
    marginTop: 10,
  },

  // Media Container Styles
  mediaContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  mediaVideo: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoControls: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 50,
    padding: 20,
  },
  audioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioVisualization: {
    alignItems: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 30,
    height: 60,
  },
  waveformBar: {
    width: 4,
    backgroundColor: 'white',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  audioFileName: {
    fontSize: 16,
    color: 'white',
    marginVertical: 20,
    textAlign: 'center',
  },
  audioPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  audioProgressContainer: {
    marginTop: 30,
    alignItems: 'center',
    width: '80%',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.primary,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  mediaFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  mediaText: {
    fontSize: 18,
    color: 'white',
    marginTop: 20,
    fontWeight: '600',
  },
  unsupportedText: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 20,
    textAlign: 'center',
  },
  unsupportedSubText: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  closeButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
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

  // Comments Modal Styles
  commentsModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  commentsListContainer: {
    padding: 15,
  },
  commentItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentUserPic: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  defaultCommentUserPic: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentUserInfo: {
    flex: 1,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  commentContent: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    marginRight: 10,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    backgroundColor: THEME.primary,
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCommentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
  },
  emptyCommentsSubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalScrollView: {
    maxHeight: 200,
    width: '100%',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default UserProfileScreen;