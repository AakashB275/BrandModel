import React, {useEffect, useState} from 'react';
import {
  Platform,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import {useAuth} from '../context/AuthContext';

const NotificationService = () => {
  const {user} = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (user && !initialized) {
      initializeNotifications();
    }
  }, [user, initialized]);

  const requestPermission = async () => {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        return true;
      }
      return false;
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  };

  const initializeNotifications = async () => {
    try {
      const hasPermission = await requestPermission();
      
      if (hasPermission) {
        // Get FCM token
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
        
        // Save token to user document
        if (user?.uid) {
          await firestore().collection('users').doc(user.uid).update({
            fcmToken: token,
            lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
          });
        }

        // Set up message handlers
        setupMessageHandlers();
        
        setInitialized(true);
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const setupMessageHandlers = () => {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background!', remoteMessage);
    });

    // Handle foreground messages
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('A new FCM message arrived!', remoteMessage);
      
      // Show local notification for foreground messages
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'BrandMatch',
          remoteMessage.notification.body || 'You have a new message',
          [
            {text: 'OK', style: 'default'},
          ]
        );
      }
    });

    // Handle notification tap
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      handleNotificationTap(remoteMessage);
    });

    // Handle notification tap when app is closed
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          handleNotificationTap(remoteMessage);
        }
      });

    return unsubscribe;
  };

  const handleNotificationTap = (remoteMessage) => {
    const {data} = remoteMessage;
    
    if (data?.type === 'match') {
      // Navigate to matches screen
      // This would need to be handled by the navigation context
      console.log('Navigate to matches screen');
    } else if (data?.type === 'message') {
      // Navigate to chat screen
      console.log('Navigate to chat:', data.matchId);
    }
  };

  const sendNotification = async (targetUserId, notification) => {
    try {
      // In a real app, you would send this to your backend
      // which would then send the FCM message
      console.log('Sending notification to:', targetUserId, notification);
      
      // For now, we'll just log it
      // In production, you'd call your backend API
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const sendMatchNotification = async (targetUserId, matchData) => {
    await sendNotification(targetUserId, {
      type: 'match',
      title: 'New Match! 🎉',
      body: `You have a new match with ${matchData.name}`,
      data: {
        type: 'match',
        matchId: matchData.matchId,
      },
    });
  };

  const sendMessageNotification = async (targetUserId, messageData) => {
    await sendNotification(targetUserId, {
      type: 'message',
      title: `New message from ${messageData.senderName}`,
      body: messageData.message,
      data: {
        type: 'message',
        matchId: messageData.matchId,
      },
    });
  };

  return {
    sendMatchNotification,
    sendMessageNotification,
    initialized,
  };
};

export default NotificationService;
