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
import useBackButtonHandler from '../../hooks/useBackButtonHandler';
import { Picker } from '@react-native-picker/picker';
import { useNavigationContext } from '../../context/NavigationContext';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance from '../../api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  community: '#8B5CF6',
  communityDark: '#7C3AED',
  like: '#FF3040',
  comment: '#4A90E2',
};

const FallbackGradient = ({ children, style, colors }) => (
  <View style={[style, { backgroundColor: colors?.[0] || '#000' }]}>
    {children}
  </View>
);

const GradientComponent = LinearGradient || FallbackGradient;

const CommunityHomeCapsule = () => {
  const [capsules, setCapsules] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
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
      addToHistory('CommunityHomeCapsule');
    }, [addToHistory])
  );
  
  // Media playback states
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal states
  const [isEmotionalConnectionModalVisible, setIsEmotionalConnectionModalVisible] = useState(false);
  const [isCreatorProfileModalVisible, setIsCreatorProfileModalVisible] = useState(false);

  const waveAnimation = useRef(new Animated.Value(1)).current;
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // Function to get public capsules
  const getPublicCapsules = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axiosInstance.get('/api/timecapsules/getPublicCapsule', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.capsules;
    } catch (error) {
      console.error('Error fetching capsules:', error);
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error('Failed to load capsules. Please try again later.');
    }
  };

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

  // Fetch public capsules
  useEffect(() => {
    const fetchPublicCapsules = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getPublicCapsules();
        setCapsules(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicCapsules();
  }, []);

  // Audio wave animation
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
                <MaterialIcons name="play-circle-filled" size={120} color={THEME.community} />
                <Text style={styles.mediaText}>Video File</Text>
                <Text style={styles.fallbackText}>Install react-native-video for preview</Text>
              </View>
            )}
          </View>
        );
        
      case 'audio':
        return (
          <GradientComponent colors={[THEME.community, THEME.communityDark]} style={styles.audioContainer}>
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

  const handleCreatorProfilePress = (capsule) => {
    setSelectedCapsule(capsule);
    setIsCreatorProfileModalVisible(true);
  };

  const handleCloseCreatorProfileModal = () => {
    setIsCreatorProfileModalVisible(false);
    setSelectedCapsule(null);
  };

  const renderCapsule = ({ item }) => {
    const isOwnCapsule = currentUserId && item.CreatedBy && item.CreatedBy._id === currentUserId;

  //    const HomeScreen = () => {
  //   navigation.navigate('Home');
  // };
    
    return (
      <View style={styles.capsuleContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{item.Title}</Text>
          <View style={styles.statusContainer}>
            <FontAwesome
              name="globe"
              size={20}
              color={THEME.community}
              style={styles.publicIcon}
            />
            <FontAwesome
              name={item.Status === 'Locked' ? 'lock' : 'unlock'}
              size={24}
              color={item.Status === 'Locked' ? THEME.error : THEME.success}
            />
          </View>
        </View>

        {/* Creator Information - Clickable for non-own capsules */}
        {!isOwnCapsule && item.CreatorProfile && (
          <TouchableOpacity
            style={styles.creatorContainer}
            onPress={() => handleCreatorProfilePress(item)}
          >
            <MaterialIcons name="person" size={16} color={THEME.community} />
            <Text style={styles.creatorText}>
              Created by: {item.CreatorProfile.username || 'Anonymous'}
            </Text>
            <MaterialIcons name="chevron-right" size={16} color="#666" />
          </TouchableOpacity>
        )}

        {/* Own Capsule Indicator */}
        {isOwnCapsule && (
          <View style={styles.ownCapsuleContainer}>
            <MaterialIcons name="star" size={16} color={THEME.warning} />
            <Text style={styles.ownCapsuleText}>Your Public Capsule</Text>
          </View>
        )}

        {/* Public Badge */}
        <View style={styles.publicBadgeContainer}>
          <MaterialIcons name="public" size={16} color={THEME.community} />
          <Text style={styles.publicBadgeText}>Public Community Capsule</Text>
        </View>

        {/* Emotional Connection Button */}
        {item.Description && item.Description.trim() !== '' && (
          <TouchableOpacity
            style={[styles.emotionalConnectionButton, { backgroundColor: THEME.community }]}
            onPress={() => handleEmotionalConnectionPress(item)}
          >
            <MaterialIcons name="chat" size={16} color="white" />
            <Text style={styles.emotionalConnectionText}>💬 Emotional Connection</Text>
          </TouchableOpacity>
        )}

        {/* Creation Date */}
        <View style={styles.dateContainer}>
          <MaterialIcons name="schedule" size={16} color="#666" />
          <Text style={styles.dateText}>
            Created: {moment(item.CreatedAt).format('MMM DD, YYYY')}
          </Text>
        </View>

        <Text style={styles.dateText}>
            {item._id}
          </Text>

        {/* Unlock Date */}
        {/* <View style={styles.dateContainer}>
          <MaterialIcons name="lock-clock" size={16} color="#666" />
          <Text style={styles.dateText}>
            {item.Status === 'Open' 
              ? `Unlocked: ${moment(item.UnlockDate).format('MMM DD, YYYY')}`
              : `Unlocks: ${moment(item.UnlockDate).format('MMM DD, YYYY')}`
            }
          </Text>
        </View> */}

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

        {/* Action Button */}
        {item.Status === 'Open' ? (
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: THEME.community }]}
            onPress={() => setSelectedMedia(item.Media)}
          >
            <MaterialIcons name="visibility" size={20} color="white" />
            <Text style={styles.buttonText}>View Capsule Media</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.lockedButton, { backgroundColor: THEME.error }]} 
          //  onPress={() => setSelectedMedia(item.Media)}
           >
            <MaterialIcons name="lock" size={20} color="white" />
            <Text style={styles.buttonText}>
              Unlocks: {moment(item.UnlockDate).format('MMM DD, YYYY')}
            </Text>
          </TouchableOpacity>
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
              <ActivityIndicator size="small" color={THEME.community} style={{ padding: 20 }} />
            ) : null
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyCommentsContainer}>
              <MaterialIcons name="comment" size={50} color="#ccc" />
              <Text style={styles.emptyCommentsText}>No comments yet</Text>
              <Text style={styles.emptyCommentsSubText}>Be the first to share your thoughts! {selectedCapsule._id}</Text>
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
            style={[styles.modalButton, { backgroundColor: THEME.community }]}
            onPress={handleCloseEmotionalConnectionModal}
          >
            <Text style={styles.modalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Creator Profile Modal
  const renderCreatorProfileModal = () => (
    <Modal
      visible={isCreatorProfileModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseCreatorProfileModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Creator Profile</Text>
          
          {selectedCapsule?.CreatorProfile && (
            <View style={styles.creatorProfileContainer}>
              {selectedCapsule.CreatorProfile.profilePicture ? (
                <Image 
                  source={{ uri: `${Config.API_BASE_URL}/uploads/${selectedCapsule.CreatorProfile.profilePicture}` }}
                  style={styles.creatorProfilePic}
                  onError={() => console.log('Failed to load creator profile picture')}
                />
              ) : (
                <View style={styles.defaultProfilePic}>
                  <MaterialIcons name="person" size={40} color="#666" />
                </View>
              )}
              
              <Text style={styles.creatorProfileName}>
                {selectedCapsule.CreatorProfile.username || 'Anonymous User'}
              </Text>
              
              {selectedCapsule.CreatorProfile.bio && (
                <Text style={styles.creatorProfileBio}>
                  {selectedCapsule.CreatorProfile.bio}
                </Text>
              )}
              
              <Text style={styles.capsuleCreationDate}>
                Created this capsule on: {moment(selectedCapsule.CreatedAt).format('MMMM DD, YYYY')}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: THEME.community }]}
            onPress={handleCloseCreatorProfileModal}
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
          <ActivityIndicator size="large" color={THEME.community} />
          <Text style={styles.loaderText}>Loading community time capsules...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={50} color={THEME.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: THEME.community }]}
            onPress={() => {
              setLoading(true);
              setCapsules([]);
              // Retry fetching capsules
              const fetchPublicCapsules = async () => {
                try {
                  const data = await getPublicCapsules();
                  setCapsules(data);
                  setError(null);
                } catch (error) {
                  setError(error.message);
                } finally {
                  setLoading(false);
                }
              };
              fetchPublicCapsules();
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
          <MaterialIcons name="public" size={50} color={THEME.community} />
          <Text style={styles.emptyText}>No public time capsules found</Text>
          <Text style={styles.emptySubText}>Check back later for community capsules!</Text>
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
            const data = await getPublicCapsules();
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
            colors={[THEME.community, THEME.communityDark]} 
            style={styles.headerContainer}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerText}>Community Time Capsules</Text>
                <Text style={styles.subHeaderText}>
                  Discover and explore public memories shared by the community.
                </Text>
                {/* <Text style={styles.subText} onPress={()=> { navigation.navigate('Home'); }}>
                 View Your Capsules
                </Text> */}
              </View>
              <View style={{ marginLeft: 10, minWidth: 40, minHeight: 40, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 8, overflow: 'hidden', backgroundColor: THEME.communityDark }}>
                <Picker
                  selectedValue={sortOrder}
                  style={{ width: 40, height: 40, color: '#fff', backgroundColor: 'transparent' }}
                  dropdownIconColor="#fff"
                  onValueChange={(itemValue) => setSortOrder(itemValue)}
                  mode="dropdown"
                >
                  <Picker.Item label="Newest First" value="desc" color="#000" />
                  <Picker.Item label="Oldest First" value="asc" color="#000" />
                </Picker>
              </View>
            </View>
 <Text style={styles.subText} onPress={()=> { navigation.navigate('Home'); }}>
                 View Your Capsules
                </Text>
          </GradientComponent>

          {renderContent()}
        </>
      )}

      {/* Modals */}
      {renderEmotionalConnectionModal()}
      {renderCreatorProfileModal()}
      {renderCommentsModal()}
    </View>
  );
};

export default CommunityHomeCapsule;

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
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 14,
    color: '#e0e0e0',
    textAlign: 'center',
   
  },
  subText:{
    fontSize: 14,
    color: '#e0e0e0',
    textAlign: 'center',
    backgroundColor:"#997be0ff",
     padding:10,
     borderRadius:6,
     marginTop:10
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
    borderLeftWidth: 4,
    borderLeftColor: THEME.community,
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
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  creatorText: {
    fontSize: 14,
    color: THEME.community,
    marginLeft: 5,
    flex: 1,
    fontWeight: '500',
  },
  ownCapsuleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffe066',
  },
  ownCapsuleText: {
    fontSize: 12,
    color: THEME.warning,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  publicBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  publicBadgeText: {
    fontSize: 12,
    color: THEME.community,
    marginLeft: 5,
    fontWeight: '500',
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
    backgroundColor: THEME.community,
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
    backgroundColor: THEME.community,
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
  
  // Creator Profile Modal Styles
  creatorProfileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  creatorProfilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: THEME.community,
  },
  defaultProfilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  creatorProfileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  creatorProfileBio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 18,
  },
  capsuleCreationDate: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});