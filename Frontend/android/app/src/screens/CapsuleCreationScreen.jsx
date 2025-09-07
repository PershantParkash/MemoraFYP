import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  FlatList,
  Linking,
} from 'react-native';
import Toast from 'react-native-toast-message';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MyContext } from '../context/MyContext';
import useCapsuleService from '../hooks/useCapsuleService';
import useNestedCapsuleService from '../hooks/useNestedCapsuleService';
import { useNavigation } from '@react-navigation/native';
import axiosInstance from '../api/axiosInstance';
import { getCurrentLocation } from '../hooks/requestLocationPermission';

const CapsuleCreationScreen = () => {
  const { handleCreateCapsule, getFileType, loading } = useCapsuleService();
  const { handleCreateNestedCapsule } = useNestedCapsuleService();
  const context = useContext(MyContext);
  const { capsuleInfo, setCapsuleInfo } = context; 
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capsuleType, setCapsuleType] = useState('Personal');
  const [unlockDate, setUnlockDate] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [fileUri, setFileUri] = useState(capsuleInfo?.fileUri || null);
  const [friends, setFriends] = useState([]);
  const [isCheckingFriends, setIsCheckingFriends] = useState(false);

  // Nested Capsule States
  const [isNestedCapsule, setIsNestedCapsule] = useState(false);
  const [parentCapsules, setParentCapsules] = useState([]);
  const [selectedParentCapsule, setSelectedParentCapsule] = useState(null);
  const [isParentCapsuleModalVisible, setIsParentCapsuleModalVisible] = useState(false);
  const [isLoadingParentCapsules, setIsLoadingParentCapsules] = useState(false);
  const [location, setLocation] = useState(null);

  // Emotional Connection Modal States
  const [isEmotionalModalVisible, setIsEmotionalModalVisible] = useState(false);
  const [emotionalText, setEmotionalText] = useState('');

  useEffect(() => {
    if (!fileUri) {
      console.warn('No photo provided!');
    }
  }, [fileUri]);

  useEffect(() => {
    if (capsuleType === 'Shared') {
      checkFriends();
    }
  }, [capsuleType]);

  useEffect(() => {
    if (isNestedCapsule) {
      fetchParentCapsules();
    }
  }, [isNestedCapsule]);

  const fetchParentCapsules = async () => {
    setIsLoadingParentCapsules(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setIsLoadingParentCapsules(false);
        return;
      }

      const response = await axiosInstance.get('/api/timecapsules/getLoginUserCapsules', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.capsules) {
        const personalCapsules = response.data.capsules.filter(capsule => !capsule.IsShared);
        setParentCapsules(personalCapsules);
      } else {
        setParentCapsules([]);
      }
    } catch (error) {
      console.error('Error fetching parent capsules:', error);
      setParentCapsules([]);
    } finally {
      setIsLoadingParentCapsules(false);
    }
  };

  const checkFriends = async () => {
    setIsCheckingFriends(true);
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      setIsCheckingFriends(false);
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
        setFriends(data.friends);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
    } finally {
      setIsCheckingFriends(false);
    }
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirm = (date) => {
    if (date <= new Date()) {
      Alert.alert('Invalid Date', 'Unlock date must be in the future');
    } else {
      setUnlockDate(date);
      hideDatePicker();
    }
  };

  const openEmotionalModal = () => {
    setIsEmotionalModalVisible(true);
  };

  const closeEmotionalModal = () => {
    setIsEmotionalModalVisible(false);
    setEmotionalText('');
  };

  const saveEmotionalConnection = () => {
    console.log('Saving emotional connection:', {
      emotionalText: emotionalText?.trim()
    });
    
    if (emotionalText.trim()) {
      setDescription(emotionalText);
      closeEmotionalModal();
    } else {
      Alert.alert('Error', 'Please provide content before saving');
    }
  };

  const openParentCapsuleModal = () => {
    setIsParentCapsuleModalVisible(true);
  };

  const closeParentCapsuleModal = () => {
    setIsParentCapsuleModalVisible(false);
  };

  const selectParentCapsule = (capsule) => {
    setSelectedParentCapsule(capsule);
    closeParentCapsuleModal();
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your capsule');
      return false;
    }
    if (!isNestedCapsule && !unlockDate) {
      Alert.alert('Date Required', 'Please select an unlock date');
      return false;
    }
    if (isNestedCapsule && !selectedParentCapsule) {
      Alert.alert('Parent Capsule Required', 'Please select a parent capsule');
      return false;
    }
    if (!fileUri) {
      Alert.alert('File Required', 'Please add a file');
      return false;
    }
    if (capsuleType === 'Shared' && friends.length === 0) {
      Alert.alert('No Friends', 'You need to add friends before creating a shared capsule');
      return false;
    }
    return true;
  };

