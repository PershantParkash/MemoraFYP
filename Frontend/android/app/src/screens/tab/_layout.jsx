import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigationContext } from '../../context/NavigationContext';
import CommunityHomeCapsule from './CommunityHomeCapsule';
import CameraScreen from './CameraScreen';
import FriendsScreen from './FriendsScreen';
import ProfileScreen from './ProfileScreen';
import HomeCapsule from './HomeCapsule';
import capsuleCalendar from './CapsuleCalendarPage';
import MapScreen from './MapScreen';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const { initializeHistory } = useNavigationContext();

  useEffect(() => {
    initializeHistory();
  }, [initializeHistory]);

  return (
    <Tab.Navigator 
      initialRouteName="CameraScreen"
    >
      <Tab.Screen
        name="friends"
        component={FriendsScreen}
        options={{
          title: 'Friends',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'people-sharp' : 'people-outline'} 
              color={color} 
              size={24} 
            />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="MapScreen"
        component={MapScreen}
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'map-sharp' : 'map-outline'} 
              color={color} 
              size={22} 
            />
          ),
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="Calendar"
        component={capsuleCalendar}
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'calendar-sharp' : 'calendar-outline'} 
              color={color} 
              size={22} 
            />
          ),
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="CameraScreen"
        component={CameraScreen}
        options={{
          title: 'Camera',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'camera-sharp' : 'camera-outline'} 
              color={color} 
              size={26} 
            />
          ),
          headerShown: false,
        }}
      />

<Tab.Screen
        name="CommunityHomeCapsule"
        component={CommunityHomeCapsule}
        options={{
          title: 'Capsules',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? 'timer-sand' : 'timer-sand-empty'} 
              color={color} 
              size={22} 
            />
          ),
          headerShown: false,
        }}
      />
      {/* <Tab.Screen
        name="HomeCapsule"
        component={HomeCapsule}
        options={{
          title: 'Capsules',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? 'timer-sand' : 'timer-sand-empty'} 
              color={color} 
              size={22} 
            />
          ),
          headerShown: false,
        }}
      /> */}

      <Tab.Screen
        name="profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'person-sharp' : 'person-outline'} 
              color={color} 
              size={22} 
            />
          ),
          headerShown: false,
        }}
      /> 
    </Tab.Navigator>
  );
}