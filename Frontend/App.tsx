import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LogBox, View, ActivityIndicator } from 'react-native'; 
import MyProvider from './android/app/src/context/MyContext';
import { NavigationProvider } from './android/app/src/context/NavigationContext';
import useAuthService from './android/app/src/hooks/useAuthService';
import Toast from 'react-native-toast-message';

// Import your screens manually
import Index from './android/app/src/screens/Index';  
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Registration from './android/app/src/screens/RegistrationStep1'
import Registration2 from './android/app/src/screens/RegistrationStep2'
import Tab from './android/app/src/screens/tab/_layout';
import SettingsScreen from './android/app/src/screens/SettingsScreen';
import EditProfileScreen from './android/app/src/screens/EditProfileScreen'
import CapsuleCreationScreen from './android/app/src/screens/CapsuleCreationScreen';
import SendCapsulePage from './android/app/src/screens/SendCapsulePage';
import UserProfileScreen from './android/app/src/screens/UserProfileScreen';

// Disable all warning notifications
LogBox.ignoreAllLogs(true);

const Stack = createNativeStackNavigator();

const AppContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { checkSessionStatus } = useAuthService();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionStatus = await checkSessionStatus();
        
        if (sessionStatus.sessionExpired) {
          Toast.show({
            type: 'info',
            text1: 'Session Expired',
            text2: 'Your session has expired. Please login again.',
          });
        }
        
        setIsLoggedIn(sessionStatus.isLoggedIn);
      } catch (error) {
        console.error('Error checking session:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FCFF' }}>
        <ActivityIndicator size="large" color="#6BAED6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isLoggedIn ? "Tab" : "Index"}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Index" component={Index} />
        <Stack.Screen name="Tab" component={Tab} />
        <Stack.Screen name="RegistrationStep1" component={Registration} />
        <Stack.Screen name="RegistrationStep2" component={Registration2} /> 
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} /> 
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="CapsuleCreationScreen" component={CapsuleCreationScreen} />
        <Stack.Screen name="SendCapsulePage" component={SendCapsulePage} />
        <Stack.Screen name="UserProfileScreen" component={UserProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>  
      <MyProvider>
        <NavigationProvider>
          <AppContent />
          <Toast />
        </NavigationProvider>
      </MyProvider>
    </GestureHandlerRootView>
  );
}