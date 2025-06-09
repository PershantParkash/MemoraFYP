// import React, { useState, useContext } from 'react';
// import {
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   Image,
//   Alert,
//   Platform,
// } from 'react-native';
// import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
// import { useNavigation } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Video from 'react-native-video';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
// import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// // import { MyContext } from '../context/MyContext';
// // 
// export default function CameraScreen() {
//   // const context = useContext(MyContext);
//   // const { capsuleInfo, setCapsuleInfo } = context;
//   const [capsuleInfo, setCapsuleInfo ]  = useState();
//   const navigation = useNavigation();
  
//   // State management
//   const [photo, setPhoto] = useState(null);
//   const [videoUri, setVideoUri] = useState(null);
  
//   const cameraOptions = {
//     mediaType: 'photo',
//     includeBase64: false,
//     maxHeight: 2000,
//     maxWidth: 2000,
//     quality: 0.8,
//   };

//   const videoOptions = {
//     mediaType: 'video',
//     videoQuality: 'medium',
//     durationLimit: 30, // 30 seconds
//   };

//   const takePicture = () => {
//     Alert.alert(
//       'Select Image',
//       'Choose an option',
//       [
//         { text: 'Camera', onPress: () => openCamera() },
//         { text: 'Gallery', onPress: () => openGallery() },
//         { text: 'Cancel', style: 'cancel' },
//       ]
//     );
//   };

//   const openCamera = () => {
//     launchCamera(cameraOptions, (response) => {
//       if (response.didCancel || response.errorMessage) {
//         return;
//       }
      
//       if (response.assets && response.assets[0]) {
//         const imageUri = response.assets[0].uri;
//         setCapsuleInfo(prevState => ({ ...prevState, fileUri: imageUri }));
//         setPhoto(imageUri);
//       }
//     });
//   };

//   const openGallery = () => {
//     launchImageLibrary(cameraOptions, (response) => {
//       if (response.didCancel || response.errorMessage) {
//         return;
//       }
      
//       if (response.assets && response.assets[0]) {
//         const imageUri = response.assets[0].uri;
//         setCapsuleInfo(prevState => ({ ...prevState, fileUri: imageUri }));
//         setPhoto(imageUri);
//       }
//     });
//   };

//   const recordVideo = () => {
//     Alert.alert(
//       'Record Video',
//       'Choose an option',
//       [
//         { text: 'Record Video', onPress: () => startVideoRecording() },
//         { text: 'Select from Gallery', onPress: () => selectVideoFromGallery() },
//         { text: 'Cancel', style: 'cancel' },
//       ]
//     );
//   };

//   const startVideoRecording = () => {
//     launchCamera(videoOptions, (response) => {
//       if (response.didCancel || response.errorMessage) {
//         return;
//       }
      
//       if (response.assets && response.assets[0]) {
//         const videoUri = response.assets[0].uri;
//         setVideoUri(videoUri);
//       }
//     });
//   };

//   const selectVideoFromGallery = () => {
//     launchImageLibrary(videoOptions, (response) => {
//       if (response.didCancel || response.errorMessage) {
//         return;
//       }
      
//       if (response.assets && response.assets[0]) {
//         const videoUri = response.assets[0].uri;
//         setVideoUri(videoUri);
//       }
//     });
//   };

//   const removePhoto = () => {
//     setPhoto(null);
//   };

//   const removeVideo = () => {
//     setVideoUri(null);
//   };

//   const createCapsule = async () => {
//     if (photo) {
//       console.log('test' + capsuleInfo);
//       try {
//         navigation.navigate('CapsuleCreationScreen');
//       } catch (error) {
//         console.error('Error navigating to capsule creation:', error);
//       }
//     } else {
//       Alert.alert('Photo Error', 'No valid photo provided.');
//     }
//   };

//   const navigateToSettings = () => {
//     navigation.navigate('SettingsScreen');
//   };

