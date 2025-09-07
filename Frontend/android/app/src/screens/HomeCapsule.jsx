import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Config from 'react-native-config';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import useCapsuleService from '../hooks/useCapsuleService'
import useBackButtonHandler from '../hooks/useBackButtonHandler';
import { Picker } from '@react-native-picker/picker';
import { useNavigationContext } from '../context/NavigationContext';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance from '../api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

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
  like: '#FF3040',
  comment: '#4A90E2',
};

const FallbackGradient = ({ children, style, colors }) => (
  <View style={[style, { backgroundColor: colors?.[0] || '#000' }]}>
    {children}
  </View>
);

const GradientComponent = LinearGradient || FallbackGradient;

const CapsulePage = () => {
  const [capsules, setCapsules] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToHistory } = useNavigationContext();
  
    const navigation = useNavigation();
  // Comments and Likes states
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingLike, setLoadingLike] = useState({});
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  
  // Use custom back button handler
  useBackButtonHandler();
  
  // Track navigation history
  useFocusEffect(
    React.useCallback(() => {
      addToHistory('HomeCapsule');
    }, [addToHistory])
  );
  
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  const waveAnimation = useRef(new Animated.Value(1)).current;

  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const { getUserCapsules } = useCapsuleService();

  // Modal states
  const [isEmotionalConnectionModalVisible, setIsEmotionalConnectionModalVisible] = useState(false);
  const [isSharedFriendsModalVisible, setIsSharedFriendsModalVisible] = useState(false);
  const [sharedFriends, setSharedFriends] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [capsuleLabels, setCapsuleLabels] = useState({}); // Store labels for capsules

  // Toggle like for a capsule
  const toggleLike = async (capsuleId) => {
    try {
      setLoadingLike(prev => ({ ...prev, [capsuleId]: true }));
      
      const token = await AsyncStorage.getItem('authToken');
      const response = await axiosInstance.post(
        `/api/likes/toggle/${capsuleId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the capsule in the local state
      setCapsules(prevCapsules => 
        prevCapsules.map(capsule => 
          capsule._id === capsuleId
            ? {
                ...capsule,
                IsLikedByUser: response.data.isLiked,
                LikesCount: response.data.isLiked 
                  ? (capsule.LikesCount || 0) + 1
                  : Math.max((capsule.LikesCount || 0) - 1, 0)
              }
            : capsule
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like. Please try again.');
    } finally {
      setLoadingLike(prev => ({ ...prev, [capsuleId]: false }));
    }
  };

  // Get comments for a capsule
  const getComments = async (capsuleId, page = 1) => {
    try {
      setLoadingComments(true);
      
      const token = await AsyncStorage.getItem('authToken');
      const response = await axiosInstance.get(
        `/api/comments/${capsuleId}?page=${page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { comments, pagination } = response.data;
      
      if (page === 1) {
        setComments(comments);
      } else {
        setComments(prev => [...prev, ...comments]);
      }
      
      setHasMoreComments(pagination.hasNextPage);
      setCommentPage(page);
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments. Please try again.');
    } finally {
      setLoadingComments(false);
    }
  };

  // Add a comment
  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axiosInstance.post(
        `/api/comments/${selectedCapsule._id}`,
        { content: newComment.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  };

  // Open comments modal
  const openCommentsModal = (capsule) => {
    setSelectedCapsule(capsule);
    setIsCommentsModalVisible(true);
    getComments(capsule._id, 1);
  };

  // Close comments modal
  const closeCommentsModal = () => {
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
      getComments(selectedCapsule._id, commentPage + 1);
    }
  };

  

  useEffect(() => {
    const fetchCapsules = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getUserCapsules();
        setCapsules(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCapsules();
  }, []);

  // Fetch current user ID on component mount
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        setCurrentUserId(userId);
        console.log('Current user ID:', userId);
      } catch (error) {
        console.error('Error getting current user ID:', error);
      }
    };

    getCurrentUserId();
  }, []);

  // Generate labels for shared capsules when capsules and currentUserId are available
  useEffect(() => {
    const generateCapsuleLabels = async () => {
      if (!capsules.length || !currentUserId) return;

      console.log('Generating labels for capsules. Current user ID:', currentUserId);
      console.log('Capsules:', capsules);

      const token = await AsyncStorage.getItem('authToken');
      const newLabels = {};

      for (const capsule of capsules) {
        if (capsule.IsShared || capsule.CapsuleType === 'Shared') {
          console.log('Processing shared capsule:', capsule.Title);
          console.log('Capsule UserID:', capsule.UserID);
          console.log('Capsule CreatedBy:', capsule.CreatedBy);
          console.log('Capsule IsShared:', capsule.IsShared);
          console.log('Capsule SharedWith:', capsule.SharedWith);
          console.log('Current user ID:', currentUserId);
          
          // For shared capsules, check if user is creator or recipient
          let isCreator = false;
          if (capsule.IsShared) {
            // Check if current user is the creator
            isCreator = capsule.CreatedBy === currentUserId;
          } else {
            // For personal capsules, check if user is the owner
            isCreator = capsule.UserID === currentUserId;
          }
          console.log('Is creator:', isCreator);
          
          if (isCreator) {
            // User is creator - show who it's shared with
            if (capsule.SharedWith && capsule.SharedWith.length > 0) {
              if (capsule.SharedWith.length === 1) {
                newLabels[capsule._id] = `Shared with: ${capsule.SharedWith.length} friend`;
              } else {
                newLabels[capsule._id] = `Shared with: ${capsule.SharedWith.length} friends`;
              }
            } else {
              newLabels[capsule._id] = 'Shared (not sent yet)';
            }
          } else {
            // User is recipient - show who shared it with them
            console.log('Fetching creator profile for CreatedBy:', capsule.CreatedBy);
            try {
              const creatorResponse = await axiosInstance.get(`/api/profiles/getProfileByID/${capsule.CreatedBy}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              
              console.log('Creator profile response:', creatorResponse.data);
              const creatorProfile = creatorResponse.data;
              newLabels[capsule._id] = `Shared by: ${creatorProfile.username || 'Unknown User'}`;
              console.log('Set label for capsule:', capsule.Title, 'to:', newLabels[capsule._id]);
            } catch (creatorError) {
              console.error('Error fetching creator profile for capsule:', capsule._id, creatorError);
              console.error('Error response:', creatorError.response?.data);
              newLabels[capsule._id] = 'Shared by: Friend';
            }
          }
        }
      }

      console.log('Final labels:', newLabels);
      setCapsuleLabels(newLabels);
    };

    generateCapsuleLabels();
  }, [capsules, currentUserId]);

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
                
                {/* Video Controls Overlay */}
                <TouchableOpacity style={styles.videoOverlay} onPress={toggleVideoPlayback}>
                  <View style={styles.videoControls}>
                    <MaterialIcons 
                      name={isVideoPlaying ? "pause" : "play-arrow"} 
                      size={80} 
                      color="rgba(255,255,255,0.9)" 
                    />
                  </View>
                </TouchableOpacity>
                
                {/* Video Progress Bar */}
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
            {/* Hidden Video component for audio playback */}
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
              
              {/* Animated Audio Waveform Visualization */}
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
                  
                  {/* Audio Progress Bar */}
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
    // Stop playback and reset states
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

  const handleSharedTypePress = async (capsule) => {
    console.log('Shared type pressed for capsule:', capsule);
    console.log('Capsule SharedWith:', capsule.SharedWith);
    console.log('Capsule CreatorProfile:', capsule.CreatorProfile);
    
    // For shared capsules, we should show the modal even if SharedWith is empty
    // as it might be a shared capsule that hasn't been shared with anyone yet
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axiosInstance.get('/api/friends/user-friends', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('All friends response:', response.data);
      console.log('All friends:', response.data.friends);
      
      let sharedFriendsData = [];
      
      // If capsule has SharedWith data, filter friends
      if (capsule.SharedWith && capsule.SharedWith.length > 0) {
        // Convert SharedWith to array of strings for comparison
        const sharedWithIds = capsule.SharedWith.map(id => id.toString());
        console.log('SharedWith IDs (converted to strings):', sharedWithIds);
        
        sharedFriendsData = response.data.friends.filter(friend => {
          // The friend object from getUserFriends has _id field
          const friendId = friend._id ? friend._id.toString() : null;
          console.log('Checking friend:', friend.username, 'ID:', friendId);
          const isShared = sharedWithIds.includes(friendId);
          console.log('Is shared:', isShared);
          return isShared;
        });
      } else {
        // If no SharedWith data, this might be a shared capsule created by the current user
        // Show all friends as potential sharing options
        console.log('No SharedWith data found, showing all friends as potential sharing options');
        sharedFriendsData = response.data.friends;
      }
      
      console.log('Final shared friends data:', sharedFriendsData);
      setSharedFriends(sharedFriendsData);
      setSelectedCapsule(capsule);
      setIsSharedFriendsModalVisible(true);

      // Generate and store labels for this capsule
      let isCreator = false;
      if (capsule.IsShared) {
        // Check if current user is the creator
        isCreator = capsule.CreatedBy === currentUserId;
      } else {
        // For personal capsules, check if user is the owner
        isCreator = capsule.UserID === currentUserId;
      }
      let label = '';
      
      if (isCreator) {
        // User is creator - show who it's shared with
        if (sharedFriendsData.length > 0) {
          if (sharedFriendsData.length === 1) {
            label = `Shared with: ${sharedFriendsData[0].username}`;
          } else {
            label = `Shared with: ${sharedFriendsData.length} friends`;
          }
        } else {
          label = 'Shared (not sent yet)';
        }
      } else {
        // User is recipient - show who shared it with them
        // Use the CreatorProfile data that's now included in the capsule
        if (capsule.CreatorProfile && capsule.CreatorProfile.username) {
          label = `Shared by: ${capsule.CreatorProfile.username}`;
        } else {
          label = 'Shared by: Friend';
        }
      }
      
      // Store the label for this capsule
      setCapsuleLabels(prev => ({
        ...prev,
        [capsule._id]: label
      }));
    } catch (error) {
      console.error('Error fetching shared friends:', error);
      console.error('Error response:', error.response?.data);
      // Still show modal even if there's an error
      setSharedFriends([]);
      setSelectedCapsule(capsule);
      setIsSharedFriendsModalVisible(true);
    }
  };

  const handleCloseSharedFriendsModal = () => {
    setIsSharedFriendsModalVisible(false);
    setSelectedCapsule(null);
    setSharedFriends([]);
  };

  // Function to get the appropriate shared capsule label
  const getSharedCapsuleLabel = (capsule) => {
    if (!capsule.IsShared && capsule.CapsuleType !== 'Shared') {
      return 'Personal';
    }

    // If we don't have current user ID yet, show generic "Shared"
    if (!currentUserId) {
      return 'Shared';
    }

    // Check if we have a stored label for this capsule
    if (capsuleLabels[capsule._id]) {
      return capsuleLabels[capsule._id];
    }

    // Check if current user is the creator
    const isCreator = capsule.UserId === currentUserId;
    
    if (isCreator) {
      // User is creator - show who it's shared with
      if (capsule.SharedWith && capsule.SharedWith.length > 0) {
        return `Shared with: ${capsule.SharedWith.length} friend${capsule.SharedWith.length > 1 ? 's' : ''}`;
      } else {
        return 'Shared (not sent yet)';
      }
    } else {
      // User is recipient - show who shared it with them
      if (capsule.CreatorProfile && capsule.CreatorProfile.username) {
        return `Shared by: ${capsule.CreatorProfile.username}`;
      } else {
        return 'Shared by: Friend';
      }
    }
  };

  // Render individual comment
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

  const renderCapsule = ({ item }) => {
    return (
      <View style={styles.capsuleContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{item.Title}</Text>
          <FontAwesome
            name={item.Status === 'Locked' ? 'lock' : 'unlock'}
            size={24}
            color={item.Status === 'Locked' ? THEME.error : THEME.primary}
          />
        </View>

        {item.Description && item.Description.trim() !== '' && (
          <TouchableOpacity
            style={[styles.emotionalConnectionButton, { backgroundColor: THEME.secondary }]}
            onPress={() => handleEmotionalConnectionPress(item)}
          >
            <MaterialIcons name="chat" size={16} color="white" />
            <Text style={styles.emotionalConnectionText}>💬 Emotional Connection</Text>
          </TouchableOpacity>
        )}

        {/* Capsule Type - Clickable for Shared capsules */}
        {(item.IsShared || item.CapsuleType === 'Shared') ? (
          <TouchableOpacity 
            style={[styles.capsuleTypeContainer, styles.clickableCapsuleType]}
            onPress={() => handleSharedTypePress(item)}
          >
            <MaterialIcons name="folder" size={16} color="#666" />
            <Text style={styles.capsuleTypeText}>
              {getSharedCapsuleLabel(item)}
            </Text>
            <MaterialIcons name="chevron-right" size={16} color="#666" />
          </TouchableOpacity>
        ) : (
          <View style={styles.capsuleTypeContainer}>
            <MaterialIcons name="folder" size={16} color="#666" />
            <Text style={styles.capsuleTypeText}>
              {getSharedCapsuleLabel(item)}
            </Text>
          </View>
        )}

        {/* Nested Capsules */}
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
                    color={nestedCapsule.Status === 'Locked' ? THEME.error : THEME.primary}
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

        {/* Creation and Unlock Date */}
        <View style={styles.dateContainer}>
          <MaterialIcons name="schedule" size={16} color="#666" />
          <Text style={styles.dateText}>
            Created: {moment(item.CreatedAt).format('MMM DD, YYYY')}
          </Text>
        </View>

        <View style={styles.dateContainer}>
          <MaterialIcons name="lock-clock" size={16} color="#666" />
          <Text style={styles.dateText}>
            {item.Status === 'Open' 
              ? `Unlocked: ${moment(item.UnlockDate).format('MMM DD, YYYY')}`
              : `Unlocks: ${moment(item.UnlockDate).format('MMM DD, YYYY')}`
            }
          </Text>
        </View>

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

        {/* Action Buttons */}
        {item.Status === 'Open' ? (
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: THEME.primary }]}
            onPress={() => setSelectedMedia(item.Media)}
          >
            <MaterialIcons name="visibility" size={20} color="white" />
            <Text style={styles.buttonText}>View Capsule Media</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.lockedButton, { backgroundColor: THEME.error }]}>
            <MaterialIcons name="lock" size={20} color="white" />
            <Text style={styles.buttonText}>
              Unlocks: {moment(item.UnlockDate).format('MMM DD, YYYY')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Comments Modal
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

  // Emotional Connection Modal
  const renderEmotionalConnectionModal = () => (
    <Modal
      visible={isEmotionalConnectionModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseEmotionalConnectionModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Emotional Connection</Text>
          <ScrollView style={styles.modalScrollView}>
            <Text style={styles.modalDescription}>
              {selectedCapsule?.Description || 'No emotional connection available.'}
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

  // Shared Friends Modal
  const renderSharedFriendsModal = () => (
    <Modal
      visible={isSharedFriendsModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseSharedFriendsModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {selectedCapsule?.Title} - Shared with Friends
          </Text>
          
          {/* Show creator information if user is a recipient */}
          {selectedCapsule?.IsShared && selectedCapsule?.CreatedBy !== currentUserId && selectedCapsule?.CreatorProfile && (
            <View style={styles.creatorInfoContainer}>
              <Text style={styles.creatorLabel}>Created by:</Text>
              <View style={styles.creatorProfileContainer}>
                {selectedCapsule.CreatorProfile.profilePicture ? (
                  <Image 
                    source={{ uri: `${Config.API_BASE_URL}/uploads/${selectedCapsule.CreatorProfile.profilePicture}` }}
                    style={styles.creatorProfilePic}
                    onError={() => console.log('Failed to load creator profile picture')}
                  />
                ) : (
                  <MaterialIcons name="person" size={24} color="#666" />
                )}
                <Text style={styles.creatorName}>
                  {selectedCapsule.CreatorProfile.username || 'Unknown User'}
                </Text>
              </View>
            </View>
          )}
          
          <ScrollView style={styles.modalScrollView}>
            {sharedFriends.length > 0 ? (
              <>
                <Text style={styles.modalDescription}>
                  {selectedCapsule?.SharedWith && selectedCapsule.SharedWith.length > 0 
                    ? `This capsule is shared with ${sharedFriends.length} friend${sharedFriends.length > 1 ? 's' : ''}:`
                    : `This shared capsule can be shared with ${sharedFriends.length} friend${sharedFriends.length > 1 ? 's' : ''}:`
                  }
                </Text>
                {sharedFriends.map(friend => (
                  <View key={friend._id} style={styles.sharedFriendItem}>
                    {friend.profilePicture ? (
                      <Image 
                        source={{ uri: `${Config.API_BASE_URL}/uploads/${friend.profilePicture}` }}
                        style={styles.friendProfilePic}
                        onError={() => console.log('Failed to load profile picture for:', friend.username)}
                      />
                    ) : (
                      <MaterialIcons name="person" size={20} color="#666" />
                    )}
                    <Text style={styles.sharedFriendName}>
                      {friend.username || 'Unknown User'}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.noFriendsContainer}>
                <MaterialIcons name="people-outline" size={48} color="#ccc" />
                <Text style={styles.modalDescription}>
                  {selectedCapsule?.SharedWith && selectedCapsule.SharedWith.length > 0
                    ? "This is a shared capsule, but it hasn't been shared with any friends yet."
                    : "You don't have any friends to share this capsule with."
                  }
                </Text>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: THEME.secondary }]}
            onPress={handleCloseSharedFriendsModal}
          >
            <Text style={styles.modalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loaderText}>Loading your time capsules...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={50} color={THEME.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: THEME.primary }]}
            onPress={() => {
              setLoading(true);
              setCapsules([]);
              // Retry fetching capsules
              const fetchCapsules = async () => {
                try {
                  const data = await getUserCapsules();
                  setCapsules(data);
                  setError(null);
                } catch (error) {
                  setError(error.message);
                } finally {
                  setLoading(false);
                }
              };
              fetchCapsules();
            }}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (capsules.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesome name="hourglass-o" size={50} color={THEME.primary} />
          <Text style={styles.emptyText}>No time capsules found</Text>
          <Text style={styles.emptySubText}>Create your first time capsule to get started!</Text>
        </View>
      );
    }

    // Sort capsules by unlock date
    const sortedCapsules = [...capsules].sort((a, b) => {
      const dateA = new Date(a.UnlockDate);
      const dateB = new Date(b.UnlockDate);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
 
    return (
      <FlatList
        data={sortedCapsules}
        keyExtractor={(item) => item._id}
        renderItem={renderCapsule}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={async () => {
          setLoading(true);
          try {
            const data = await getUserCapsules();
            setCapsules(data);
            setError(null);
          } catch (error) {
            setError(error.message);
          } finally {
            setLoading(false);
          }
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
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
          <GradientComponent 
            colors={[THEME.primary, THEME.primaryDark]} 
            style={styles.headerContainer}
          >
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                                    <Icon name="chevron-back" size={24} color="#FFFFFF" />
                                  </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}> 
              
              <View style={{ flex: 1 }}>
               
                <Text style={styles.headerText}>My Time Capsules</Text>
                <Text style={styles.subHeaderText}>
                  Explore and revisit your memories or unlock shared moments.
                </Text>
              </View>
              <View style={{ marginLeft: 10, minWidth: 40, minHeight: 40, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 8, overflow: 'hidden', backgroundColor: THEME.primaryDark }}>
                <Picker
                  selectedValue={sortOrder}
                  style={{ width: 40, height: 40, color: '#fff', backgroundColor: 'transparent' }}
                  dropdownIconColor="#fff"
                  onValueChange={(itemValue) => setSortOrder(itemValue)}
                  mode="dropdown"
                >
                  <Picker.Item label="Descending" value="desc" color="#000" />
                  <Picker.Item label="Ascending" value="asc" color="#000" />
                </Picker>
                {/* Overlay icon for ASC/DESC */}
                {/* <View style={{ position: 'absolute', left: 0, top: 0, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
                  <MaterialIcons name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'} size={24} color="#fff" />
                </View> */}
              </View>
            </View>
          </GradientComponent>

          {renderContent()}
        </>
      )}

      {/* Modals */}
      {renderCommentsModal()}
      {renderEmotionalConnectionModal()}
      {renderSharedFriendsModal()}
    </View>
  );
};

export default CapsulePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 10,
  },
  headerContainer: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    // marginTop: 20,
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 14,
    color: '#e0e0e0',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
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
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
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
  capsuleTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  capsuleTypeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
    flex: 1,
  },
  clickableCapsuleType: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
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
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  mediaContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },

  // Video Container Styles
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
  
  // Audio Container Styles
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
  
  // Progress Container Styles
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
  
  // Media Fallback Styles
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
  
  // Loading and Error States
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 5,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
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

  // Shared Friends Modal Styles
  sharedFriendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sharedFriendName: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  friendProfilePic: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  noFriendsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  creatorInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  creatorLabel: {
    fontSize: 14,
    color: '#555',
    marginRight: 5,
  },
  creatorProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorProfilePic: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 5,
  },
  creatorName: {
    fontSize: 14,
    color: '#333',
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
   backButton: {
    position:"absolute",
    top:6,
    left:6,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});