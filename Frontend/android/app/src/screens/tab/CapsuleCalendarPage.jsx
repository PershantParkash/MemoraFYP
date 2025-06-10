import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import useCapsuleService from '../../hooks/useCapsuleService'; // Make sure alias is correctly set up

const screenWidth = Dimensions.get('window').width;

const CapsuleCalendarPage = () => {
  const [capsules, setCapsules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCapsules, setSelectedCapsules] = useState([]);
  const navigation = useNavigation();
  const { getUserCapsules } = useCapsuleService();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const markedDates = capsules.reduce((acc, capsule) => {
    const dateKey = moment(capsule.UnlockDate).format('YYYY-MM-DD');

    if (!acc[dateKey]) {
      acc[dateKey] = {
        customStyles: {
          container: {
            backgroundColor: '#6BAED6',
            borderRadius: 5,
            position: 'relative',
          },
          text: {
            color: 'white',
            fontWeight: 'bold',
          },
        },
        count: 1,
      };
    } else {
      acc[dateKey].count += 1;
    }

    return acc;
  }, {});

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
    const capsulesForDate = capsules.filter(
      (item) => moment(item.UnlockDate).format('YYYY-MM-DD') === day.dateString
    );
    setSelectedCapsules(capsulesForDate);
  };

  const renderCapsuleItem = (capsule, index) => (
    <View key={index} style={styles.capsuleItem}>
      <View style={styles.capsuleInfo}>
        <Text style={styles.capsuleTitle}>{capsule.Title}</Text>
        <Text style={styles.capsuleDate}>
          {moment(capsule.UnlockDate).format('MMM DD, YYYY')}
        </Text>
      </View>
      <View style={styles.capsuleStatus}>
        <FontAwesome
          name={capsule.Status === 'Locked' ? 'lock' : 'unlock'}
          size={18}
          color="#6BAED6"
        />
        <Text style={styles.statusText}>{capsule.Status}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>TimeCapsule Calendar</Text>
      </View>

      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={handleDateSelect}
          markingType={'custom'}
          markedDates={{
            ...markedDates,
            ...(selectedDate && {
              [selectedDate]: {
                selected: true,
                selectedColor: '#00bcd4',
                selectedTextColor: '#ffffff',
                ...markedDates[selectedDate]?.customStyles,
              },
            }),
          }}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#00bcd4',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#6a11cb',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            arrowColor: '#6a11cb',
            monthTextColor: '#6a11cb',
            indicatorColor: '#6a11cb',
          }}
        />
      </View>

      <View style={styles.infoContainer}>
        {selectedCapsules.length > 0 ? (
          <>
            <Text style={styles.infoText}>
              {selectedCapsules.length === 1
                ? `1 Time Capsule scheduled for `
                : `${selectedCapsules.length} Time Capsules scheduled for `}
              <Text style={styles.dateText}>{selectedDate}</Text>
            </Text>

            <View style={styles.capsulesContainer}>
              {selectedCapsules.map((capsule, index) => renderCapsuleItem(capsule, index))}
            </View>
          </>
        ) : selectedDate ? (
          <>
            <Text style={styles.infoText}>
              No Time Capsules are scheduled to unlock for you on this date:
              <Text style={styles.dateText}> {selectedDate}</Text>
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                navigation.navigate('CameraScreen');
              }}
            >
              <Text style={styles.buttonText}>Create Capsules</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.infoText}>
              Tap on a highlighted date to see capsule details.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                navigation.navigate('CameraScreen');
              }}
            >
              <Text style={styles.buttonText}>Create Capsules</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

export default CapsuleCalendarPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6BAED6',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  calendarContainer: {
    margin: 20,
    padding: 5,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    elevation: 5,
  },
  infoContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 15,
  },
  dateText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  capsulesContainer: {
    width: '100%',
    maxHeight: 300,
  },
  capsuleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginVertical: 5,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  capsuleInfo: {
    flex: 1,
  },
  capsuleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6BAED6',
    marginBottom: 4,
  },
  capsuleDate: {
    fontSize: 14,
    color: '#666',
  },
  capsuleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6BAED6',
    fontWeight: '500',
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 45,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  buttonText: {
    color: '#6BAED6',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
