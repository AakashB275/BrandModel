import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Provider as PaperProvider} from 'react-native-paper';
import Toast from 'react-native-toast-message';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Screens
import WelcomeScreen from './screens/WelcomeScreen';
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import SignUpScreen from './screens/SignUpScreen';
import SignInScreen from './screens/SignInScreen';
import VerificationScreen from './screens/VerificationScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import MainTabNavigator from './navigation/MainTabNavigator';
import PremiumUpgradeScreen from './screens/PremiumUpgradeScreen';
import ChatScreen from './screens/ChatScreen';
import AdminScreen from './screens/AdminScreen';

// Context
import {AuthProvider} from './context/AuthContext';
import {ThemeProvider} from './context/ThemeContext';

// Services
import NotificationService from './services/NotificationService';
import AnalyticsService from './services/AnalyticsService';
import OfflineService from './services/OfflineService';
import ErrorService from './services/ErrorService';

const Stack = createStackNavigator();

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Initialize services
    const initializeServices = async () => {
      try {
        // Load offline data
        await OfflineService.loadErrorLogs();
        
        // Sync offline data if online
        if (OfflineService.isConnected()) {
          await OfflineService.syncOfflineData();
        }
        
        // Track app start
        AnalyticsService.trackEvent('app_start', {
          timestamp: Date.now(),
        });
      } catch (error) {
        ErrorService.logError(error, {context: 'service_initialization'});
      }
    };

    initializeServices();

    const subscriber = auth().onAuthStateChanged(async (user) => {
      if (user) {
        // Get user data from Firestore
        const userDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          setUser({...user, ...userData});
          
          // Initialize notifications for authenticated user
          NotificationService();
          
          // Track user session
          AnalyticsService.trackEvent('user_session_start', {
            userId: user.uid,
            userType: userData.userType,
          });
        } else {
          setUser(user);
        }
      } else {
        setUser(null);
        
        // Track session end
        AnalyticsService.trackSessionEnd();
      }
      
      if (initializing) setInitializing(false);
    });

    return subscriber;
  }, [initializing]);

  if (initializing) return null;

  return (
    <ThemeProvider>
      <PaperProvider>
        <AuthProvider>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                cardStyleInterpolator: ({current, layouts}) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateX: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [layouts.screen.width, 0],
                          }),
                        },
                      ],
                    },
                  };
                },
              }}>
              {!user ? (
                <>
                  <Stack.Screen name="Welcome" component={WelcomeScreen} />
                  <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
                  <Stack.Screen name="SignUp" component={SignUpScreen} />
                  <Stack.Screen name="SignIn" component={SignInScreen} />
                </>
              ) : (
                <>
                  {!user.isVerified ? (
                    <Stack.Screen name="Verification" component={VerificationScreen} />
                  ) : !user.profileComplete ? (
                    <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                  ) : (
                    <>
                      <Stack.Screen name="Main" component={MainTabNavigator} />
                      <Stack.Screen name="PremiumUpgrade" component={PremiumUpgradeScreen} />
                      <Stack.Screen name="Chat" component={ChatScreen} />
                      <Stack.Screen name="Admin" component={AdminScreen} />
                    </>
                  )}
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
          <Toast />
        </AuthProvider>
      </PaperProvider>
    </ThemeProvider>
  );
};

export default App;
