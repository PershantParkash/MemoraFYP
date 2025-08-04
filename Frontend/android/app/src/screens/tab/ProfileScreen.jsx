import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
 
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { MyContext } from '../../context/MyContext';
import useProfileService from '../../hooks/useProfileService';
import useBackButtonHandler from '../../hooks/useBackButtonHandler';
import Config from 'react-native-config';
import { useNavigationContext } from '../../context/NavigationContext';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const { fetchProfileData } = useProfileService();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const context = useContext(MyContext);
  const { userDetails, setUserDetails } = context;
  const { addToHistory } = useNavigationContext();
  
  // Use custom back button handler
  useBackButtonHandler();
  
  // Track navigation history
  useFocusEffect(
    React.useCallback(() => {
      addToHistory('profile');
    }, [addToHistory])
  );

  const goToEditProfile = () => {
    navigation.navigate('EditProfileScreen');
  };

  useEffect(() => {
    const getProfileData = async () => {
      const response = await fetchProfileData();
      setUserDetails(response);
      setLoading(false);
    };

    getProfileData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FCFF" />
        <ActivityIndicator size="large" color="#6BAED6" />
        <Text style={styles.loadingText}>Loading your memories...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#6BAED6" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: `${Config.API_BASE_URL}/uploads/${userDetails.profilePicture}`,
            }}
            style={styles.profileImage}
          />
        </View>

        <Text style={styles.username}>{userDetails.username}</Text>
        <View style={styles.bioContainer}>
          <Text style={styles.bio}>{userDetails.bio || 'No bio added yet'}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={20} color="#6BAED6" />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>

         
          <View style={[styles.detailRow, styles.borderBottom]}>
            <View style={styles.labelContainer}>
              <Ionicons name="call-outline" size={18} color="#6BAED6" style={styles.itemIcon} />
              <Text style={styles.detailLabel}>Contact</Text>
            </View>
            <Text style={styles.detailValue}>{userDetails.contactNo}</Text>
          </View>

          
          <View style={[styles.detailRow, styles.borderBottom]}>
            <View style={styles.labelContainer}>
              <Ionicons name="card-outline" size={18} color="#6BAED6" style={styles.itemIcon} />
              <Text style={styles.detailLabel}>CNIC</Text>
            </View>
            <Text style={styles.detailValue}>{userDetails.cnic}</Text>
          </View>

         
          <View style={[styles.detailRow, styles.borderBottom]}>
            <View style={styles.labelContainer}>
              <Ionicons name="calendar-outline" size={18} color="#6BAED6" style={styles.itemIcon} />
              <Text style={styles.detailLabel}>Birthday</Text>
            </View>
            <Text style={styles.detailValue}>
              {new Date(userDetails.dob).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>

         
          <View style={[styles.detailRow, styles.borderBottom]}>
            <View style={styles.labelContainer}>
              <Ionicons
                name={userDetails.gender === 'male' ? 'male-outline' : 'female-outline'}
                size={18}
                color="#6BAED6"
                style={styles.itemIcon}
              />
              <Text style={styles.detailLabel}>Gender</Text>
            </View>
            <Text style={styles.detailValue}>
              {userDetails.gender.charAt(0).toUpperCase() + userDetails.gender.slice(1)}
            </Text>
          </View>

         
          <View style={styles.detailRow}>
            <View style={styles.labelContainer}>
              <Ionicons name="location-outline" size={18} color="#6BAED6" style={styles.itemIcon} />
              <Text style={styles.detailLabel}>Address</Text>
            </View>
            <Text style={styles.detailValue}>{userDetails.address}</Text>
          </View>
        </View>

        
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={goToEditProfile} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CameraScreen')}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Create Memory</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FCFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FCFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6BAED6',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#6BAED6',
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  imageContainer: {
    marginTop: 20,
    padding: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 14,
    letterSpacing: 0.3,
  },
  bioContainer: {
    marginTop: 6,
    paddingHorizontal: 30,
    width: '100%',
    alignItems: 'center',
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  contentContainer: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: 'rgba(107, 174, 214, 0.4)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8F4FC',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
    maxWidth: width * 0.45,
    textAlign: 'right',
  },
  actionsContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6BAED6',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#6BAED6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  createButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4A89B8',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#4A89B8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default ProfileScreen;
