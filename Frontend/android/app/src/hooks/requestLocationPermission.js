import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import GetLocation from 'react-native-get-location';

export const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      // Request both fine and coarse location permissions
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      const fineLocationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
      const coarseLocationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

      if (!fineLocationGranted && !coarseLocationGranted) {
        // Show alert to guide user to settings
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to function properly. Please enable location permissions in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }

      return fineLocationGranted || coarseLocationGranted;
    } catch (err) {
      console.warn("Permission request error:", err);
      return false;
    }
  }
  return true;
};

export const getCurrentLocation = async () => {
  try {
    const hasLocationPermission = await requestLocationPermission();
    if (!hasLocationPermission) {
      console.warn("Location permission denied");
      return null;
    }

   
    const location = await GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 20000,
      rationale: {
        title: 'Location Permission',
        message: 'This app needs access to your location to create location-based time capsules.',
        buttonPositive: 'OK',
      },
    });

    console.log("Got position:", location);
    
    return {
      lat: location.latitude,
      lng: location.longitude,
      accuracy: location.accuracy,
      timestamp: location.time,
    };

  } catch (error) {
    console.warn("Location error:", error);
    
    // Handle different error types
    if (error.message === 'User denied access to location') {
      Alert.alert(
        'Location Access Denied',
        'Location access is required to create location-based capsules. Please enable location permissions in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
    } else if (error.message === 'Location request timed out') {
      Alert.alert(
        'Location Timeout',
        'Unable to get your location. Please make sure location services are enabled and try again.'
      );
    } else if (error.message === 'Location provider is not available') {
      Alert.alert(
        'Location Services Disabled',
        'Please enable location services in your device settings and try again.'
      );
    } else {
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again.'
      );
    }
    
    return null;
  }
};
