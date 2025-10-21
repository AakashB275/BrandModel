import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import firestore from '@react-native-firebase/firestore';

class OfflineService {
  constructor() {
    this.isOnline = true;
    this.pendingActions = [];
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;

      if (wasOffline && this.isOnline) {
        console.log('Connection restored, syncing offline data...');
        this.syncOfflineData();
      } else if (!this.isOnline) {
        console.log('Connection lost, switching to offline mode');
      }
    });
  }

  async saveOfflineData(key, data) {
    try {
      const offlineData = await AsyncStorage.getItem('offline_data');
      const parsedData = offlineData ? JSON.parse(offlineData) : {};
      
      parsedData[key] = {
        data,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem('offline_data', JSON.stringify(parsedData));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  async getOfflineData(key) {
    try {
      const offlineData = await AsyncStorage.getItem('offline_data');
      if (offlineData) {
        const parsedData = JSON.parse(offlineData);
        return parsedData[key]?.data || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  }

  async saveOfflineAction(action) {
    try {
      const pendingActions = await AsyncStorage.getItem('pending_actions');
      const actions = pendingActions ? JSON.parse(pendingActions) : [];
      
      actions.push({
        ...action,
        timestamp: Date.now(),
      });

      await AsyncStorage.setItem('pending_actions', JSON.stringify(actions));
    } catch (error) {
      console.error('Error saving offline action:', error);
    }
  }

  async syncOfflineData() {
    if (!this.isOnline) return;

    try {
      // Sync pending actions
      await this.syncPendingActions();
      
      // Sync offline analytics
      await this.syncOfflineAnalytics();
      
      // Clear old offline data
      await this.cleanupOldOfflineData();
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  }

  async syncPendingActions() {
    try {
      const pendingActions = await AsyncStorage.getItem('pending_actions');
      
      if (pendingActions) {
        const actions = JSON.parse(pendingActions);
        
        for (const action of actions) {
          try {
            await this.executeAction(action);
          } catch (error) {
            console.error('Error executing pending action:', error);
          }
        }
        
        // Clear pending actions after successful sync
        await AsyncStorage.removeItem('pending_actions');
        console.log(`Synced ${actions.length} pending actions`);
      }
    } catch (error) {
      console.error('Error syncing pending actions:', error);
    }
  }

  async executeAction(action) {
    switch (action.type) {
      case 'update_profile':
        await firestore()
          .collection('users')
          .doc(action.userId)
          .update(action.data);
        break;
      
      case 'send_message':
        await firestore()
          .collection('matches')
          .doc(action.matchId)
          .collection('messages')
          .add(action.messageData);
        break;
      
      case 'create_match':
        await firestore()
          .collection('matches')
          .add(action.matchData);
        break;
      
      case 'report_user':
        await firestore()
          .collection('reports')
          .add(action.reportData);
        break;
      
      default:
        console.log('Unknown action type:', action.type);
    }
  }

  async syncOfflineAnalytics() {
    try {
      const offlineAnalytics = await AsyncStorage.getItem('offline_analytics');
      
      if (offlineAnalytics) {
        const events = JSON.parse(offlineAnalytics);
        
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
        await AsyncStorage.removeItem('offline_analytics');
        
        console.log(`Synced ${events.length} offline analytics events`);
      }
    } catch (error) {
      console.error('Error syncing offline analytics:', error);
    }
  }

  async cleanupOldOfflineData() {
    try {
      const offlineData = await AsyncStorage.getItem('offline_data');
      
      if (offlineData) {
        const parsedData = JSON.parse(offlineData);
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        Object.keys(parsedData).forEach(key => {
          if (now - parsedData[key].timestamp > maxAge) {
            delete parsedData[key];
          }
        });
        
        await AsyncStorage.setItem('offline_data', JSON.stringify(parsedData));
      }
    } catch (error) {
      console.error('Error cleaning up offline data:', error);
    }
  }

  // Offline-first data fetching
  async fetchWithOfflineFallback(collection, docId, offlineKey) {
    try {
      if (this.isOnline) {
        const doc = await firestore().collection(collection).doc(docId).get();
        const data = doc.data();
        
        // Save to offline storage
        await this.saveOfflineData(offlineKey, data);
        
        return data;
      } else {
        // Return offline data
        return await this.getOfflineData(offlineKey);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Fallback to offline data
      return await this.getOfflineData(offlineKey);
    }
  }

  // Offline-first data updates
  async updateWithOfflineFallback(collection, docId, data, actionType) {
    try {
      if (this.isOnline) {
        await firestore().collection(collection).doc(docId).update(data);
      } else {
        // Save action for later sync
        await this.saveOfflineAction({
          type: actionType,
          collection,
          docId,
          data,
        });
      }
    } catch (error) {
      console.error('Error updating data:', error);
      
      // Save action for later sync
      await this.saveOfflineAction({
        type: actionType,
        collection,
        docId,
        data,
      });
    }
  }

  // Cache management
  async clearCache() {
    try {
      await AsyncStorage.removeItem('offline_data');
      await AsyncStorage.removeItem('pending_actions');
      await AsyncStorage.removeItem('offline_analytics');
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async getCacheSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  // Network status
  isConnected() {
    return this.isOnline;
  }

  async getNetworkState() {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
    };
  }
}

export default new OfflineService();
