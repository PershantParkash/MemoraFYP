import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { MyContext } from '../context/MyContext';
import useCapsuleService from '../hooks/useCapsuleService';
import { useNavigation } from '@react-navigation/native';

const CapsuleCreationScreen = () => {
  const { handleCreateCapsule } = useCapsuleService();
  const context = useContext(MyContext);
  const { capsuleInfo, setCapsuleInfo } = context;
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capsuleType, setCapsuleType] = useState('Personal');
  const [unlockDate, setUnlockDate] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [fileUri, setFileUri] = useState(capsuleInfo?.fileUri || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!fileUri) {
      console.warn('No photo provided!');
    }
  }, [fileUri]);

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

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your capsule');
      return false;
    }
    if (!unlockDate) {
      Alert.alert('Date Required', 'Please select an unlock date');
      return false;
    }
    if (!fileUri) {
      Alert.alert('Image Required', 'Please add a photo');
      return false;
    }
    return true;
  };

  const CreateCapsule = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      setCapsuleInfo({
        ...capsuleInfo,
        title,
        description,
        unlockDate,
        capsuleType,
      });

      if (capsuleType === 'Personal') {
        await handleCreateCapsule({ title, description, unlockDate, capsuleType, fileUri });
        navigation.navigate('Tab');
      } else if (capsuleType === 'Shared') {
        navigation.navigate('SendCapsulePage');
      }
    } catch (error) {
      console.error('Capsule creation failed:', error);
      Alert.alert('Error', 'Failed to create capsule. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create a Time Capsule</Text>

      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />

      <View style={styles.picker}>
        <Text style={styles.label}>Capsule Type</Text>
        <View style={styles.toggleContainer}>
          {['Personal', 'Shared'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.toggleButton, capsuleType === type && styles.activeButton]}
              onPress={() => setCapsuleType(type)}
              disabled={isLoading}
            >
              <Text style={[styles.toggleButtonText, capsuleType === type && styles.activeButtonText]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.datePickerContainer}>
        <Text style={styles.label}>Unlock Date</Text>
        <TouchableOpacity onPress={showDatePicker} style={styles.button} disabled={isLoading}>
          <Text style={styles.buttonText}>
            {unlockDate ? moment(unlockDate).format('YYYY-MM-DD') : 'Select Date'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button3, isLoading && styles.disabledButton]}
        onPress={CreateCapsule}
        disabled={isLoading}
      >
        {isLoading ? (
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

      {isLoading && (
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  input: {
    width: '100%', height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 16, marginBottom: 12, fontSize: 16,
  },
  picker: { width: '100%', marginBottom: 12 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  toggleButton: {
    flex: 1, paddingVertical: 12, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f0f0f0', borderRadius: 8,
  },
  activeButton: { backgroundColor: '#6BAED6' },
  toggleButtonText: { fontSize: 16, color: '#333' },
  activeButtonText: { color: '#fff', fontWeight: 'bold' },
  datePickerContainer: { width: '100%', marginBottom: 20 },
  button: {
    height: 50, backgroundColor: '#6BAED6', justifyContent: 'center',
    alignItems: 'center', borderRadius: 8,
  },
  buttonText: { color: '#fff', fontSize: 16 },
  button3: {
    position: 'absolute', bottom: 20, right: 20, backgroundColor: '#6BAED6',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, flexDirection: 'row',
  },
  disabledButton: { backgroundColor: '#a0c8e0' },
  createButtonText: { color: '#fff', fontSize: 16 },
  button4: { marginLeft: 10 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  overlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: "white", justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  },
  loadingText: { marginTop: 10, fontSize: 16, color: '#333', fontWeight: '600' },
});

export default CapsuleCreationScreen;
