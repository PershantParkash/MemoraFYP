import AsyncStorage from '@react-native-async-storage/async-storage';

class SessionManager {
  static SESSION_KEYS = [
    'authToken',
    'userEmail',
    'userData',
    'lastLoginTime',
    'sessionData'
  ];

  static SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Save complete session data
  static async saveSession(token, email, userData = null) {
    try {
      const sessionData = {
        token,
        email,
        userData,
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      await AsyncStorage.multiSet([
        ['authToken', token],
        ['userEmail', email],
        ['lastLoginTime', sessionData.loginTime],
        ['sessionData', JSON.stringify(sessionData)]
      ]);

      if (userData) {
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      }

      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  }

  // Clear all session data
  static async clearSession() {
    try {
      await AsyncStorage.multiRemove(this.SESSION_KEYS);
      return true;
    } catch (error) {
      console.error('Error clearing session:', error);
      return false;
    }
  }

  // Check if session is valid
  static async isSessionValid() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const lastLoginTime = await AsyncStorage.getItem('lastLoginTime');

      if (!token || !lastLoginTime) {
        return { valid: false, reason: 'no_session' };
      }

      const loginTime = new Date(lastLoginTime);
      const currentTime = new Date();
      const timeDifference = currentTime.getTime() - loginTime.getTime();

      if (timeDifference > this.SESSION_DURATION) {
        // Session expired, clear it
        await this.clearSession();
        return { valid: false, reason: 'expired' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error checking session validity:', error);
      return { valid: false, reason: 'error' };
    }
  }

  // Get current session data
  static async getSessionData() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const email = await AsyncStorage.getItem('userEmail');
      const userDataStr = await AsyncStorage.getItem('userData');
      const lastLoginTime = await AsyncStorage.getItem('lastLoginTime');

      if (!token) {
        return null;
      }

      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      return {
        token,
        email,
        userData,
        lastLoginTime
      };
    } catch (error) {
      console.error('Error getting session data:', error);
      return null;
    }
  }

  // Update last activity time
  static async updateLastActivity() {
    try {
      const sessionDataStr = await AsyncStorage.getItem('sessionData');
      if (sessionDataStr) {
        const sessionData = JSON.parse(sessionDataStr);
        sessionData.lastActivity = new Date().toISOString();
        await AsyncStorage.setItem('sessionData', JSON.stringify(sessionData));
      }
    } catch (error) {
      console.error('Error updating last activity:', error);
    }
  }

  // Force logout (for security purposes)
  static async forceLogout() {
    try {
      await this.clearSession();
      return true;
    } catch (error) {
      console.error('Error during force logout:', error);
      return false;
    }
  }
}

export default SessionManager; 