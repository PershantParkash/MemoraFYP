import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const HelpScreen = () => {
  const navigation = useNavigation();
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpanded = (item) => {
    setExpandedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const faqData = [
    {
      id: 'create-capsule',
      question: 'How do I create a time capsule?',
        answer: 'When you log in or register, you will be redirected to the camera screen where you can capture three types of files: photo, video, or audio. After capturing, you will get an option to either create a capsule or cancel. If you choose "Create Capsule", you will be redirected to the capsule creation form screen.'
 },
    {
      id: 'send-friend',
      question: 'How do I send a file to a friend in the future?',
    answer: 'After login or registration, capture a photo, video, or audio. Choose "Create Capsule", set type to Shared, pick an unlock date, and then select your friend to send it.'
 },
    {
      id: 'public-share',
      question: 'What does publicly sharing a time capsule mean?',
      answer: 'When you share publicly, your time capsule becomes visible to all Memora users when it opens. This creates a community experience where everyone can see shared memories from the past.'
    },
    {
      id: 'schedule-delivery',
      question: 'Can I choose when my capsule will open?',
      answer: 'Yes! You can set any future date and time for your capsule to open. Choose from preset options like "1 year from now" or set a custom date.'
    },
    {
  id: 'edit-capsule',
  question: 'Can I edit a time capsule after creating it?',
  answer: 'No. Once a capsule is created, it cannot be edited to preserve its authenticity.'
},
{
  id: 'delete-capsule',
  question: 'Can I delete a time capsule?',
  answer: 'No. Capsules cannot be deleted after creation, ensuring they remain secure until their unlock date.'
},
    {
      id: 'file-types',
      question: 'What types of files can I include?',
      answer: 'You can include photos, videos, audio recordings.'
    },
    {
      id: 'privacy',
      question: 'Are my time capsules private?',
      answer: 'Private capsules are only visible to you and people you specifically share them with. Public capsules are visible to all users when they open. You choose the privacy level for each capsule.'
    },
    {
      id: 'backup',
      question: 'What if I lose my phone or uninstall the app?',
      answer: 'Your capsules are safely stored in the cloud and linked to your account. Simply log back in with the same credentials to access all your capsules.'
    }
  ];

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#6BAED6" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.backButton2} />
      </View>

      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.welcomeCard}>
          <Icon name="help-circle-outline" size={48} color="#6BAED6" />
          <Text style={styles.welcomeTitle}>How can we help you?</Text>
          <Text style={styles.welcomeText}>
            Find answers to common questions or browse help topics below.
          </Text>
        </View>


        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqData.map((item) => (
            <View key={item.id} style={styles.faqItem}>
              <TouchableOpacity 
                style={styles.faqQuestion}
                onPress={() => toggleExpanded(item.id)}
              >
                <Text style={styles.faqQuestionText}>{item.question}</Text>
                <Icon 
                  name={expandedItems[item.id] ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6BAED6" 
                />
              </TouchableOpacity>
              {expandedItems[item.id] && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Still Need Help?</Text>
          <Text style={styles.text}>
            Can't find what you're looking for? We're here to help!
          </Text>
          <TouchableOpacity style={styles.contactButton}>
            <Icon name="mail-outline" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>bscs2112229@szabist.pk</Text>
          </TouchableOpacity>
           <TouchableOpacity style={styles.contactButton2}>
            <Icon name="mail-outline" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>bscs2112232@szabist.pk</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FCFF',
  },
  header: {
    backgroundColor: '#6BAED6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  backButton: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton2: {
    backgroundColor: '#6BAED6',
    padding: 6,
    borderRadius: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    elevation: 4,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6BAED6',
    marginBottom: 16,
  },
  helpSectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F4FC',
  },
  helpSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helpSectionText: {
    marginLeft: 12,
    flex: 1,
  },
  helpSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  helpSectionDesc: {
    fontSize: 14,
    color: '#666666',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8F4FC',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingBottom: 16,
    paddingRight: 32,
  },
  faqAnswerText: {
    fontSize: 15,
    color: '#555555',
    lineHeight: 22,
  },
  text: {
    fontSize: 15,
    color: '#555555',
    lineHeight: 22,
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: '#6BAED6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  contactButton2:{
     backgroundColor: '#6BAED6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
      marginTop: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HelpScreen;