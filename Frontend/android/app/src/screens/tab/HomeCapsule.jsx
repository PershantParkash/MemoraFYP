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
} from 'react-native';
import Config from 'react-native-config';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import useCapsuleService from '../../hooks/useCapsuleService'
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
  
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const waveAnimation = useRef(new Animated.Value(1)).current;

  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const { getUserCapsules } = useCapsuleService();

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

  const renderCapsule = ({ item }) => (
    <View style={styles.capsuleContainer}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{item.Title}</Text>
        <FontAwesome
          name={item.Status === 'Locked' ? 'lock' : 'unlock'}
          size={24}
          color={item.Status === 'Locked' ? THEME.error : THEME.primary}
        />
      </View>

      <Text style={styles.description}>{item.Description}</Text>

      
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

      {item.Status === 'Open' ? (
        <TouchableOpacity
          style={[styles.viewButton, { backgroundColor: THEME.primary }]}
          onPress={() => setSelectedMedia(item.Media)}
        >
          <Text style={styles.buttonText}>View Capsule Media</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.viewButton2, { backgroundColor: THEME.error }]}>
          <Text style={styles.buttonText}>
            Unlock Date: {moment(item.UnlockDate).format('YYYY-MM-DD')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
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


// <FlatList
//   data={capsules.sort((a, b) => new Date(b.unlockDate) - new Date(a.unlockDate))}
//   keyExtractor={(item) => item._id}
//   renderItem={renderCapsule}
//   contentContainerStyle={styles.listContainer}
// />

    return (
      <FlatList
        data={capsules}
        keyExtractor={(item) => item._id}
        renderItem={renderCapsule}
        contentContainerStyle={styles.listContainer}
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
            <Text style={styles.headerText}>My Time Capsules</Text>
            <Text style={styles.subHeaderText}>
              Explore and revisit your memories or unlock shared moments.
            </Text>
          </GradientComponent>

          {renderContent()}
        </>
      )}
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
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
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
  viewButton: {
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  viewButton2: {
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
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
});