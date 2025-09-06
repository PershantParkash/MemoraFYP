import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import useAuthService from '../hooks/useAuthService';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { logoutUser } = useAuthService();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleNotifications = (value) => {
    setIsNotificationsEnabled(value);
    Alert.alert("Coming Soon", "This feature is coming soon!");
  };

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout? You will need to enter your password again to login.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await logoutUser();
              
              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Logged Out',
                  text2: 'You have been successfully logged out.',
                });
                
                // Navigate to login screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Index' }],
                });
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Logout Error',
                  text2: result.message,
                });
              }
            } catch (error) {
              console.error('Error during logout:', error);
              Toast.show({
                type: 'error',
                text1: 'Logout Error',
                text2: 'An error occurred during logout.',
              });
            }
          }
        }
      ]
    );
  };

  const goToEditProfile = () => {
    // navigation.navigate('EditProfileScreen');
  };

  const goToChangePassword = () => {
    navigation.navigate('ChangePasswordScreen');
  };

  const showFeatureComingSoon = () => {
    Alert.alert("Coming Soon", "This feature is coming soon!");
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#6BAED6" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton2} />
      </View>

      <View style={styles.bodyWrapper}>
        <ScrollView
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="person-circle-outline" size={24} color="#6BAED6" />
              <Text style={styles.cardTitle}>Profile</Text>
            </View>
            <TouchableOpacity style={styles.optionRow} onPress={goToEditProfile}>
              <Text style={styles.optionText}>Edit Profile</Text>
              <Icon name="chevron-forward-outline" size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="notifications-outline" size={24} color="#6BAED6" />
              <Text style={styles.cardTitle}>Notifications</Text>
            </View>
            <View style={styles.optionRow}>
              <Text style={styles.optionText}>Enable Notifications</Text>
              <Switch
                value={isNotificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#D1D1D6', true: '#A7D0ED' }}
                thumbColor={isNotificationsEnabled ? '#6BAED6' : '#F4F4F4'}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="settings-outline" size={24} color="#6BAED6" />
              <Text style={styles.cardTitle}>Account</Text>
            </View>
            <TouchableOpacity style={styles.optionRow} onPress={goToChangePassword}>
              <Text style={styles.optionText}>Change Password</Text>
              <Icon name="chevron-forward-outline" size={20} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionRow} onPress={showFeatureComingSoon}>
              <Text style={styles.optionText}>Manage Account</Text>
              <Icon name="chevron-forward-outline" size={20} color="#888" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FCFF',
  },
  header: {
    backgroundColor: '#6BAED6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  backButton: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton2: {
    backgroundColor: '#6BAED6',
    padding: 6,
    borderRadius: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 10,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F4FC',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#FF4D4D',
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
});

export default SettingsScreen;