const CreateCapsule = async () => {
  if (!validateForm()) return;

  try {
    // Get location first (for non-nested capsules)
    let currentLocation = null;
    if (!isNestedCapsule) {
      try {
        console.log('Getting current location...');
        currentLocation = await getCurrentLocation();
        if (currentLocation?.lat && currentLocation?.lng) {
          setLocation(currentLocation);
          Toast.show({
            type: 'success',
            text1: 'Location Found',
            text2: `Lat: ${currentLocation.lat.toFixed(6)}, Lng: ${currentLocation.lng.toFixed(6)}`,
          });
        }
      } catch (locationError) {
        console.error('Error getting location:', locationError);
        Toast.show({
          type: 'warning',
          text1: 'Location Warning',
          text2: 'Could not get location. Proceeding without location data.',
        });
      }
    }

    // Prepare form data
    const formData = new FormData();
    
    // Add basic capsule information
    formData.append('title', title);
    
    // Only add description if it's not empty (to match your curl example)
    if (description && description.trim()) {
      formData.append('description', description);
    }
    
    formData.append('capsuleType', capsuleType);
    
    // Add nested capsule specific data
    if (isNestedCapsule && selectedParentCapsule) {
      formData.append('parentCapsuleId', selectedParentCapsule._id);
      console.log('Adding parentCapsuleId:', selectedParentCapsule._id);
    }
    
    // Add unlock date for non-nested capsules
    if (!isNestedCapsule && unlockDate) {
      formData.append('unlockDate', moment(unlockDate).format('YYYY-MM-DD'));
    }

    // Add location data if available (for non-nested capsules)
    if (!isNestedCapsule && currentLocation?.lat && currentLocation?.lng) {
      formData.append('lat', currentLocation.lat.toString());
      formData.append('lng', currentLocation.lng.toString());
    }

    // Handle file upload - SIMPLIFIED AND CONSISTENT
    let fileToUpload = null;
    let mediaTypeToUse = 'photo'; // default

    if (capsuleInfo?.fileUri) {
      fileToUpload = capsuleInfo.fileUri;
      mediaTypeToUse = capsuleInfo.mediaType || 'photo';
    } else if (fileUri) {
      fileToUpload = fileUri;
      mediaTypeToUse = 'photo'; // fallback for backward compatibility
    }

    if (!fileToUpload) {
      console.error('No file provided');
      Alert.alert('Error', 'Please select a file for the capsule.');
      return;
    }

    // Add the file
    const fileName = fileToUpload.split('/').pop();
    const fileType = getFileType(fileToUpload, mediaTypeToUse);

    formData.append('files', {
      uri: fileToUpload,
      name: fileName || 'uploaded_file',
      type: fileType,
    });

    // Add mediaType only for nested capsules (if needed by backend)
    if (isNestedCapsule) {
      formData.append('mediaType', mediaTypeToUse);
    }

    console.log('Uploading media file:', {
      fileName,
      fileType,
      mediaType: mediaTypeToUse,
      isNestedCapsule
    });

    // Debug: Log FormData contents
    console.log('FormData contents:');
    if (formData._parts) {
      for (let [key, value] of formData._parts) {
        if (key === 'files') {
          console.log(`${key}:`, { uri: value.uri, name: value.name, type: value.type });
        } else {
          console.log(`${key}:`, value);
        }
      }
    }

    // Update context
    setCapsuleInfo({
      ...capsuleInfo,
      title,
      description,
      unlockDate: isNestedCapsule ? null : unlockDate,
      capsuleType,
      fileUri: fileToUpload,
      location: currentLocation,
      parentCapsuleId: isNestedCapsule ? selectedParentCapsule._id : null,
    });

    // Create the appropriate capsule type
    if (isNestedCapsule) {
      console.log('Creating nested capsule with parentCapsuleId:', selectedParentCapsule._id);
      const response = await handleCreateNestedCapsule(formData);
      
      if (response) {
        Toast.show({
          type: 'success',
          text1: 'Nested Capsule Created Successfully!',
          text2: 'Your nested capsule has been created.',
        });
        setTimeout(() => {
          navigation.navigate('Tab');
        }, 500);
      }
    } else if (capsuleType === 'Personal' || capsuleType === 'Public') {
      const response = await handleCreateCapsule(formData);
      
      if (response) {
        Toast.show({
          type: 'success',
          text1: 'Capsule Created Successfully!',
          text2: 'Your time capsule has been created.',
        });
        setTimeout(() => {
          navigation.navigate('Tab');
        }, 500);
      }
    } else if (capsuleType === 'Shared') {
      navigation.navigate('SendCapsulePage');
    }

  } catch (error) {
    console.error('Capsule creation failed:', error);
    console.error('Error details:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to create capsule. Try again.';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    Alert.alert('Error', errorMessage);
  }
};

const isCreateButtonDisabled = () => {
    return loading ||
      isCheckingFriends ||
      (capsuleType === 'Shared' && friends.length === 0) ||
      (isNestedCapsule && !selectedParentCapsule);
  };

  const renderEmotionalModal = () => (
    <Modal
      visible={isEmotionalModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeEmotionalModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Emotional Connection</Text>
            <TouchableOpacity onPress={closeEmotionalModal}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.textInputContainer}>
            <Text style={styles.inputLabel}>Write your emotional message:</Text>
            <TextInput
              style={styles.multilineInput}
              placeholder="Share your feelings, memories, or thoughts..."
              value={emotionalText}
              onChangeText={setEmotionalText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeEmotionalModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, !emotionalText.trim() && styles.disabledSaveButton]} 
                onPress={saveEmotionalConnection}
                disabled={!emotionalText.trim()}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderParentCapsuleModal = () => (
    <Modal
      visible={isParentCapsuleModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeParentCapsuleModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Parent Capsule</Text>
            <TouchableOpacity onPress={closeParentCapsuleModal}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {isLoadingParentCapsules ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6BAED6" />
              <Text style={styles.loadingText}>Loading parent capsules...</Text>
            </View>
          ) : (
            <FlatList
              data={parentCapsules}
              keyExtractor={(item) => item._id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.parentCapsuleItem}
                  onPress={() => selectParentCapsule(item)}
                >
                  <Text style={styles.parentCapsuleTitle}>{item.Title}</Text>
                  <Text style={styles.parentCapsuleDescription}>
                    {item.Description || 'No emotional connection message'}
                  </Text>
                  <Text style={styles.parentCapsuleDate}>
                    Unlock Date: {moment(item.UnlockDate).format('YYYY-MM-DD')}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <Text style={styles.noCapsulesText}>No personal capsules found.</Text>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Create a Time Capsule</Text>
     
      {location && (
        <Text style={styles.locationText}>
          Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </Text>
      )}

      <TextInput 
        style={styles.input} 
        placeholder="Title" 
        value={title} 
        onChangeText={setTitle}
        editable={!loading}
      />
      
      <TouchableOpacity 
        style={styles.emotionalButton} 
        onPress={openEmotionalModal}
        disabled={loading}
      >
        <Ionicons name="heart-outline" size={20} color="#6BAED6" />
        <Text style={styles.emotionalButtonText}>
          {description ? 'Emotional Connection Added' : 'Add Emotional Connection'}
        </Text>
        {description && <Ionicons name="checkmark-circle" size={20} color="#52C41A" />}
      </TouchableOpacity>

      {/* <View style={styles.picker}>
        <Text style={styles.label}>Capsule Type</Text>
        <View style={styles.toggleContainer}>
          {['Personal', 'Shared', 'Nested', 'Public'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.toggleButton, capsuleType === type && styles.activeButton]}
              onPress={() => {
                setCapsuleType(type);
                if (type === 'Nested') {
                  setIsNestedCapsule(true);
                  openParentCapsuleModal();
                } else {
                  setIsNestedCapsule(false);
                  setSelectedParentCapsule(null);
                }
              }}
              disabled={loading || isCheckingFriends || (type === 'Nested' && isLoadingParentCapsules)}
            >
              <Text style={[styles.toggleButtonText, capsuleType === type && styles.activeButtonText]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {capsuleType === 'Shared' && isCheckingFriends && (
          <Text style={styles.checkingText}>Checking friends...</Text>
        )}
        {capsuleType === 'Shared' && !isCheckingFriends && friends.length === 0 && (
          <Text style={styles.noFriendsText}>No friends found. Add friends to create shared capsules.</Text>
        )}
        {isNestedCapsule && isLoadingParentCapsules && (
          <Text style={styles.checkingText}>Loading parent capsules...</Text>
        )}
        {isNestedCapsule && !isLoadingParentCapsules && parentCapsules.length === 0 && (
          <Text style={styles.noCapsulesText}>No personal capsules found to nest under.</Text>
        )}
      </View> */}
      <View style={styles.picker}>
  <Text style={styles.label}>Capsule Type</Text>
  <View style={styles.toggleContainer}>
    {['Personal', 'Shared', 'Nested', 'Public'].map((type) => (
      <TouchableOpacity
        key={type}
        style={[
          styles.toggleButton,
          capsuleType === type && styles.activeButton,
        ]}
        onPress={() => {
          setCapsuleType(type);
          if (type === 'Nested') {
            setIsNestedCapsule(true);
            openParentCapsuleModal();
          } else {
            setIsNestedCapsule(false);
            setSelectedParentCapsule(null);
          }
        }}
        disabled={
          loading ||
          isCheckingFriends ||
          (type === 'Nested' && isLoadingParentCapsules)
        }
      >
        <Text
          style={[
            styles.toggleButtonText,
            capsuleType === type && styles.activeButtonText,
          ]}
        >
          {type}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>


      {isNestedCapsule && selectedParentCapsule && (
        <View style={styles.selectedParentCapsuleInfo}>
          <Text style={styles.selectedParentCapsuleTitle}>Selected Parent Capsule: </Text>
         
          <Text style={styles.selectedParentCapsuleDetails}>
            Title: {selectedParentCapsule.Title}
          </Text>
          <Text style={styles.selectedParentCapsuleDetails}>
            Emotional connection message: {selectedParentCapsule.Description || 'No emotional connection message'}
          </Text>
          <Text style={styles.selectedParentCapsuleDetails}>
            Unlock Date: {moment(selectedParentCapsule.UnlockDate).format('YYYY-MM-DD')}
          </Text>
        </View>
      )}

      {!isNestedCapsule && (
        <View style={styles.datePickerContainer}>
          <Text style={styles.label}>Unlock Date</Text>
          <TouchableOpacity 
            onPress={showDatePicker} 
            style={styles.button} 
            disabled={loading || isCheckingFriends}
          >
            <Text style={styles.buttonText}>
              {unlockDate ? moment(unlockDate).format('YYYY-MM-DD') : 'Select Date'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button3, isCreateButtonDisabled() && styles.disabledButton]}
        onPress={CreateCapsule}
        disabled={isCreateButtonDisabled()}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.createButtonText}>Creating...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.createButtonText}>Create Capsule</Text>
            <FontAwesome name="arrow-right" size={24} color="white" style={styles.button4} />
          </>
        )}
      </TouchableOpacity>

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#6BAED6" />
          <Text style={styles.loadingText}>Creating your time capsule...</Text>
        </View>
      )}

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        minimumDate={new Date(Date.now() + 86400000)}
      />

      {renderEmotionalModal()}
      {renderParentCapsuleModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 16,
    paddingBottom: 100 
  },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  locationText: { fontSize: 12, color: '#666', marginBottom: 10 },
  input: {
    width: '100%', height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 16, marginBottom: 12, fontSize: 16,
  },
  emotionalButton: {
    width: '100%', height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 12,
  },
  emotionalButtonText: {
    flex: 1, marginLeft: 10, fontSize: 16, color: '#333',
  },
  picker: { width: '100%', marginBottom: 12,},
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  // toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  // toggleButton: {
  //   flex: 1, paddingVertical: 12, justifyContent: 'center', alignItems: 'center',
  //   backgroundColor: '#f0f0f0', borderRadius: 8,
  // },
  // activeButton: { backgroundColor: '#6BAED6' },
  // toggleButtonText: { fontSize: 16, color: '#333' },
  // activeButtonText: { color: '#fff', fontWeight: 'bold' },
  toggleContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',         // ✅ allows wrapping to next row
  justifyContent: 'space-between',
  gap: 10,                  // space between buttons
},
toggleButton: {
  flexBasis: '48%',         // ✅ ensures 2 buttons per row
  paddingVertical: 12,
  borderRadius: 8,
  backgroundColor: '#eee',
  alignItems: 'center',
},
activeButton: {
  backgroundColor: '#42A7C3',
},
toggleButtonText: {
  color: '#333',
  fontWeight: '500',
},
activeButtonText: {
  color: '#fff',
},
  checkingText: { marginTop: 8, fontSize: 14, color: '#6BAED6', textAlign: 'center' },
  noFriendsText: { marginTop: 8, fontSize: 14, color: '#ff6b6b', textAlign: 'center' },
  noCapsulesText: { marginTop: 10, fontSize: 14, color: '#ff6b6b', textAlign: 'center' },
  datePickerContainer: { width: '100%', marginBottom: 20 },
  button: {
    height: 50, backgroundColor: '#6BAED6', justifyContent: 'center',
    alignItems: 'center', borderRadius: 8,
  },
  buttonText: { color: '#fff', fontSize: 16 },
  button3: {
    position: 'absolute', bottom: 20, right: 20, backgroundColor: '#6BAED6',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, flexDirection: 'row',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: { backgroundColor: '#a0c8e0' },
  createButtonText: { color: '#fff', fontSize: 16 },
  button4: { marginLeft: 10 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  overlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)", justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  },
  loadingText: { marginTop: 10, fontSize: 16, color: '#333', fontWeight: '600' },
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
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  textInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  multilineInput: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#6BAED6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  disabledSaveButton: {
    backgroundColor: '#a0c8e0',
  },
  selectedParentCapsuleInfo: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  selectedParentCapsuleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  selectedParentCapsuleDetails: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  parentCapsuleItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  parentCapsuleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  parentCapsuleDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  parentCapsuleDate: {
    fontSize: 12,
    color: '#888',
  },
});

export default CapsuleCreationScreen;