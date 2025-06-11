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
  SafeAreaView,
} from 'react-native';
import { Camera, useCameraDevices, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { MyContext } from "../../context/MyContext";

export default function CameraScreen() {
  const context = useContext(MyContext);
  const { capsuleInfo, setCapsuleInfo } = context;
  const navigation = useNavigation();

  const devices = useCameraDevices();
  const [cameraPosition, setCameraPosition] = useState('back');
  const device = devices.find(d => d.position === cameraPosition) || devices[0];

  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();

  const [photo, setPhoto] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const cameraRef = useRef(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (!hasCameraPermission) await requestCameraPermission();
    if (!hasMicrophonePermission) await requestMicrophonePermission();
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);
    }
  };

  if (hasCameraPermission == null || hasMicrophonePermission == null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Requesting permissions...</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Loading camera...</Text>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && device) {
      try {
        setIsLoading(true);
        const photo = await cameraRef.current.takePhoto({});
        const photoUri = Platform.OS === 'android' ? `file://${photo.path}` : photo.path;
        setCapsuleInfo(prev => ({ ...prev, fileUri: photoUri }));
        setPhoto(photoUri);
      } catch (error) {
        Alert.alert("Error", error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleCameraFacing = () => {
    setCameraPosition((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const SettingsScreen = () => {
    navigation.navigate('SettingsScreen');
  };

  const createCapsule = () => {
    if (photo || videoUri) {
      navigation.navigate('CapsuleCreationScreen');
    } else {
      Alert.alert('Error', 'No photo or video selected');
    }
  };

  const handleCameraReady = () => setIsCameraReady(true);

  return (
    <SafeAreaView style={styles.container}>
      {!videoUri && !photo ? (
        <>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            photo={true}
            video={true}
            audio={hasMicrophonePermission}
            onInitialized={handleCameraReady}
          />

          {/* Overlay Buttons */}
          <TouchableOpacity style={styles.buttonTopLeft} onPress={toggleCameraFacing}>
            <Text style={styles.buttonText}>FLIP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonTopRight} onPress={SettingsScreen}>
            <Text style={styles.buttonText}>SETTINGS</Text>
          </TouchableOpacity>

          <View style={styles.buttonBottomCenter}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={isLoading || !isCameraReady}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>CAPTURE</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : photo ? (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: photo }} style={styles.fullScreenImage} />
          <TouchableOpacity style={styles.buttonTopLeft} onPress={() => setPhoto(null)}>
            <Text style={styles.buttonText}>CLOSE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createButton} onPress={createCapsule}>
            <Text style={styles.buttonText}>Create Capsule</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
    backgroundColor: 'black',
  },
  text: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  captureButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonTopLeft: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
  },
  buttonTopRight: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
  },
  buttonBottomCenter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  mediaContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  createButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#6BAED6',
    padding: 15,
    borderRadius: 10,
  },
});
