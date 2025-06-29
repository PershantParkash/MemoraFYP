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
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import useFriendService from '../../hooks/useFriendService'; 
import Config from 'react-native-config';

const FriendsScreen = () => {
  const navigation = useNavigation();
  
  const {
    allProfiles,
    pendingRequestsProfile,
    isLoading,
    handleAcceptRequest,
    handleDeclineRequest,
    sendFriendRequest,
  } = useFriendService();

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

  const renderPendingRequestItem = (item) => (
    <View style={styles.requestItem} key={item._id}>
      <View style={styles.pendingItem}>
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

      {/* Toast Component */}
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
  profileImage: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  profileName: { flex: 1, fontSize: 16, color: '#333' },
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
  },
  sendRequestButton: {
    backgroundColor: '#6BAED6',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: 'row',
  },
  sendRequestButtonText: { color: '#fff', fontWeight: 'bold' },
  noRequestsText: { fontSize: 16, color: '#888', textAlign: 'center', marginVertical: 10 },
});