import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { LogBox } from 'react-native'; 
import MyProvider from './android/app/src/context/MyContext';

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

// Disable all warning notifications
// LogBox.ignoreAllLogs(true); // Add this line

const Stack = createNativeStackNavigator();

export default function App() {
  return (
  
       <GestureHandlerRootView style={{ flex: 1 }}>  
        <MyProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Index"
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
          
          {/*  <Stack.Screen name="AdditionalInfoScreen" component={AdditionalInfoScreen} />
        
          <Stack.Screen name="HomeCapsule" component={HomeCapsule} /> */}

         
        </Stack.Navigator>
      </NavigationContainer>
      </MyProvider>
      </GestureHandlerRootView>
  );
}