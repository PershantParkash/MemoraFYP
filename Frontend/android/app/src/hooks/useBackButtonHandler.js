import React, { useEffect, useRef, useCallback } from 'react';
import { BackHandler, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import useAuthService from './useAuthService';
import { useNavigationContext } from '../context/NavigationContext';

const useBackButtonHandler = () => {
  const navigation = useNavigation();
  const { logoutUser } = useAuthService();
  const {
    initializeHistory,
    addToHistory,
    removeFromHistory,
    isOnCameraTab,
    isOnLoginScreen,
    resetHistory,
  } = useNavigationContext();
  
  const backPressCount = useRef(0);
  const backPressTimeout = useRef(null);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      const result = await logoutUser();
      if (result.success) {
        // Reset navigation history
        resetHistory();
        
        // Force navigation to login screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Index' }],
        });
      } else {
        Alert.alert(
          'Logout Failed',
          result.message || 'Unable to logout. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Logout Error',
        'An error occurred during logout.',
        [{ text: 'OK' }]
      );
    }
  }, [logoutUser, navigation, resetHistory]);

  // Handle back button press
  const handleBackPress = useCallback(() => {
    // Clear any existing timeout
    if (backPressTimeout.current) {
      clearTimeout(backPressTimeout.current);
      backPressTimeout.current = null;
    }

    // If on login screen, implement double-tap to exit
    if (isOnLoginScreen()) {
      backPressCount.current += 1;
      
      if (backPressCount.current === 1) {
        Alert.alert(
          'Exit App',
          'Press back again to exit the app',
          [
            {
              text: 'Cancel',
              onPress: () => {
                backPressCount.current = 0;
              },
              style: 'cancel',
            },
          ],
          { cancelable: false }
        );
        
        // Reset counter after 2 seconds
        backPressTimeout.current = setTimeout(() => {
          backPressCount.current = 0;
        }, 2000);
        
        return true; // Prevent default back behavior
      } else if (backPressCount.current === 2) {
        // Exit the app
        BackHandler.exitApp();
        return true;
      }
      
      return false;
    }

    // If on Camera tab, show logout confirmation
    if (isOnCameraTab()) {
      Alert.alert(
        'Logout',
        'Do you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: handleLogout,
          },
        ],
        { cancelable: false }
      );
      return true; // Prevent default back behavior
    }

    // For other screens, check if we should go back in history or switch to Camera
    const previousScreen = removeFromHistory();
    
    if (previousScreen) {
      // Navigate to the previous screen in our history
      if (previousScreen === 'CameraScreen') {
        navigation.navigate('CameraScreen');
      } else if (previousScreen === 'friends') {
        navigation.navigate('friends');
      } else if (previousScreen === 'Calendar') {
        navigation.navigate('Calendar');
      } else if (previousScreen === 'HomeCapsule') {
        navigation.navigate('HomeCapsule');
      } else if (previousScreen === 'profile') {
        navigation.navigate('profile');
      }
      return true; // Prevent default back behavior
    } else {
      // If no history, switch to Camera tab
      navigation.navigate('CameraScreen');
      return true; // Prevent default back behavior
    }
  }, [isOnLoginScreen, isOnCameraTab, removeFromHistory, handleLogout, navigation]);

  // Set up back handler
  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress
      );

      return () => {
        backHandler.remove();
        if (backPressTimeout.current) {
          clearTimeout(backPressTimeout.current);
        }
      };
    }, [handleBackPress])
  );

  // Reset back press count when screen loses focus
  useEffect(() => {
    return () => {
      backPressCount.current = 0;
      if (backPressTimeout.current) {
        clearTimeout(backPressTimeout.current);
      }
    };
  }, []);

  return {
    handleLogout,
  };
};

export default useBackButtonHandler; 