import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const AboutMemoraScreen = () => {
  const navigation = useNavigation();

  const openURL = (url) => {
    Linking.openURL(url).catch(() => {
      // Handle error silently
    });
  };

  const teamMembers = [
    { name: 'Prashant Parkash', role: 'Lead Developer', id: 'BSCS2112229' },
    { name: 'Sahil Kumar', role: 'Lead Developer', id: 'BSCS2112232' },
    { name: 'Sir Asim Riaz', role: 'Project Supervisor', id: 'Supervisor' }
  ];

  const features = [
    {
      icon: 'time-outline',
      title: 'Time Capsules',
      description: 'Create digital time capsules to preserve your memories'
    },
    {
      icon: 'send-outline',
      title: 'Future Delivery',
      description: 'Send files and messages to friends in the future'
    },
    {
      icon: 'globe-outline',
      title: 'Public Sharing',
      description: 'Share your memories with the global community'
    },
    {
      icon: 'cloud-outline',
      title: 'Cloud Storage',
      description: 'Secure cloud storage for all your precious memories'
    }
  ];

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#6BAED6" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Memora</Text>
        <View style={styles.backButton2} />
      </View>

      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.logoCard}>
          <View style={styles.logoContainer}>
            <Icon name="time" size={64} color="#6BAED6" />
          </View>
          <Text style={styles.appName}>Memora</Text>
          <Text style={styles.tagline}>Preserving memories for the future</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.projectInfo}>Final Year Project - BSCS SZABIST</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.text}>
            Memora is designed to help you preserve and share your most precious memories. 
            Whether it's a message to your future self, a surprise for a friend, or a memory 
            you want to share with the world, Memora makes it possible to connect across time.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Icon name={feature.icon} size={24} color="#6BAED6" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <Text style={styles.text}>
            Memora was born from a real-life experience within an extended family where 
            property distribution became a sensitive issue. My cousins grandfather was uncomfortable 
            discussing inheritance matters directly, which inspired us to create a platform 
            where important messages and decisions could be preserved and delivered at the 
            right time in the future.
          </Text>
          <Text style={styles.text}>
            This personal experience led us to envision a broader solution - a digital time 
            capsule app that allows people to communicate across time, preserve precious 
            memories, and ensure important messages reach their intended recipients when 
            the moment is right.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Development Team</Text>
          <Text style={styles.text}>
            Memora is developed as a final year project for Bachelor of Science in Computer 
            Science (BSCS) at SZABIST by a dedicated team of students.
          </Text>
          {teamMembers.map((member, index) => (
            <View key={index} style={styles.teamMember}>
              <Icon name="person-circle-outline" size={32} color="#6BAED6" />
              <View style={styles.teamMemberText}>
                <Text style={styles.teamMemberName}>{member.name}</Text>
                <Text style={styles.teamMemberRole}>{member.role}</Text>
                {member.id !== 'Supervisor' && (
                  <Text style={styles.teamMemberId}>Student ID: {member.id}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <Text style={styles.text}>
            We take your privacy seriously. Your private time capsules are encrypted and 
            stored securely. We never share your personal information with third parties, 
            and you have full control over what you choose to make public.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.text}>
            Have questions or feedback about Memora? We'd love to hear from you!
          </Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Icon name="mail-outline" size={20} color="#6BAED6" />
              <Text style={styles.contactText}>BSCS2112229@szabist.pk</Text>
            </View>
            <View style={styles.contactItem}>
              <Icon name="mail-outline" size={20} color="#6BAED6" />
              <Text style={styles.contactText}>BSCS2112232@szabist.pk</Text>
            </View>
            <View style={styles.contactItem}>
              <Icon name="school-outline" size={20} color="#6BAED6" />
              <Text style={styles.contactText}>SZABIST University</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Acknowledgments</Text>
          <Text style={styles.text}>
            We extend our heartfelt gratitude to Sir Asim Riaz, our project supervisor, 
            for his invaluable guidance and support throughout the development of Memora. 
            His expertise and mentorship made this project possible.
          </Text>
          <Text style={styles.text}>
            Special thanks to SZABIST University for providing the platform and resources 
            for this final year project, and to our family members whose experiences 
            inspired the creation of Memora.
          </Text>
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerText}>
            Made with ❤️ as a Final Year Project
          </Text>
          <Text style={styles.copyright}>
            © 2025 Memora - SZABIST BSCS Final Year Project
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
  logoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    elevation: 4,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#E8F4FC',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: '#888888',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  projectInfo: {
    fontSize: 12,
    color: '#6BAED6',
    fontWeight: '600',
    textAlign: 'center',
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
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: '#555555',
    lineHeight: 22,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureText: {
    marginLeft: 12,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  teamMemberText: {
    marginLeft: 12,
    flex: 1,
  },
  teamMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  teamMemberRole: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  teamMemberId: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
  },
  contactInfo: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#555555',
    marginLeft: 8,
  },
  footerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    elevation: 4,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#6BAED6',
    textAlign: 'center',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
});

export default AboutMemoraScreen;