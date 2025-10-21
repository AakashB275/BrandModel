import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AnalyticsService {
  constructor() {
    this.sessionStartTime = Date.now();
    this.sessionId = this.generateSessionId();
    this.events = [];
  }

  generateSessionId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  async trackEvent(eventName, properties = {}) {
    try {
      const event = {
        eventName,
        properties: {
          ...properties,
          timestamp: firestore.FieldValue.serverTimestamp(),
          sessionId: this.sessionId,
          platform: 'mobile',
        },
      };

      // Store event locally first
      this.events.push(event);

      // Send to Firestore
      await firestore().collection('analytics').add(event);

      console.log('Analytics event tracked:', eventName, properties);
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  async trackUserAction(action, target = null, metadata = {}) {
    await this.trackEvent('user_action', {
      action,
      target,
      ...metadata,
    });
  }

  async trackScreenView(screenName, previousScreen = null) {
    await this.trackEvent('screen_view', {
      screenName,
      previousScreen,
      timestamp: Date.now(),
    });
  }

  async trackSwipe(direction, targetUserId, targetUserType) {
    await this.trackEvent('swipe', {
      direction, // 'left' or 'right'
      targetUserId,
      targetUserType,
    });
  }

  async trackMatch(matchId, otherUserId, otherUserType) {
    await this.trackEvent('match', {
      matchId,
      otherUserId,
      otherUserType,
    });
  }

  async trackMessageSent(matchId, messageLength) {
    await this.trackEvent('message_sent', {
      matchId,
      messageLength,
    });
  }

  async trackProfileView(profileUserId, profileUserType) {
    await this.trackEvent('profile_view', {
      profileUserId,
      profileUserType,
    });
  }

  async trackVerificationSubmitted(userType, documentCount) {
    await this.trackEvent('verification_submitted', {
      userType,
      documentCount,
    });
  }

  async trackPremiumUpgrade(planType, price) {
    await this.trackEvent('premium_upgrade', {
      planType,
      price,
    });
  }

  async trackSearch(distance, tags, userType) {
    await this.trackEvent('search', {
      distance,
      tags,
      userType,
    });
  }

  async trackError(errorType, errorMessage, screenName) {
    await this.trackEvent('error', {
      errorType,
      errorMessage,
      screenName,
    });
  }

  async trackSessionEnd() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    await this.trackEvent('session_end', {
      sessionDuration,
      eventsCount: this.events.length,
    });
  }

  async updateUserProfile(userId, profileData) {
    try {
      await firestore().collection('users').doc(userId).update({
        lastActive: firestore.FieldValue.serverTimestamp(),
        analyticsData: {
          lastSessionId: this.sessionId,
          lastActiveAt: firestore.FieldValue.serverTimestamp(),
        },
      });
    } catch (error) {
      console.error('Error updating user analytics:', error);
    }
  }

  async trackFeatureUsage(featureName, userId) {
    await this.trackEvent('feature_usage', {
      featureName,
      userId,
    });
  }

  async trackPerformance(metricName, value, unit = 'ms') {
    await this.trackEvent('performance', {
      metricName,
      value,
      unit,
    });
  }

  async trackRetention(userId, daysSinceSignup) {
    await this.trackEvent('retention', {
      userId,
      daysSinceSignup,
    });
  }

  async trackConversion(funnelStep, userId, metadata = {}) {
    await this.trackEvent('conversion', {
      funnelStep,
      userId,
      ...metadata,
    });
  }

  // Helper methods for common analytics patterns
  async trackOnboardingStep(step, userId) {
    await this.trackEvent('onboarding_step', {
      step,
      userId,
    });
  }

  async trackProfileCompletion(completionPercentage, userId) {
    await this.trackEvent('profile_completion', {
      completionPercentage,
      userId,
    });
  }

  async trackEngagement(action, userId, metadata = {}) {
    await this.trackEvent('engagement', {
      action,
      userId,
      ...metadata,
    });
  }

  // Batch analytics for offline support
  async saveOfflineEvent(eventName, properties = {}) {
    try {
      const offlineEvents = await AsyncStorage.getItem('offline_analytics');
      const events = offlineEvents ? JSON.parse(offlineEvents) : [];
      
      events.push({
        eventName,
        properties: {
          ...properties,
          timestamp: Date.now(),
          sessionId: this.sessionId,
          offline: true,
        },
      });

      await AsyncStorage.setItem('offline_analytics', JSON.stringify(events));
    } catch (error) {
      console.error('Error saving offline analytics event:', error);
    }
  }

  async syncOfflineEvents() {
    try {
      const offlineEvents = await AsyncStorage.getItem('offline_analytics');
      
      if (offlineEvents) {
        const events = JSON.parse(offlineEvents);
        
        // Send all offline events to Firestore
        const batch = firestore().batch();
        events.forEach(event => {
          const docRef = firestore().collection('analytics').doc();
          batch.set(docRef, {
            ...event,
            properties: {
              ...event.properties,
              timestamp: firestore.FieldValue.serverTimestamp(),
            },
          });
        });
        
        await batch.commit();
        
        // Clear offline events
        await AsyncStorage.removeItem('offline_analytics');
        
        console.log(`Synced ${events.length} offline analytics events`);
      }
    } catch (error) {
      console.error('Error syncing offline analytics events:', error);
    }
  }

  // Privacy and GDPR compliance
  async deleteUserAnalytics(userId) {
    try {
      // Delete user-specific analytics events
      const snapshot = await firestore()
        .collection('analytics')
        .where('properties.userId', '==', userId)
        .get();

      const batch = firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Deleted ${snapshot.docs.length} analytics events for user ${userId}`);
    } catch (error) {
      console.error('Error deleting user analytics:', error);
    }
  }
}

export default new AnalyticsService();
