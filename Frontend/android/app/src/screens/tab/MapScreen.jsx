import React, { useState, useEffect, useRef } from "react";
import { 
  StyleSheet, 
  View, 
  ActivityIndicator, 
  Text, 
  FlatList, 
  TouchableOpacity,
  Dimensions 
} from "react-native";
import { WebView } from "react-native-webview";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../api/axiosInstance'; // Adjust path as needed
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';

const { width, height } = Dimensions.get('window');

const THEME = {
  primary: '#6BAED6',
  primaryDark: '#4A90C2',
  error: '#FF4444',
  success: '#52C41A',
};

export default function MapScreen() {
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCapsuleId, setSelectedCapsuleId] = useState(null);
  const [showList, setShowList] = useState(true);
  
  const webViewRef = useRef(null);

  useEffect(() => {
    fetchCapsules();
  }, []);

  const fetchCapsules = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosInstance.get('/api/timecapsules/getLoginUserCapsules', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const capsulesWithLocation = response.data.capsules.filter(
          capsule => capsule.Lat && capsule.Lng
        );
        setCapsules(capsulesWithLocation);
      } else {
        throw new Error('Failed to fetch capsules');
      }
    } catch (error) {
      console.error('Error fetching capsules:', error);
      setError(error.message || 'Failed to load time capsules');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLocation = (capsule) => {
    setSelectedCapsuleId(capsule._id);
    
    // JavaScript to execute in WebView to move map to specific location
    const jsCode = `
      map.setView([${capsule.Lat}, ${capsule.Lng}], 16);
      
      // Find the marker and open its popup
      map.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
          var latLng = layer.getLatLng();
          if (Math.abs(latLng.lat - ${capsule.Lat}) < 0.0001 && 
              Math.abs(latLng.lng - ${capsule.Lng}) < 0.0001) {
            layer.openPopup();
          }
        }
      });
      true;
    `;
    
    webViewRef.current?.injectJavaScript(jsCode);
    setShowList(false); // Hide list when navigating to location
  };

  const toggleList = () => {
    setShowList(!showList);
  };

  const renderCapsuleItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.capsuleItem,
        selectedCapsuleId === item._id && styles.selectedCapsuleItem
      ]}
      onPress={() => navigateToLocation(item)}
    >
      <View style={styles.capsuleItemHeader}>
        <Text style={styles.capsuleItemTitle}>{item.Title}</Text>
        <View style={styles.capsuleItemStatus}>
          <FontAwesome
            name={item.Status === 'Locked' ? 'lock' : 'unlock'}
            size={14}
            color={item.Status === 'Locked' ? THEME.error : THEME.success}
          />
        </View>
      </View>
      
      {item.Description && (
        <Text style={styles.capsuleItemDescription} numberOfLines={2}>
          {item.Description}
        </Text>
      )}
      
      <View style={styles.capsuleItemFooter}>
        <Text style={styles.capsuleItemDate}>
          {item.Status === 'Locked' ? 'Unlocks: ' : 'Created: '}
          {moment(item.UnlockDate).format('MMM DD, YYYY')}
        </Text>
        <MaterialIcons name="location-on" size={16} color={THEME.primary} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={styles.loadingText}>Loading your time capsules...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCapsules}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (capsules.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="location-off" size={48} color="#ccc" />
        <Text style={styles.emptyText}>No time capsules with location data found</Text>
        <Text style={styles.emptySubText}>
          Create time capsules with location to see them on the map
        </Text>
      </View>
    );
  }

  const markersJS = capsules
    .map(
      (capsule, index) => `
        var marker${index} = L.marker([${capsule.Lat}, ${capsule.Lng}]).addTo(map);
        marker${index}.bindTooltip("${capsule.Title.replace(/"/g, '\\"')}", { 
          permanent: false, 
          direction: "top" 
        });
        marker${index}.bindPopup(\`
          <div style="min-width: 200px;">
            <b style="color: #6BAED6; font-size: 16px;">${capsule.Title.replace(/"/g, '\\"')}</b><br/>
            ${capsule.Description ? `<p style="margin: 8px 0; color: #333;">${capsule.Description.replace(/"/g, '\\"')}</p>` : ''}
            <div style="margin-top: 10px; font-size: 12px; color: #666;">
              <div><strong>Status:</strong> ${capsule.Status}</div>
              <div><strong>Unlock Date:</strong> ${new Date(capsule.UnlockDate).toLocaleDateString()}</div>
              <div><strong>Type:</strong> ${capsule.CapsuleType}</div>
            </div>
          </div>
        \`);
      `
    )
    .join("\n");

  const bounds = capsules.map((capsule) => `[${capsule.Lat}, ${capsule.Lng}]`).join(",");

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
        <style>
          #map { width: 100%; height: 100vh; }

          .leaflet-tooltip {
            font-size: 14px;
            font-weight: 600;
            padding: 6px 10px;
            border-radius: 6px;
            background: white;
            color: #333;
            border: 1px solid #6BAED6;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          }

          .leaflet-popup-content-wrapper {
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }

          .leaflet-popup-content {
            margin: 15px;
            line-height: 1.5;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <script>
          var map = L.map('map');

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          ${markersJS}

          ${bounds ? `
            var bounds = L.latLngBounds([${bounds}]);
            map.fitBounds(bounds, { padding: [30, 30] });
          ` : `
            map.setView([24.8607, 67.0011], 12);
          `}
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <WebView 
          ref={webViewRef}
          originWhitelist={["*"]} 
          source={{ html: mapHtml }} 
          style={{ flex: 1 }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.log('WebView error: ', nativeEvent);
          }}
        />
      </View>

      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={toggleList}
      >
        <MaterialIcons 
          name={showList ? 'keyboard-arrow-down' : 'list'} 
          size={24} 
          color="white" 
        />
      </TouchableOpacity>

      {showList && (
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>
              Your Time Capsules ({capsules.length})
            </Text>
            <Text style={styles.listHeaderSubText}>
              Tap any capsule to navigate to its location
            </Text>
          </View>
          
          <FlatList
            data={capsules}
            keyExtractor={(item) => item._id}
            renderItem={renderCapsuleItem}
            showsVerticalScrollIndicator={false}
            style={styles.flatList}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  mapContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: THEME.error,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  retryText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
  
  toggleButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: THEME.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
    zIndex: 1000,
  },
  
  listContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    maxHeight: height * 0.4, 
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 10,
    elevation: 10,
  },
  listHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  listHeaderSubText: {
    fontSize: 14,
    color: '#666',
  },
  flatList: {
    maxHeight: height * 0.25, // Limit list height
  },
  
  // Capsule Item
  capsuleItem: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCapsuleItem: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: THEME.primary,
  },
  capsuleItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  capsuleItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  capsuleItemStatus: {
    marginLeft: 10,
  },
  capsuleItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  capsuleItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capsuleItemDate: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
});