//   return (
//     <View style={styles.container}>
//       {!videoUri && !photo ? (
//         <View style={styles.mainContainer}>
//           {/* Header */}
//           <View style={styles.header}>
//             <TouchableOpacity style={styles.settingsIcon} onPress={navigateToSettings}>
//               <SimpleLineIcons name="settings" size={26} color="white" />
//             </TouchableOpacity>
//           </View>

//           {/* Main content area */}
//           <View style={styles.contentArea}>
//             <View style={styles.cameraPlaceholder}>
//               <Icon name="camera-alt" size={100} color="#666" />
//               <Text style={styles.placeholderText}>Camera Preview</Text>
//             </View>
//           </View>

//           {/* Bottom controls */}
//           <View style={styles.bottomControls}>
//             <TouchableOpacity style={styles.controlButton} onPress={recordVideo}>
//               <Icon name="videocam" size={30} color="white" />
//             </TouchableOpacity>
            
//             <TouchableOpacity style={styles.mainCameraButton} onPress={takePicture}>
//               <Icon name="camera" size={40} color="white" />
//             </TouchableOpacity>
            
//             <TouchableOpacity style={styles.controlButton} onPress={openGallery}>
//               <Icon name="photo-library" size={30} color="white" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       ) : photo ? (
//         <View style={styles.photoContainer}>
//           <Image source={{ uri: photo }} style={styles.fullScreenPhoto} />
          
//           {/* Close button */}
//           <TouchableOpacity style={styles.closeButton} onPress={removePhoto}>
//             <Ionicons name="close-circle" size={40} color="white" />
//           </TouchableOpacity>
          
//           {/* Create capsule button */}
//           <TouchableOpacity style={styles.button3} onPress={createCapsule}>
//             <Text style={styles.text}>Create Capsule</Text>
//             <FontAwesome name="arrow-right" size={24} color="white" style={styles.button4} />
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <View style={styles.videoContainer}>
//           <Video
//             source={{ uri: videoUri }}
//             style={styles.video}
//             controls={true}
//             resizeMode="contain"
//             repeat={true}
//           />
//           <TouchableOpacity style={styles.closeButton} onPress={removeVideo}>
//             <Ionicons name="close-circle" size={40} color="white" />
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'black',
//   },
//   mainContainer: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     alignItems: 'center',
//     paddingTop: 20,
//     paddingHorizontal: 20,
//     height: 80,
//   },
//   settingsIcon: {
//     padding: 10,
//   },
//   contentArea: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   cameraPlaceholder: {
//     width: '80%',
//     height: '60%',
//     backgroundColor: '#333',
//     borderRadius: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#666',
//     borderStyle: 'dashed',
//   },
//   placeholderText: {
//     color: '#666',
//     fontSize: 18,
//     marginTop: 10,
//   },
//   bottomControls: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     paddingBottom: 50,
//     paddingHorizontal: 20,
//   },
//   controlButton: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   mainCameraButton: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#6BAED6',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   photoContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     position: 'relative',
//     width: '100%',
//     height: '100%',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   fullScreenPhoto: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'contain',
//   },
//   closeButton: {
//     position: 'absolute',
//     top: 20,
//     left: 20,
//     zIndex: 1,
//   },
//   button3: {
//     position: 'absolute',
//     bottom: 20,
//     right: 20,
//     backgroundColor: '#6BAED6',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   button4: {
//     marginLeft: 10,
//   },
//   text: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: 'white',
//   },
//   videoContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     position: 'relative',
//     width: '100%',
//     height: '100%',
//   },
//   video: {
//     width: '100%',
//     height: '100%',
//   },
// });

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,    
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
// import useAuthService from '../hooks/useAuthService'
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');

const CameraScreen = () => {

   

  return (
    <View >
        <Text >Capture Moments. Revisit Memories.</Text>
      </View>
  );
};

export default CameraScreen;

const styles = StyleSheet.create({
 
});
