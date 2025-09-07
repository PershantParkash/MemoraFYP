import React from 'react';
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

const TermsOfServiceScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#6BAED6" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.backButton2} />
      </View>

      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Welcome to Memora</Text>
          <Text style={styles.text}>
            By using Memora, you agree to these terms of service. Please read them carefully.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Service Description</Text>
          <Text style={styles.text}>
            Memora is a time capsule application that allows you to:
          </Text>
          <Text style={styles.bulletText}>• Create and store digital time capsules</Text>
          <Text style={styles.bulletText}>• Send files to friends in the future</Text>
          <Text style={styles.bulletText}>• Publicly share time capsules with the community</Text>
          <Text style={styles.bulletText}>• Schedule content for future delivery</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. User Responsibilities</Text>
          <Text style={styles.text}>
            You are responsible for:
          </Text>
          <Text style={styles.bulletText}>• Maintaining the security of your account</Text>
          <Text style={styles.bulletText}>• Ensuring content complies with our community guidelines</Text>
          <Text style={styles.bulletText}>• Respecting intellectual property rights</Text>
          <Text style={styles.bulletText}>• Not uploading harmful or illegal content</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>3. Privacy & Data</Text>
          <Text style={styles.text}>
            We respect your privacy and handle your data according to our Privacy Policy. Your time capsules remain private unless you choose to share them publicly.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>4. Content Guidelines</Text>
          <Text style={styles.text}>
            Prohibited content includes:
          </Text>
          <Text style={styles.bulletText}>• Illegal or harmful material</Text>
          <Text style={styles.bulletText}>• Spam or malicious content</Text>
          <Text style={styles.bulletText}>• Content that violates others' rights</Text>
          <Text style={styles.bulletText}>• Inappropriate or offensive material</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>5. Service Availability</Text>
          <Text style={styles.text}>
            While we strive for 100% uptime, we cannot guarantee continuous service availability. We are not liable for service interruptions or data loss.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>6. Changes to Terms</Text>
          <Text style={styles.text}>
            We may update these terms occasionally. Continued use of the app constitutes acceptance of updated terms.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.text}>
            If you have questions about these terms, please contact us through the app's feedback feature.
          </Text>
          <Text style={styles.lastUpdated}>
            Last updated: {new Date().toLocaleDateString()}
          </Text>
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
    marginBottom: 12,
    color: '#6BAED6',
  },
  text: {
    fontSize: 15,
    color: '#555555',
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletText: {
    fontSize: 15,
    color: '#555555',
    lineHeight: 22,
    marginBottom: 4,
    marginLeft: 10,
  },
  lastUpdated: {
    fontSize: 13,
    color: '#888888',
    fontStyle: 'italic',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default TermsOfServiceScreen;