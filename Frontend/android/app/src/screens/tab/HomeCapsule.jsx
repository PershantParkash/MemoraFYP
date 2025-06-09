import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import FontAwesome from 'react-native-vector-icons/FontAwesome'; // 
import moment from 'moment';
import useCapsuleService from '../../hooks/useCapsuleService';

const CapsulePage = () => {
  const [capsules, setCapsules] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getUserCapsules } = useCapsuleService();

  useEffect(() => {
    const fetchCapsules = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getUserCapsules();
        setCapsules(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCapsules();
  }, []);

  const renderCapsule = ({ item }) => (
    <View style={styles.capsuleContainer}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{item.Title}</Text>
        <FontAwesome
          name={item.Status === 'Locked' ? 'lock' : 'unlock'}
          size={24}
          color={item.Status === 'Locked' ? '#f36b4d' : '#6BAED6'}
        />
      </View>

      <Text style={styles.description}>{item.Description}</Text>

      {item.Status === 'Open' ? (
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => setSelectedMedia(item.Media)}
        >
          <Text style={styles.buttonText}>View Capsule Media</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.viewButton2}>
          <Text style={styles.buttonText}>
            Unlock Date: {moment(item.UnlockDate).format('YYYY-MM-DD')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6BAED6" />
          <Text style={styles.loaderText}>Loading your time capsules...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={50} color="#f36b4d" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setCapsules([]);
            }}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (capsules.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesome name="hourglass-o" size={50} color="#6BAED6" />
          <Text style={styles.emptyText}>No time capsules found</Text>
          <Text style={styles.emptySubText}>Create your first time capsule to get started!</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={capsules}
        keyExtractor={(item) => item._id}
        renderItem={renderCapsule}
        contentContainerStyle={styles.listContainer}
      />
    );
  };

  return (
    <View style={styles.container}>
      {selectedMedia ? (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: `http://192.168.2.107:5000/uploads/${selectedMedia}` }}
            style={styles.mediaImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedMedia(null)}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>My Time Capsules</Text>
            <Text style={styles.subHeaderText}>
              Explore and revisit your memories or unlock shared moments.
            </Text>
          </View>

          {renderContent()}
        </>
      )}
    </View>
  );
};

export default CapsulePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 10,
  },
  headerContainer: {
    padding: 20,
    backgroundColor: '#6BAED6',
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 14,
    color: '#e0e0e0',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  capsuleContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  viewButton: {
    backgroundColor: '#6BAED6',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  viewButton2: {
    backgroundColor: '#f36b4d',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaImage: {
    width: '90%',
    height: '70%',
  },
  closeButton: {
    backgroundColor: '#f44336',
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  // Loading state styles
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6BAED6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 5,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  }
});