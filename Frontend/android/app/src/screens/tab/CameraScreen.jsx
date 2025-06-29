import React, {useState, useRef, useEffect, useContext} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  Dimensions,
  Animated,
  AppState, // Added AppState import
    BackHandler,
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useCameraPermission,
  useMicrophonePermission,
} from 'react-native-vision-camera';
import {useNavigation, useFocusEffect} from '@react-navigation/native'; // Added useFocusEffect
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AudioRecord from 'react-native-audio-record';
import {MyContext} from '../../context/MyContext';

let Video = null;
let LinearGradient = null;
let Sound = null;

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

try {
  Sound = require('react-native-video').default;
} catch (e) {
  console.log('react-native-video not available for audio');
}

const {width, height} = Dimensions.get('window');

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

const FallbackGradient = ({children, style, colors}) => (
  <View style={[style, {backgroundColor: colors?.[0] || '#000'}]}>
    {children}
  </View>
);

const GradientComponent = LinearGradient || FallbackGradient;

export default function CameraScreen() {
  const context = useContext(MyContext);
  const {capsuleInfo, setCapsuleInfo} = context;
  const navigation = useNavigation();
  const [isRecordingInProgress, setIsRecordingInProgress] = useState(false);
  const devices = useCameraDevices();
  const [cameraPosition, setCameraPosition] = useState('back');
  const device = devices.find(d => d.position === cameraPosition) || devices[0];

  const {
    hasPermission: hasCameraPermission,
    requestPermission: requestCameraPermission,
  } = useCameraPermission();
  const {
    hasPermission: hasMicrophonePermission,
    requestPermission: requestMicrophonePermission,
  } = useMicrophonePermission();

  const [photo, setPhoto] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [audioUri, setAudioUri] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const [currentMode, setCurrentMode] = useState('photo');
  const [recordingTime, setRecordingTime] = useState(0);

  const waveAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    setIsRecordingInProgress(isRecording || isAudioRecording);
  }, [isRecording, isAudioRecording]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (isRecordingInProgress) {
          Alert.alert(
            'Recording in Progress',
            'Please stop the current recording before navigating away.',
            [{text: 'OK'}],
          );
          return true; // Prevent default back action
        }
        return false; // Allow default back action
      },
    );

    return () => backHandler.remove();
  }, [isRecordingInProgress]);

  useEffect(() => {
    requestPermissions();

    setTimeout(() => {
      initializeAudioRecord();
    }, 500);

    // Add AppState listener
    const handleAppStateChange = nextAppState => {
      if (
        appStateRef.current.match(/active|foreground/) &&
        nextAppState === 'background'
      ) {
        // App is going to background, stop any active recordings
        handleAppGoingToBackground();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      clearInterval(recordingIntervalRef.current);
      subscription?.remove();
    };
  }, []);

useFocusEffect(
  React.useCallback(() => {
    return () => {
      handleScreenUnfocus(); 
    };
  }, [])  
);
useEffect(() => {
  const unsubscribe = navigation.addListener('blur', async () => {
    // Screen lost focus (navigated away)
    if (isRecording || isAudioRecording) {
      // First stop the recording
      if (isRecording) {
        await stopVideoRecording();
      }
      if (isAudioRecording) {
        await stopAudioRecording();
      }
      
      // Then show the alert
      setTimeout(() => {
        Alert.alert(
          'Recording Stopped',
          'Recording was automatically stopped due to navigation.',
          [{ text: 'OK' }]
        );
      }, 100);
    }
  });

  return unsubscribe;
}, [navigation, isRecording, isAudioRecording]);


useEffect(() => {
  if (isRecordingInProgress) {
    // Prevent tab switching during recording
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      Alert.alert(
        'Recording in Progress',
        'Please stop the current recording before switching tabs.',
        [{ text: 'OK' }]
      );
    });

    return unsubscribe;
  }
}, [navigation, isRecordingInProgress]);

  // Function to handle app going to background
  const handleAppGoingToBackground = async () => {
    if (isRecording) {
      console.log('App going to background, stopping video recording');
      await stopVideoRecording();
    }
    if (isAudioRecording) {
      console.log('App going to background, stopping audio recording');
      await stopAudioRecording();
    }
  };

  // Function to handle screen unfocus (tab switching)
  const handleScreenUnfocus = async () => {
    if (isRecording) {
      console.log('Screen unfocused, stopping video recording');
      await stopVideoRecording();
    }
    if (isAudioRecording) {
      console.log('Screen unfocused, stopping audio recording');
      await stopAudioRecording();
    }
  };

  useEffect(() => {
    if (isRecording || isAudioRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      clearInterval(recordingIntervalRef.current);
      setRecordingTime(0);
      pulseAnimation.setValue(1);
    }

    return () => clearInterval(recordingIntervalRef.current);
  }, [isRecording, isAudioRecording]);

  useEffect(() => {
    if (isAudioRecording || isAudioPlaying) {
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
        ]),
      ).start();
    } else {
      waveAnimation.setValue(1);
    }
  }, [isAudioRecording, isAudioPlaying]);

  const initializeAudioRecord = () => {
    try {
      const options = {
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        audioEncoder: 'aac',
        audioEncodingBitRate: 32000,
        audioFileType: 'aac',
        includeBase64: false,
        audioQuality: 'medium',
      };
      AudioRecord.init(options);
      console.log('AudioRecord initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AudioRecord:', error);
    }
  };

  const requestPermissions = async () => {
    if (!hasCameraPermission) await requestCameraPermission();
    if (!hasMicrophonePermission) await requestMicrophonePermission();
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
    }
  };

  if (hasCameraPermission == null || hasMicrophonePermission == null) {
    return (
      <GradientComponent
        colors={[THEME.primary, THEME.primaryDark]}
        style={styles.centered}>
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.text}>Requesting permissions...</Text>
      </GradientComponent>
    );
  }

  if (!device) {
    return (
      <GradientComponent
        colors={[THEME.primary, THEME.primaryDark]}
        style={styles.centered}>
        <Text style={styles.text}>Loading camera...</Text>
      </GradientComponent>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && device) {
      try {
        setIsLoading(true);
        const photo = await cameraRef.current.takePhoto({
          quality: 0.8,
          enableAutoRedEyeReduction: true,
        });
        const photoUri =
          Platform.OS === 'android' ? `file://${photo.path}` : photo.path;
        setCapsuleInfo(prev => ({
          ...prev,
          fileUri: photoUri,
          mediaType: 'photo',
        }));
        setPhoto(photoUri);
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const startVideoRecording = async () => {
    if (cameraRef.current && device) {
      try {
        setIsRecording(true);
        await cameraRef.current.startRecording({
          flash: 'off',
          quality: 'hd',
          onRecordingFinished: video => {
            const videoUri =
              Platform.OS === 'android' ? `file://${video.path}` : video.path;
            setCapsuleInfo(prev => ({
              ...prev,
              fileUri: videoUri,
              mediaType: 'video',
            }));
            setVideoUri(videoUri);
            setIsRecording(false);
            console.log('Video recording finished:', videoUri);
          },
          onRecordingError: error => {
            Alert.alert('Recording Error', error.message);
            setIsRecording(false);
            console.error('Video recording error:', error);
          },
        });
      } catch (error) {
        Alert.alert('Error', error.message);
        setIsRecording(false);
        console.error('Start video recording error:', error);
      }
    }
  };

  const stopVideoRecording = async () => {
    if (cameraRef.current && isRecording) {
      try {
        console.log('Stopping video recording...');
        await cameraRef.current.stopRecording();
      } catch (error) {
        console.error('Error stopping video recording:', error);
        Alert.alert('Error', 'Failed to stop video recording properly');
        // Force reset recording state even if stop fails
        setIsRecording(false);
      }
    }
  };

  const startAudioRecording = async () => {
    try {
      initializeAudioRecord();

      setTimeout(() => {
        try {
          AudioRecord.start();
          setIsAudioRecording(true);
          console.log('Audio recording started');
        } catch (error) {
          console.error('Error starting audio recording:', error);
          Alert.alert(
            'Audio Recording Error',
            'Failed to start recording. Please try again.',
          );
          setIsAudioRecording(false);
        }
      }, 100);
    } catch (error) {
      console.error('Audio Recording Error:', error);
      Alert.alert('Audio Recording Error', error.message);
      setIsAudioRecording(false);
    }
  };

  const stopAudioRecording = async () => {
    try {
      console.log('Stopping audio recording...');
      const audioFile = await AudioRecord.stop();
      const audioUri =
        Platform.OS === 'android' ? `file://${audioFile}` : audioFile;

      if (audioUri && audioUri !== 'file://') {
        setCapsuleInfo(prev => ({
          ...prev,
          fileUri: audioUri,
          mediaType: 'audio',
        }));
        setAudioUri(audioUri);
        console.log('Audio recorded successfully:', audioUri);
      } else {
        throw new Error('Invalid audio file path');
      }

      setIsAudioRecording(false);
    } catch (error) {
      console.error('Error stopping audio recording:', error);
      Alert.alert('Error', 'Failed to save audio recording. Please try again.');
      setIsAudioRecording(false);
    }
  };

  const handleCapture = async () => {
    switch (currentMode) {
      case 'photo':
        await takePicture();
        break;
      case 'video':
        if (isRecording) {
          await stopVideoRecording();
        } else {
          await startVideoRecording();
        }
        break;
      case 'audio':
        if (isAudioRecording) {
          await stopAudioRecording();
        } else {
          await startAudioRecording();
        }
        break;
    }
  };

  const playVideo = () => {
    setIsVideoPlaying(!isVideoPlaying);
  };

  const playAudio = () => {
    if (!audioUri) return;

    if (!Video) {
      Alert.alert(
        'Audio Preview',
        'Audio recorded successfully! Video library required for preview.',
      );
      return;
    }

    setIsAudioPlaying(!isAudioPlaying);
  };

  const toggleCameraFacing = () => {
    setCameraPosition(prev => (prev === 'back' ? 'front' : 'back'));
  };

  const SettingsScreen = () => {
    navigation.navigate('SettingsScreen');
  };

  const createCapsule = () => {
    if (photo || videoUri || audioUri) {
      navigation.navigate('CapsuleCreationScreen');
    } else {
      Alert.alert('Error', 'No media selected');
    }
  };

  const clearMedia = () => {
    setPhoto(null);
    setVideoUri(null);
    setAudioUri(null);
    setIsVideoPlaying(false);
    setIsAudioPlaying(false);
    setAudioProgress(0);
    setAudioDuration(0);
    setVideoProgress(0);
    setVideoDuration(0);

    setCapsuleInfo(prev => ({...prev, fileUri: null, mediaType: null}));
  };

  const handleCameraReady = () => setIsCameraReady(true);

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const getCurrentMedia = () => {
    if (photo) return {uri: photo, type: 'photo'};
    if (videoUri) return {uri: videoUri, type: 'video'};
    if (audioUri) return {uri: audioUri, type: 'audio'};
    return null;
  };

  const currentMedia = getCurrentMedia();

  return (
    <SafeAreaView style={styles.container}>
      {!currentMedia ? (
        <>
          {currentMode !== 'audio' && (
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
              photo={currentMode === 'photo'}
              video={currentMode === 'video'}
              audio={hasMicrophonePermission}
              onInitialized={handleCameraReady}
            />
          )}

          {currentMode === 'audio' && (
            <GradientComponent
              colors={[THEME.primary, THEME.secondary]}
              style={styles.audioBackground}>
              <View style={styles.audioWaveContainer}>
                <Animated.View
                  style={[
                    styles.micContainer,
                    {transform: [{scale: waveAnimation}]},
                  ]}>
                  <MaterialIcons name="mic" size={100} color="white" />
                </Animated.View>

                {isAudioRecording && (
                  <View style={styles.waveAnimation}>
                    {[1, 2, 3].map(i => (
                      <Animated.View
                        key={i}
                        style={[
                          styles.wave,
                          styles[`wave${i}`],
                          {
                            transform: [{scale: pulseAnimation}],
                            opacity: pulseAnimation.interpolate({
                              inputRange: [1, 1.2],
                              outputRange: [0.3, 0.1],
                            }),
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
              <Text style={styles.audioText}>
                {isAudioRecording
                  ? 'Recording Audio...'
                  : 'Tap to Record Audio'}
              </Text>
              {isAudioRecording && (
                <Text style={styles.recordingTime}>
                  {formatTime(recordingTime)}
                </Text>
              )}
            </GradientComponent>
          )}

          <GradientComponent
            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0)']}
            style={styles.topBar}>
            <View style={styles.topControls}>
              {currentMode !== 'audio' && (
                <TouchableOpacity
                  style={styles.topButton}
                  onPress={toggleCameraFacing}>
                  <MaterialIcons
                    name="flip-camera-ios"
                    size={28}
                    color="white"
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.topButton,
                  isRecordingInProgress && styles.disabledButton, // Add this line
                ]}
                onPress={() => {
                  if (isRecordingInProgress) {
                    Alert.alert(
                      'Recording in Progress',
                      'Please stop the current recording before accessing settings.',
                      [{text: 'OK'}],
                    );
                    return;
                  }
                  SettingsScreen();
                }}
                disabled={isRecordingInProgress} // Add this line
              >
                <MaterialIcons
                  name="settings"
                  size={28}
                  color={
                    isRecordingInProgress ? 'rgba(255,255,255,0.3)' : 'white'
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Recording Indicator */}
            {(isRecording || isAudioRecording) && (
              <Animated.View
                style={[
                  styles.recordingIndicator,
                  {transform: [{scale: pulseAnimation}]},
                ]}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  REC {formatTime(recordingTime)}
                </Text>
              </Animated.View>
            )}
          </GradientComponent>

          <View style={styles.modeSelector}>
            {['photo', 'video', 'audio'].map(mode => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeButton,
                  currentMode === mode && styles.activeModeButton,
                  isRecordingInProgress &&
                    currentMode !== mode &&
                    styles.disabledModeButton, // Add this line
                ]}
                onPress={() => {
                  if (isRecordingInProgress) {
                    Alert.alert(
                      'Recording in Progress',
                      'Please stop the current recording before switching modes.',
                      [{text: 'OK'}],
                    );
                    return;
                  }
                  setCurrentMode(mode);
                }}
                disabled={isRecordingInProgress && currentMode !== mode} // Add this line
              >
                <MaterialIcons
                  name={
                    mode === 'photo'
                      ? 'photo-camera'
                      : mode === 'video'
                      ? 'videocam'
                      : 'mic'
                  }
                  size={24}
                  color={
                    currentMode === mode
                      ? THEME.primary
                      : isRecordingInProgress && currentMode !== mode
                      ? 'rgba(255,255,255,0.3)'
                      : 'white'
                  }
                />
                <Text
                  style={[
                    styles.modeText,
                    currentMode === mode && styles.activeModeText,
                    isRecordingInProgress &&
                      currentMode !== mode &&
                      styles.disabledModeText, // Add this line
                  ]}>
                  {mode.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <GradientComponent
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
            style={styles.bottomBar}>
            <View style={styles.captureContainer}>
              <Animated.View
                style={[
                  {
                    transform: [
                      {
                        scale:
                          isRecording || isAudioRecording ? pulseAnimation : 1,
                      },
                    ],
                  },
                ]}>
                <TouchableOpacity
                  style={[
                    styles.captureButton,
                    currentMode === 'photo' && styles.photoButton,
                    currentMode === 'video' &&
                      (isRecording
                        ? styles.recordingButton
                        : styles.videoButton),
                    currentMode === 'audio' &&
                      (isAudioRecording
                        ? styles.recordingButton
                        : styles.audioButton),
                  ]}
                  onPress={handleCapture}
                  disabled={
                    isLoading || (!isCameraReady && currentMode !== 'audio')
                  }>
                  {isLoading ? (
                    <ActivityIndicator color="white" size="large" />
                  ) : (
                    <>
                      {currentMode === 'photo' && (
                        <View style={styles.photoButtonInner} />
                      )}
                      {currentMode === 'video' && (
                        <MaterialIcons
                          name={isRecording ? 'stop' : 'play-arrow'}
                          size={40}
                          color="white"
                        />
                      )}
                      {currentMode === 'audio' && (
                        <MaterialIcons
                          name={isAudioRecording ? 'stop' : 'mic'}
                          size={40}
                          color="white"
                        />
                      )}
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </GradientComponent>
        </>
      ) : (
        <View style={styles.previewContainer}>
          {currentMedia.type === 'photo' && (
            <Image
              source={{uri: currentMedia.uri}}
              style={styles.fullScreenMedia}
            />
          )}

          {currentMedia.type === 'video' && (
            <View style={styles.videoContainer}>
              {Video ? (
                <>
                  <Video
                    ref={videoRef}
                    source={{uri: currentMedia.uri}}
                    style={styles.fullScreenMedia}
                    paused={!isVideoPlaying}
                    resizeMode="cover"
                    onLoad={data => {
                      setVideoDuration(data.duration);
                    }}
                    onProgress={data => {
                      setVideoProgress(data.currentTime);
                    }}
                    onEnd={() => {
                      setIsVideoPlaying(false);
                      setVideoProgress(0);
                    }}
                  />

                  <TouchableOpacity
                    style={styles.videoOverlay}
                    onPress={playVideo}>
                    <View style={styles.videoControls}>
                      <MaterialIcons
                        name={isVideoPlaying ? 'pause' : 'play-arrow'}
                        size={80}
                        color="rgba(255,255,255,0.9)"
                      />
                    </View>
                  </TouchableOpacity>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {width: `${(videoProgress / videoDuration) * 100}%`},
                        ]}
                      />
                    </View>
                    <Text style={styles.timeText}>
                      {formatTime(Math.floor(videoProgress))} /{' '}
                      {formatTime(Math.floor(videoDuration))}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.videoFallback}>
                  <MaterialIcons
                    name="play-circle-filled"
                    size={120}
                    color="white"
                  />
                  <Text style={styles.mediaText}>Video Recorded</Text>
                  <Text style={styles.fallbackText}>
                    Install react-native-video for preview
                  </Text>
                </View>
              )}
            </View>
          )}

          {currentMedia.type === 'audio' && (
            <GradientComponent
              colors={[THEME.primary, THEME.primaryDark]}
              style={styles.audioPreview}>
              {Video && audioUri && (
                <Video
                  ref={audioRef}
                  source={{uri: audioUri}}
                  style={{width: 0, height: 0}}
                  paused={!isAudioPlaying}
                  onLoad={data => {
                    setAudioDuration(data.duration);
                  }}
                  onProgress={data => {
                    setAudioProgress(data.currentTime);
                  }}
                  onEnd={() => {
                    setIsAudioPlaying(false);
                    setAudioProgress(0);
                  }}
                  onError={error => {
                    console.log('Audio playback error:', error);
                    Alert.alert('Audio Error', 'Unable to play audio');
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
                          transform: [
                            {
                              scaleY: isAudioPlaying
                                ? Animated.multiply(
                                    waveAnimation,
                                    1 + Math.random() * 0.5,
                                  )
                                : 1,
                            },
                          ],
                        },
                      ]}
                    />
                  ))}
                </View>

                <Text style={styles.mediaText}>
                  Audio Recorded Successfully!
                </Text>
                {audioDuration > 0 && (
                  <Text style={styles.subText}>
                    Duration: {formatTime(Math.floor(audioDuration))}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.audioPlayButton}
                  onPress={playAudio}>
                  <MaterialIcons
                    name={isAudioPlaying ? 'pause' : 'play-arrow'}
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
                          {width: `${(audioProgress / audioDuration) * 100}%`},
                        ]}
                      />
                    </View>
                    <Text style={styles.timeText}>
                      {formatTime(Math.floor(audioProgress))} /{' '}
                      {formatTime(Math.floor(audioDuration))}
                    </Text>
                  </View>
                )}

                {!Video && (
                  <Text style={styles.fallbackText}>
                    Audio recorded successfully!{'\n'}
                    Install react-native-video for preview
                  </Text>
                )}
              </View>
            </GradientComponent>
          )}

          {/* Preview Controls */}
          <GradientComponent
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
            style={styles.previewControls}>
            <TouchableOpacity style={styles.retakeButton} onPress={clearMedia}>
              <MaterialIcons name="refresh" size={24} color="white" />
              <Text style={styles.controlButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createButton}
              onPress={createCapsule}>
              <GradientComponent
                colors={[THEME.primary, THEME.secondary]}
                style={styles.createButtonGradient}>
                <MaterialIcons name="add" size={24} color="white" />
                <Text style={styles.createButtonText}>Create Capsule</Text>
              </GradientComponent>
            </TouchableOpacity>
          </GradientComponent>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600',
  },

  audioBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioWaveContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  micContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveAnimation: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  wave1: {
    width: 120,
    height: 120,
  },
  wave2: {
    width: 160,
    height: 160,
  },
  wave3: {
    width: 200,
    height: 200,
  },
  audioText: {
    color: 'white',
    fontSize: 20,
    marginTop: 30,
    fontWeight: '600',
    textAlign: 'center',
  },
  recordingTime: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
  },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,0,0,0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 8,
  },
  recordingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },

  modeSelector: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modeButton: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 10,
    marginHorizontal: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    minWidth: 80,
  },
  activeModeButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  modeText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  activeModeText: {
    color: THEME.primary,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
    zIndex: 10,
  },
  captureContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  photoButton: {
    backgroundColor: 'white',
  },
  videoButton: {
    backgroundColor: THEME.primary,
  },
  audioButton: {
    backgroundColor: THEME.secondary,
  },
  recordingButton: {
    backgroundColor: THEME.error,
    borderColor: THEME.error,
  },
  photoButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#333',
  },

  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  fullScreenMedia: {
    width: '100%',
    height: '100%',
  },

  videoContainer: {
    flex: 1,
    position: 'relative',
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
  videoFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },

  audioPreview: {
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
  subText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  fallbackText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Progress Styles
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

  // Fallback styles
  mediaText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '600',
  },
  fallbackText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },

  // Preview Controls
  previewControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 40,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  controlButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  createButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 15,
  },
  createButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledModeButton: {
  backgroundColor: 'rgba(0,0,0,0.3)',
},
disabledModeText: {
  color: 'rgba(255,255,255,0.3)',
},
disabledButton: {
  backgroundColor: 'rgba(0,0,0,0.3)',
},
});
