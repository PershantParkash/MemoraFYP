import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import Config from 'react-native-config';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import useProfileService from '../hooks/useProfileService';
import { MyContext } from '../context/MyContext';

const EditProfileScreen = () => {
  const { updateUserProfile, fetchProfileData } = useProfileService();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileChanged, setProfileChanged] = useState(false);
  
  const navigation = useNavigation();
  const { userDetails, setUserDetails } = useContext(MyContext);
  const [profileData, setProfileData] = useState({ ...userDetails });

  useEffect(() => {
    const getProfileData = async () => {
      const response = await fetchProfileData();
      setUserDetails(response);
      setProfileData(response);
      setLoading(false);
    };

    getProfileData();
  }, []);

  const validateFields = () => {
    if (!profileData.cnic.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter your CNIC.',
      });
      return false;
    }
    if (!/^\d{13}$/.test(profileData.cnic)) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'CNIC must be 13 digits.',
      });
      return false;
    }
    if (!profileData.contactNo.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter your contact number.',
      });
      return false;
    }
    if (!/^\d{10,15}$/.test(profileData.contactNo)) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Contact number must be between 10-15 digits.',
      });
      return false;
    }
    if (!profileData.gender) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select your gender.',
      });
      return false;
    }
    if (!profileData.address.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter your address.',
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateFields()) return;
    setIsSubmitting(true);

    try {
      await updateUserProfile(profileData, profileChanged);
      setUserDetails(profileData);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully.',
      });
      navigation.navigate('CameraScreen');
    } catch (error) {
      const message = error?.response?.data?.message || 'An unknown error occurred.';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
      if (result.didCancel) return;

      const uri = result.assets[0].uri;
      setProfileData({ ...profileData, profilePicture: uri });
      setProfileChanged(true);
      
      Toast.show({
        type: 'success',
        text1: 'Image Selected',
        text2: 'Profile picture updated successfully.',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select image.',
      });
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setProfileData({ ...profileData, dob: formattedDate });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6BAED6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.profileSection}>
        <TouchableOpacity
          style={styles.profilePicContainer}
          onPress={handlePickImage}
          disabled={isSubmitting}
        >
          <Image
            source={
              profileData.profilePicture?.startsWith('file')
                ? { uri: profileData.profilePicture }
                : { uri: `${Config.API_BASE_URL}/uploads/${profileData.profilePicture}` }
            }
            style={styles.profilePic}
          />
          <View style={styles.editOverlay}>
            <Text style={styles.editText}>✏️</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.profileHint}>Tap to change photo</Text>
      </View>

      
      <View style={styles.formSection}>
        <InputField
          label="Username"
          value={profileData.username}
          onChangeText={(text) => setProfileData({ ...profileData, username: text })}
          editable={!isSubmitting}
        />

        <InputField
          label="Bio"
          value={profileData.bio}
          onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
          multiline
          editable={!isSubmitting}
          placeholder="Tell us about yourself..."
        />

        <InputField
          label="CNIC"
          value={profileData.cnic}
          keyboardType="numeric"
          maxLength={13}
          onChangeText={(text) => setProfileData({ ...profileData, cnic: text })}
          editable={!isSubmitting}
          placeholder="13-digit CNIC number"
        />

        <InputField
          label="Contact Number"
          value={profileData.contactNo}
          keyboardType="phone-pad"
          onChangeText={(text) => setProfileData({ ...profileData, contactNo: text })}
          editable={!isSubmitting}
          placeholder="Your phone number"
        />

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Date of Birth</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateInput, isSubmitting && styles.disabledInput]}
            onPress={() => !isSubmitting && setShowDatePicker(true)}
            disabled={isSubmitting}
          >
            <Text style={[styles.dateText, !profileData.dob && styles.placeholderText]}>
              {profileData.dob
                ? new Date(profileData.dob).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Select your date of birth'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={profileData.dob ? new Date(profileData.dob) : new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Gender</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={profileData.gender}
              onValueChange={(value) => setProfileData({ ...profileData, gender: value })}
              enabled={!isSubmitting}
              style={styles.picker}
            >
              <Picker.Item label="Select Gender" value="" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>

        <InputField
          label="Address"
          value={profileData.address}
          onChangeText={(text) => setProfileData({ ...profileData, address: text })}
          multiline
          editable={!isSubmitting}
          placeholder="Your complete address..."
        />
      </View>

     
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.disabledButton]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      
      <Toast />
    </ScrollView>
  );
};

const InputField = ({ 
  label, 
  value, 
  onChangeText, 
  multiline, 
  editable = true, 
  placeholder,
  ...props 
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        multiline && styles.textArea,
        !editable && styles.disabledInput,
      ]}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      editable={editable}
      placeholder={placeholder}
      placeholderTextColor="#aaa"
      textAlignVertical={multiline ? 'top' : 'center'}
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#fff',
    marginBottom: 1,
  },
  profilePicContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profilePic: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#f0f0f0',
    borderWidth: 3,
    borderColor: '#6BAED6',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#6BAED6',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editText: {
    fontSize: 14,
  },
  profileHint: {
    fontSize: 14,
    color: '#6BAED6',
    fontWeight: '500',
  },
  formSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  textArea: {
    height: 90,
    paddingTop: 12,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#888',
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#aaa',
  },
  pickerWrapper: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    overflow: 'hidden',
  },
  buttonSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#6BAED6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#6BAED6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: '#a0c8e0',
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default EditProfileScreen;