import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const FeedbackScreen = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'bug', title: 'Bug Report', icon: 'bug-outline', description: 'Report a problem or error' },
    { id: 'feature', title: 'Feature Request', icon: 'bulb-outline', description: 'Suggest a new feature' },
    { id: 'improvement', title: 'Improvement', icon: 'trending-up-outline', description: 'Suggest improvements' },
    { id: 'general', title: 'General Feedback', icon: 'chatbubble-outline', description: 'Share your thoughts' },
    { id: 'support', title: 'Need Help', icon: 'help-circle-outline', description: 'Get assistance' },
  ];

  const handleSubmitFeedback = async () => {
    if (!selectedCategory) {
      Alert.alert('Category Required', 'Please select a feedback category.');
      return;
    }

    if (!feedback.trim()) {
      Alert.alert('Feedback Required', 'Please enter your feedback message.');
      return;
    }

    if (feedback.trim().length < 10) {
      Alert.alert('Too Short', 'Please provide more detailed feedback (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Toast.show({
        type: 'success',
        text1: 'Feedback Submitted!',
        text2: 'Thank you for helping us improve Memora.',
        visibilityTime: 4000,
      });

      // Reset form
      setSelectedCategory('');
      setFeedback('');
      setEmail('');
      
      // Go back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryCard = (category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryCard,
        selectedCategory === category.id && styles.selectedCategoryCard
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Icon 
        name={category.icon} 
        size={24} 
        color={selectedCategory === category.id ? '#FFFFFF' : '#6BAED6'} 
      />
      <View style={styles.categoryText}>
        <Text style={[
          styles.categoryTitle,
          selectedCategory === category.id && styles.selectedCategoryTitle
        ]}>
          {category.title}
        </Text>
        <Text style={[
          styles.categoryDescription,
          selectedCategory === category.id && styles.selectedCategoryDescription
        ]}>
          {category.description}
        </Text>
      </View>
      {selectedCategory === category.id && (
        <Icon name="checkmark-circle" size={20} color="#FFFFFF" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#6BAED6" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Feedback</Text>
        <View style={styles.backButton2} />
      </View>

      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.introCard}>
            <Icon name="heart-outline" size={32} color="#6BAED6" />
            <Text style={styles.introTitle}>We Value Your Feedback</Text>
            <Text style={styles.introText}>
              Your thoughts help us make Memora better for everyone. Share your ideas, 
              report issues, or just let us know how we're doing.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>What type of feedback?</Text>
            <Text style={styles.sectionSubtitle}>Select the category that best fits your feedback</Text>
            
            <View style={styles.categoriesContainer}>
              {categories.map(renderCategoryCard)}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Feedback</Text>
            <Text style={styles.sectionSubtitle}>
              Please provide detailed information about your feedback
            </Text>
            
            <TextInput
              style={styles.feedbackInput}
              placeholder="Tell us what's on your mind..."
              placeholderTextColor="#999999"
              multiline
              numberOfLines={6}
              value={feedback}
              onChangeText={setFeedback}
              textAlignVertical="top"
            />
            
            <Text style={styles.characterCount}>
              {feedback.length}/500 characters
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Contact Email (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Leave your email if you'd like us to follow up with you
            </Text>
            
            <TextInput
              style={styles.emailInput}
              placeholder="your.email@example.com"
              placeholderTextColor="#999999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.card}>
            <View style={styles.privacyNotice}>
              <Icon name="shield-checkmark-outline" size={20} color="#6BAED6" />
              <Text style={styles.privacyText}>
                Your feedback is important to us. We'll never share your information 
                with third parties and will only use it to improve Memora.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedCategory || !feedback.trim()) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitFeedback}
            disabled={isSubmitting || !selectedCategory || !feedback.trim()}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Submitting...</Text>
            ) : (
              <>
                <Icon name="send" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Send Feedback</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FCFF',
  },
  container: {
    flex: 1,
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
  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    elevation: 4,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
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
    color: '#333333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  categoriesContainer: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8F4FC',
    backgroundColor: '#FAFCFF',
  },
  selectedCategoryCard: {
    backgroundColor: '#6BAED6',
    borderColor: '#6BAED6',
  },
  categoryText: {
    flex: 1,
    marginLeft: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  selectedCategoryTitle: {
    color: '#FFFFFF',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666666',
  },
  selectedCategoryDescription: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  feedbackInput: {
    borderWidth: 2,
    borderColor: '#E8F4FC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FAFCFF',
    height: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'right',
    marginTop: 8,
  },
  emailInput: {
    borderWidth: 2,
    borderColor: '#E8F4FC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FAFCFF',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  privacyText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
  },
  submitButton: {
    backgroundColor: '#6BAED6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default FeedbackScreen;