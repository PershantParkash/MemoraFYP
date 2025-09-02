import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import useAuthService from '../hooks/useAuthService';

const { height } = Dimensions.get('window');

const RegistrationStep2 = () => {
  const { registerUser, createProfile } = useAuthService();
  const [cnic, setCnic] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Error states for each field
  const [profilePicError, setProfilePicError] = useState('');
  const [cnicError, setCnicError] = useState('');
  const [contactNoError, setContactNoError] = useState('');
  const [dobError, setDobError] = useState('');
  const [genderError, setGenderError] = useState('');
  const [addressError, setAddressError] = useState('');

  const navigation = useNavigation();
  const route = useRoute();
  const { fullName, email, password } = route.params || {};

  // Clear error functions
  const handleCnicChange = (text) => {
    setCnic(text);
    if (cnicError) setCnicError('');
  };

  const handleContactChange = (text) => {
    setContactNo(text);
    if (contactNoError) setContactNoError('');
  };

  const handleAddressChange = (text) => {
    setAddress(text);
    if (addressError) setAddressError('');
  };

  const handleGenderChange = (value) => {
    setGender(value);
    if (genderError) setGenderError('');
  };

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setDob(formattedDate);
      if (dobError) setDobError('');
    }
  };

  const handlePickImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        Toast.show({
          type: 'info',
          text1: 'No Image Selected',
          text2: 'Please select an image to continue.',
        });
      } else if (response.errorMessage) {
        Toast.show({
          type: 'error',
          text1: 'Image Selection Error',
          text2: response.errorMessage,
        });
      } else if (response.assets && response.assets[0]) {
        setProfilePic(response.assets[0].uri);
        if (profilePicError) setProfilePicError('');
        Toast.show({
          type: 'success',
          text1: 'Image Selected',
          text2: 'Profile picture added successfully!',
        });
      }
    });
  };

  const handleRemoveImage = () => {
    setProfilePic('');
    Toast.show({
      type: 'info',
      text1: 'Image Removed',
      text2: 'Profile picture has been removed.',
    });
  };

  const validateFields = () => {
    let isValid = true;
    
    // Reset all errors
    setProfilePicError('');
    setCnicError('');
    setContactNoError('');
    setDobError('');
    setGenderError('');
    setAddressError('');

    // Profile picture validation
    if (!profilePic) {
      setProfilePicError('Please select your profile picture.');
      isValid = false;
    }

    // CNIC validation
    if (!cnic.trim()) {
      setCnicError('Please enter your CNIC.');
      isValid = false;
    } else if (!/^\d{13}$/.test(cnic)) {
      setCnicError('CNIC must be exactly 13 digits.');
      isValid = false;
    }

    // Contact number validation
    if (!contactNo.trim()) {
      setContactNoError('Please enter your contact number.');
      isValid = false;
    } else if (!/^\d{10,12}$/.test(contactNo)) {
      setContactNoError('Contact number must be between 10-12 digits.');
      isValid = false;
    }

    // Date of birth validation
    if (!dob.trim()) {
      setDobError('Please select your date of birth.');
      isValid = false;
    }

    // Gender validation
    if (!gender) {
      setGenderError('Please select your gender.');
      isValid = false;
    }

    // Address validation
    if (!address.trim()) {
      setAddressError('Please enter your address.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;

    setIsLoading(true);
    try {
      const registerData = await registerUser(email, password);
      const { token } = registerData;
      await AsyncStorage.setItem('authToken', token);

      if (token) {
        await createProfile(token, {
          fullName,
          cnic,
          dob,
          gender,
          address,
          contactNo,
          profilePic
        });
        
        Toast.show({
          type: 'success',
          text1: 'Registration Successful! 🎉',
          text2: 'Your profile has been created successfully.',
        });
        
        setTimeout(() => {
          navigation.navigate('Tab');
        }, 500);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.message || 'An unknown error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo} />
        <Text style={styles.tagline}>Complete Your Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={styles.formContainer}
      >
        <Text style={styles.welcomeText}>Personal Details</Text>
        <Text style={styles.subtitle}>Step 2 of 2: Finalize Your Account</Text>

        <View style={styles.profileSection}>
          {profilePic ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: profilePic }} style={styles.profileImage} />
              <TouchableOpacity style={styles.editImageButton} onPress={handlePickImage}>
                <Icon name="camera" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeButton} onPress={handleRemoveImage}>
                <Icon name="trash-outline" size={18} color="#fff" />
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.profileButton} onPress={handlePickImage}>
              <View style={[
                styles.profileImagePlaceholder,
                profilePicError ? styles.profileImageError : null
              ]}>
                <Icon name="person" size={40} color="#A0A0A0" />
              </View>
              <Text style={styles.profileButtonText}>Add Profile Picture</Text>
            </TouchableOpacity>
          )}
          {profilePicError ? (
            <Text style={styles.errorText}>{profilePicError}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>CNIC Number</Text>
          <TextInput
            style={[
              styles.input,
              cnicError ? styles.inputError : null
            ]}
            placeholder="Enter 13-digit CNIC"
            placeholderTextColor="#A9A9A9"
            keyboardType="numeric"
            maxLength={13}
            value={cnic}
            onChangeText={handleCnicChange}
          />
          {cnicError ? (
            <Text style={styles.errorText}>{cnicError}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contact Number</Text>
          <TextInput
            style={[
              styles.input,
              contactNoError ? styles.inputError : null
            ]}
            placeholder="Enter contact number"
            placeholderTextColor="#A9A9A9"
            keyboardType="phone-pad"
            value={contactNo}
            onChangeText={handleContactChange}
          />
          {contactNoError ? (
            <Text style={styles.errorText}>{contactNoError}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity
            style={[
              styles.datePickerButton,
              dobError ? styles.inputError : null
            ]}
            onPress={() => setShowPicker(true)}
          >
            <Text style={dob ? styles.dateText : styles.placeholderText}>
              {dob || 'Select date of birth'}
            </Text>
          </TouchableOpacity>
          {dobError ? (
            <Text style={styles.errorText}>{dobError}</Text>
          ) : null}
          {showPicker && (
            <DateTimePicker
              value={dob ? new Date(dob) : new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Gender</Text>
          <View style={[
            styles.pickerContainer,
            genderError ? styles.inputError : null
          ]}>
            <Picker
              selectedValue={gender}
              onValueChange={handleGenderChange}
              style={styles.picker}
            >
              <Picker.Item label="Select gender" value="" color="#A9A9A9" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
          {genderError ? (
            <Text style={styles.errorText}>{genderError}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[
              styles.input, 
              styles.addressInput,
              addressError ? styles.inputError : null
            ]}
            placeholder="Enter your full address"
            placeholderTextColor="#A9A9A9"
            value={address}
            onChangeText={handleAddressChange}
            multiline
          />
          {addressError ? (
            <Text style={styles.errorText}>{addressError}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Creating Account...' : 'Complete Registration'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('RegistrationStep1')}
        >
          <Text style={styles.backButtonText}>Go Back to Step 1</Text>
        </TouchableOpacity>
      </ScrollView>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: height,
    backgroundColor: '#2E86C1',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 83,
    resizeMode: 'contain',
  },
  tagline: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    fontStyle: 'italic',
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F618D',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileButton: {
    alignItems: 'center',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#2E86C1',
    borderStyle: 'dashed',
  },
  // Error style for profile image placeholder
  profileImageError: {
    borderColor: '#FF3B30',
    borderStyle: 'solid',
  },
  imageContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  editImageButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#2E86C1',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    color: '#2E86C1',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  removeButton: {
    flexDirection: 'row',
    backgroundColor: '#ff4c4c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 12,
  },
  inputContainer: {
    marginBottom: 12,
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F9F9F9',
    fontSize: 16,
    color: '#333',
  },
  // Error styles for inputs
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  addressInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  datePickerButton: {
    height: 50,
    width: '100%',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#A9A9A9',
  },
  pickerContainer: {
    paddingHorizontal: 10,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    height: 50,
    justifyContent: 'center',
    fontSize: 10,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  // Error text style
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#2E86C1',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  orText: {
    marginHorizontal: 10,
    color: '#888',
    fontWeight: '500',
  },
  backButton: {
    width: '100%',
    height: 50,
    borderColor: '#2E86C1',
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 50,
  },
  backButtonText: {
    color: '#2E86C1',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegistrationStep2;