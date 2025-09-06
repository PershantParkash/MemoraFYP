import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import useFriendService from '../../hooks/useFriendService'; 
import Config from 'react-native-config';
import useBackButtonHandler from '../../hooks/useBackButtonHandler';
import { useNavigationContext } from '../../context/NavigationContext';

const FriendsScreen = () => {
  const navigation = useNavigation();
  const { addToHistory } = useNavigationContext();
  
  // Use custom back button handler
  useBackButtonHandler();
  
  const {
    allProfiles,
    pendingRequestsProfile,
    isLoading,
    handleAcceptRequest,
    handleDeclineRequest,
    sendFriendRequest,
    refreshData, // Make sure this function is available from the hook
  } = useFriendService();

  // Refresh data every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      addToHistory('friends');
      
      // Refresh friend requests and find friends data
      refreshData();
    }, [addToHistory])
  );

  const handleAcceptFriendRequest = async (userId) => {
    try {
      await handleAcceptRequest(userId);
      Toast.show({
        type: 'success',
        text1: 'Friend Request Accepted',
        text2: 'You are now friends! 🎉',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Accept Request Failed',
        text2: 'Unable to accept friend request. Please try again.',
      });
    }
  };

  const handleDeclineFriendRequest = async (userId) => {
    try {
      await handleDeclineRequest(userId);
      Toast.show({
        type: 'info',
        text1: 'Friend Request Declined',
        text2: 'Request has been declined.',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Decline Request Failed',
        text2: 'Unable to decline friend request. Please try again.',
      });
    }
  };

  const handleSendFriendRequest = async (userId, username) => {
    try {
      await sendFriendRequest(userId);
      Toast.show({
        type: 'success',
        text1: 'Friend Request Sent',
        text2: `Request sent to ${username} successfully!`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Send Request Failed',
        text2: error.message || 'Unable to send friend request. Please try again.',
      });
    }
  };

  // Updated to pass context for friend requests
  const handleFriendRequestProfilePress = (userId, username, profilePicture) => {
    navigation.navigate('UserProfileScreen', {
      userId: userId,
      username: username,
      profilePicture: profilePicture,
      context: 'friendRequest', // Add context for friend request
    });
  };

  // Updated to pass context for find friends
  const handleFindFriendsProfilePress = (userId, username, profilePicture) => {
    navigation.navigate('UserProfileScreen', {
      userId: userId,
      username: username,
      profilePicture: profilePicture,
      context: 'findFriends', // Add context for find friends
    });
  };

  const renderPendingRequestItem = (item) => (
    <View style={styles.requestItem} key={item._id}>
      <View style={styles.pendingItem}>
        <TouchableOpacity
          onPress={() => handleFriendRequestProfilePress(item.userId, item.username, item.profilePicture)}
          style={styles.profileTouchable}
        >
          <Image
            source={
              item?.profilePicture
                ? { uri: `${Config.API_BASE_URL}/uploads/${item.profilePicture}` }
                : require('../../assets/images/avatar.png')
            }
            style={styles.profileImage}
            onError={() => {
              Toast.show({
                type: 'error',
                text1: 'Image Load Error',
                text2: 'Unable to load profile picture.',
              });
            }}
          />
          <Text style={styles.profileName}>{item.username}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={() => handleAcceptFriendRequest(item.userId)}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={() => handleDeclineFriendRequest(item.userId)}
        >
          <Text style={styles.buttonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6BAED6" />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.sectionTitle}>Friend Requests</Text>
        {pendingRequestsProfile.length > 0 ? (
          pendingRequestsProfile.map(renderPendingRequestItem)
        ) : (
          <View style={styles.container2}>
            <Image
              source={require('../../assets/images/png.jpg')}
              style={styles.image}
              onError={() => {
                Toast.show({
                  type: 'error',
                  text1: 'Image Load Error',
                  text2: 'Unable to load illustration.',
                });
              }}
            />
            <Text style={styles.noRequestsText}>
              You have no pending friend requests right now.
            </Text>
          </View>
        )}

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Find Friends</Text>
        {allProfiles.length > 0 ? (
          allProfiles.map((profile) => (
            <View style={styles.profileItem} key={profile._id}>
              <TouchableOpacity
                onPress={() => handleFindFriendsProfilePress(profile.userId, profile.username, profile.profilePicture)}
                style={styles.profileTouchable}
              >
                <Image
                  source={
                    profile?.profilePicture
                      ? { uri: `${Config.API_BASE_URL}/uploads/${profile.profilePicture}` }
                      : require('../../assets/images/avatar.png')
                  }
                  style={styles.profileImage}
                  onError={() => {
                    Toast.show({
                      type: 'error',
                      text1: 'Image Load Error',
                      text2: 'Unable to load profile picture.',
                    });
                  }}
                />
                <Text style={styles.profileName}>{profile.username}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendRequestButton}
                onPress={() => handleSendFriendRequest(profile.userId, profile.username)}
              >
                <Text style={styles.sendRequestButtonText}>Add</Text>
                <Ionicons 
                  name="person-add" 
                  size={16} 
                  color="white" 
                  style={styles.personIcon} 
                />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.container2}>
            <Image
              source={require('../../assets/images/png2.jpg')}
              style={styles.image}
              onError={() => {
                Toast.show({
                  type: 'error',
                  text1: 'Image Load Error',
                  text2: 'Unable to load illustration.',
                });
              }}
            />
            <Text style={styles.noRequestsText}>
              No users available to send a friend request.
            </Text>
          </View>
        )}
      </ScrollView>

     
      <Toast />
    </View>
  );
};

export default FriendsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  container2: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6BAED6',
    fontWeight: '500',
  },
  image: { width: 180, height: 180 },
  scrollContainer: { padding: 16 },
  personIcon: { marginLeft: 5 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 16 },
  requestItem: { padding: 12, marginBottom: 10, borderRadius: 8, backgroundColor: '#fff', elevation: 1 },
  pendingItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  profileTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  profileName: { fontSize: 16, color: '#333', flex: 1 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  button: {
    flex: 0.48,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: { backgroundColor: '#4CAF50' },
  declineButton: { backgroundColor: '#FF5252' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 1,
    justifyContent: 'space-between',
  },
  sendRequestButton: {
    backgroundColor: '#6BAED6',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  sendRequestButtonText: { color: '#fff', fontWeight: 'bold' },
  noRequestsText: { fontSize: 16, color: '#888', textAlign: 'center', marginVertical: 10 },
});