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
  Dimensions,
} from 'react-native';

import Config from 'react-native-config';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import useProfileService from '../hooks/useProfileService';
import { MyContext } from '../context/MyContext';

import Icon from 'react-native-vector-icons/Ionicons';
const { width } = Dimensions.get('window');

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
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#667EEA" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          
          <View style={styles.headerGradient}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="chevron-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            {/* <Text style={styles.headerSubtitle}>Update your information</Text> */}
          </View>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.profilePicContainer}
            onPress={handlePickImage}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <View style={styles.profilePicWrapper}>
              <Image
                source={
                  profileData.profilePicture?.startsWith('file')
                    ? { uri: profileData.profilePicture }
                    : { uri: `${Config.API_BASE_URL}/uploads/${profileData.profilePicture}` }
                }
                style={styles.profilePic}
              />
              <View style={styles.editOverlay}>
                <View style={styles.cameraIcon}>
                  <Text style={styles.cameraText}>📷</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.profileHint}>Tap to update photo</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <InputField
            label="Username"
            value={profileData.username}
            onChangeText={(text) => setProfileData({ ...profileData, username: text })}
            editable={!isSubmitting}
            // icon="👤"
          />

          <InputField
            label="Bio"
            value={profileData.bio}
            onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
            multiline
            editable={!isSubmitting}
            placeholder="Tell us about yourself..."
            // icon="📝"
          />

          <InputField
            label="CNIC"
            value={profileData.cnic}
            keyboardType="numeric"
            maxLength={13}
            onChangeText={(text) => setProfileData({ ...profileData, cnic: text })}
            editable={!isSubmitting}
            placeholder="13-digit CNIC number"
            // icon="🆔"
          />

          <InputField
            label="Contact Number"
            value={profileData.contactNo}
            keyboardType="phone-pad"
            onChangeText={(text) => setProfileData({ ...profileData, contactNo: text })}
            editable={!isSubmitting}
            placeholder="Your phone number"
            // icon="📱"
          />

          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              {/* <Text style={styles.iconLabel}>📅</Text> */}
              <Text style={styles.inputLabel}>Date of Birth</Text>
            </View>
            <TouchableOpacity
              style={[styles.input, styles.dateInput, isSubmitting && styles.disabledInput]}
              onPress={() => !isSubmitting && setShowDatePicker(true)}
              disabled={isSubmitting}
              activeOpacity={0.7}
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
            <View style={styles.labelContainer}>
              {/* <Text style={styles.iconLabel}>⚧</Text> */}
              <Text style={styles.inputLabel}>Gender</Text>
            </View>
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
            // icon="🏠"
          />
        </View>

        {/* Save Button Section */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.disabledButton]}
            onPress={handleSave}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <View style={styles.loadingButtonContent}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.loadingButtonText}>Saving...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
                <Text style={styles.buttonIcon}>✨</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Toast />
    </View>
  );
};

const InputField = ({ 
  label, 
  value, 
  onChangeText, 
  multiline, 
  editable = true, 
  placeholder,
  icon,
  ...props 
}) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelContainer}>
      {icon && <Text style={styles.iconLabel}>{icon}</Text>}
      <Text style={styles.inputLabel}>{label}</Text>
    </View>
    <View style={styles.inputWrapper}>
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
        placeholderTextColor="#A0A3BD"
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 20,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#6BAED6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6BAED6',
    fontWeight: '600',
  },
  headerSection: {
    height: 140,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    backgroundColor: '#6BAED6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom:"20px"
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom:"5px"
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -30,
    borderRadius: 20,
    shadowColor: '#6BAED6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  profilePicContainer: {
    marginBottom: 15,
  },
  profilePicWrapper: {
    position: 'relative',
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F3FF',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#6BAED6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  cameraIcon: {
    backgroundColor: '#6BAED6',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#6BAED6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  cameraText: {
    fontSize: 16,
  },
  profileHint: {
    fontSize: 14,
    color: '#6BAED6',
    fontWeight: '600',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 30,
    shadowColor: '#6BAED6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 25,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#F8F9FF',
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    color: '#2D3436',
    borderWidth: 2,
    borderColor: 'transparent',
    fontWeight: '500',
  },
  textArea: {
    height: 100,
    paddingTop: 15,
  },
  disabledInput: {
    backgroundColor: '#F1F2F6',
    color: '#A0A3BD',
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#2D3436',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#A0A3BD',
  },
  pickerWrapper: {
    backgroundColor: '#F8F9FF',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#2D3436',
  },
  buttonSection: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
  },
  saveButton: {
    backgroundColor: '#6BAED6',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#6BAED6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginRight: 8,
  },
  buttonIcon: {
    fontSize: 16,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#B2C3F7',
    shadowOpacity: 0,
    elevation: 0,
  },
  backButton: {
    position:"absolute",
    top:20,
    left:20,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EditProfileScreen;