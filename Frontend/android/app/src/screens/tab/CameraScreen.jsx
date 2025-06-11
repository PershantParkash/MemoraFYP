import React, { useState, useRef, useEffect, useContext } from 'react';
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
} from 'react-native';
import { Camera, useCameraDevices, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MyContext } from "../../context/MyContext";

export default function CameraScreen() {
  const context = useContext(MyContext);
  const { capsuleInfo, setCapsuleInfo } = context;
  const navigation = useNavigation();

  // Camera setup
  const devices = useCameraDevices();
  const [cameraPosition, setCameraPosition] = useState('back');
  
  // Get device with fallback
  const device = devices.find(d => d.position === cameraPosition) || 
                devices.find(d => d.position === 'back') || 
                devices[0];
  
  // Permissions
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();

  // State
  const [photo, setPhoto] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const cameraRef = useRef(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  // Debug camera devices
  useEffect(() => {
    console.log('Available camera devices:', devices);
    console.log('Selected device:', device);
  }, [devices, device]);

  const requestPermissions = async () => {
    // Request camera permission
    if (!hasCameraPermission) {
      const cameraGranted = await requestCameraPermission();
      if (!cameraGranted) {
        Alert.alert('Camera Permission', 'Camera permission is required to use this feature');
        return;
      }
    }

    // Request microphone permission
    if (!hasMicrophonePermission) {
      const micGranted = await requestMicrophonePermission();
      if (!micGranted) {
        Alert.alert('Microphone Permission', 'Microphone permission is required for video recording');
      }
    }

    // Request storage permission for Android
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Show loading if permissions are not determined yet
  if (hasCameraPermission === null || hasMicrophonePermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.message}>Requesting permissions...</Text>
      </View>
    );
  }

  // Show permission request screen if permissions denied
  if (hasCameraPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission is required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading if device is not available
  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.message}>Loading camera...</Text>
        <Text style={styles.message}>
          Devices found: {devices.length}
        </Text>
        {devices.length > 0 && (
          <Text style={styles.message}>
            Available: {devices.map(d => d.position).join(', ')}
          </Text>
        )}
      </View>
    );
  }

  const toggleCameraFacing = () => {
    const newPosition = cameraPosition === 'back' ? 'front' : 'back';
    const newDevice = devices.find(d => d.position === newPosition);
    if (newDevice) {
      setCameraPosition(newPosition);
    }
  };

  const takePicture = async () => {
    try {
      if (cameraRef.current) {
        setIsLoading(true);
        const photo = await cameraRef.current.takePhoto({
          qualityPrioritization: 'speed',
          flash: 'off',
        });
        
        const photoUri = `file://${photo.path}`;
        setCapsuleInfo(prevState => ({ ...prevState, fileUri: photoUri }));
        setPhoto(photoUri);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      if (cameraRef.current && !isRecording) {
        setIsRecording(true);
        await cameraRef.current.startRecording({
          flash: 'off',
          onRecordingFinished: (video) => {
            const videoUri = `file://${video.path}`;
            setVideoUri(videoUri);
            setCapsuleInfo(prevState => ({ ...prevState, fileUri: videoUri }));
            setIsRecording(false);
          },
          onRecordingError: (error) => {
            console.error('Recording error:', error);
            setIsRecording(false);
            Alert.alert('Error', 'Failed to record video');
          },
        });
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (cameraRef.current && isRecording) {
        await cameraRef.current.stopRecording();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const SettingsScreen = () => {
    navigation.navigate('SettingsScreen');
  };

  const createCapsule = async () => {
    if (photo || videoUri) {
      try {
        navigation.navigate('CapsuleCreationScreen');
      } catch (error) {
        console.error('Error navigating to capsule creation:', error);
      }
    } else {
      Alert.alert('Media Error', 'No valid photo or video provided.');
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setCapsuleInfo(prevState => ({ ...prevState, fileUri: null }));
  };

  const removeVideo = () => {
    setVideoUri(null);
    setCapsuleInfo(prevState => ({ ...prevState, fileUri: null }));
  };

  return (
    <View style={styles.container}>
      {!videoUri && !photo ? (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
          video={true}
          audio={hasMicrophonePermission}
        >
          <TouchableOpacity style={styles.button2} onPress={toggleCameraFacing}>
            <MaterialIcons name="flip-camera-android" size={26} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsIcon} onPress={SettingsScreen}>
            <SimpleLineIcons name="settings" size={26} color="white" />
          </TouchableOpacity>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={takePicture}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size={66} color="white" />
              ) : (
                <MaterialIcons name="camera" size={66} color="white" />
              )}
            </TouchableOpacity>
            
            {/* Uncomment for video recording */}
            {/* 
            <TouchableOpacity 
              style={[styles.button, isRecording && styles.recordingButton]} 
              onPress={isRecording ? stopRecording : startRecording}
            >
              <MaterialIcons 
                name={isRecording ? "stop" : "videocam"} 
                size={66} 
                color="white" 
              />
            </TouchableOpacity>
            */}
          </View>
        </Camera>
      ) : photo ? (
        <View style={styles.photoContainer}>
          <Image source={{ uri: photo }} style={styles.fullScreenPhoto} />
          
          <TouchableOpacity style={styles.closeButton} onPress={removePhoto}>
            <Ionicons name="close-circle" size={40} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button3} onPress={createCapsule}>
            <Text style={styles.text}>Create Capsule</Text>
            <FontAwesome name="arrow-right" size={24} color="white" style={styles.button4}/>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.videoContainer}>
          {/* For video playback, you'll need react-native-video */}
          <Text style={styles.text}>Video recorded successfully!</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={removeVideo}>
              <Text style={styles.text}>Remove Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button3} onPress={createCapsule}>
              <Text style={styles.text}>Create Capsule</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
    fontSize: 16,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
  },
  button2: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  button3: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#6BAED6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  button4: {
    marginLeft: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
  fullScreenPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  settingsIcon: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
  permissionButton: {
    backgroundColor: '#6BAED6',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});