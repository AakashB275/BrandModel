import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  Image,
  Animated,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import AnalyticsService from '../services/AnalyticsService';
import ErrorService from '../services/ErrorService';
import LocationService from '../services/LocationService';

const {width, height} = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = height * 0.7;

const SwipeScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {user} = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      
      // Get user's preferences
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      
      // Query for profiles based on user type and preferences
      const targetUserType = userData.userType === 'model' ? 'brand' : 'model';
      
      let query = firestore()
        .collection('users')
        .where('userType', '==', targetUserType)
        .where('isVerified', '==', true)
        .where('profileComplete', '==', true)
        .where('isActive', '==', true);

      // Add distance filter if location is set
      if (userData.location) {
        // For now, we'll get all profiles and filter by distance on client side
        // In production, you'd use GeoFirestore for location-based queries
      }

      const snapshot = await query.limit(20).get();
      const profileList = [];

      snapshot.forEach(doc => {
        const profileData = doc.data();
        // Filter out already swiped profiles
        if (!userData.swipedProfiles?.includes(doc.id)) {
          profileList.push({
            id: doc.id,
            ...profileData,
          });
        }
      });

      setProfiles(profileList);
    } catch (error) {
      console.error('Error loading profiles:', error);
      Alert.alert('Error', 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
    },
    onPanResponderGrant: () => {
      position.setOffset({
        x: position.x._value,
        y: position.y._value,
      });
    },
    onPanResponderMove: (_, gestureState) => {
      position.setValue({x: gestureState.dx, y: gestureState.dy});
    },
    onPanResponderRelease: (_, gestureState) => {
      position.flattenOffset();
      
      if (gestureState.dx > 120) {
        // Swipe right (like)
        handleSwipe('right');
      } else if (gestureState.dx < -120) {
        // Swipe left (pass)
        handleSwipe('left');
      } else {
        // Return to center
        Animated.spring(position, {
          toValue: {x: 0, y: 0},
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const handleSwipe = async (direction) => {
    if (currentIndex >= profiles.length) return;

    const currentProfile = profiles[currentIndex];
    
    // Track swipe analytics
    AnalyticsService.trackSwipe(direction, currentProfile.id, currentProfile.userType);
    
    // Animate card off screen
    Animated.timing(position, {
      toValue: {
        x: direction === 'right' ? width : -width,
        y: 0,
      },
      duration: 300,
      useNativeDriver: false,
    }).start(async () => {
      // Reset position for next card
      position.setValue({x: 0, y: 0});
      
      try {
        // Update user's swiped profiles
        await firestore().collection('users').doc(user.uid).update({
          swipedProfiles: firestore.FieldValue.arrayUnion(currentProfile.id),
        });

        if (direction === 'right') {
          // Check if it's a match
          await handleLike(currentProfile);
        }
      } catch (error) {
        ErrorService.logError(error, {context: 'swipe_action'});
      }

      setCurrentIndex(prev => prev + 1);
    });
  };

  const handleLike = async (profile) => {
    try {
      // Check if the other user has already liked this user
      const otherUserDoc = await firestore().collection('users').doc(profile.id).get();
      const otherUserData = otherUserDoc.data();
      
      if (otherUserData.likedProfiles?.includes(user.uid)) {
        // It's a match!
        await createMatch(profile);
      } else {
        // Add to liked profiles
        await firestore().collection('users').doc(profile.id).update({
          likedProfiles: firestore.FieldValue.arrayUnion(user.uid),
        });
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const createMatch = async (profile) => {
    try {
      const matchData = {
        users: [user.uid, profile.id],
        createdAt: firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isActive: true,
        messages: [],
      };

      const matchRef = await firestore().collection('matches').add(matchData);
      
      // Update both users' match lists
      await Promise.all([
        firestore().collection('users').doc(user.uid).update({
          matches: firestore.FieldValue.arrayUnion(matchRef.id),
        }),
        firestore().collection('users').doc(profile.id).update({
          matches: firestore.FieldValue.arrayUnion(matchRef.id),
        }),
      ]);

      // Track match analytics
      AnalyticsService.trackMatch(matchRef.id, profile.id, profile.userType);

      // Show match animation/modal
      Alert.alert(
        'It\'s a Match! 🎉',
        `You and ${profile.firstName || 'this user'} have matched!`,
        [
          {
            text: 'Keep Swiping',
            style: 'cancel',
          },
          {
            text: 'Start Chat',
            onPress: () => navigation.navigate('Chat', {matchId: matchRef.id}),
          },
        ]
      );
    } catch (error) {
      ErrorService.logError(error, {context: 'match_creation'});
    }
  };

  const handlePass = () => {
    handleSwipe('left');
  };

  const handleSuperLike = () => {
    if (!user.isPremium) {
      setShowPremiumModal(true);
      return;
    }
    handleSwipe('right');
  };

  const renderCard = (profile, index) => {
    if (index < currentIndex) return null;

    const isCurrentCard = index === currentIndex;
    const translateX = isCurrentCard ? position.x : 0;
    const translateY = isCurrentCard ? position.y : 0;
    const scale = isCurrentCard ? 1 : 0.95;

    return (
      <Animated.View
        key={profile.id}
        style={[
          styles.card,
          {
            transform: [
              {translateX},
              {translateY},
              {rotate: isCurrentCard ? rotate : '0deg'},
              {scale},
            ],
            zIndex: profiles.length - index,
          },
        ]}
        {...(isCurrentCard ? panResponder.panHandlers : {})}>
        
        <Image
          source={{uri: profile.photos?.[0]?.url}}
          style={styles.cardImage}
          resizeMode="cover"
        />
        
        <View style={styles.cardOverlay}>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, {color: theme.colors.background}]}>
              {profile.firstName} {profile.lastName}
            </Text>
            <Text style={[styles.cardAge, {color: theme.colors.background}]}>
              {profile.userType === 'model' ? 'Model' : 'Brand'}
            </Text>
            <Text style={[styles.cardBio, {color: theme.colors.background}]}>
              {profile.bio}
            </Text>
            
            <View style={styles.tagsContainer}>
              {profile.tags?.slice(0, 3).map((tag, tagIndex) => (
                <View key={tagIndex} style={styles.tag}>
                  <Text style={[styles.tagText, {color: theme.colors.background}]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="favorite" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, {color: theme.colors.text}]}>
        No More Profiles
      </Text>
      <Text style={[styles.emptySubtitle, {color: theme.colors.textSecondary}]}>
        Check back later for new profiles or adjust your preferences
      </Text>
      <TouchableOpacity
        style={[styles.refreshButton, {backgroundColor: theme.colors.primary}]}
        onPress={loadProfiles}>
        <Text style={[styles.refreshButtonText, {color: theme.colors.background}]}>
          Refresh
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, {color: theme.colors.text}]}>
            Loading profiles...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
        {renderEmptyState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
          BrandMatch
        </Text>
        <TouchableOpacity
          style={styles.premiumButton}
          onPress={() => navigation.navigate('PremiumUpgrade')}>
          <Icon name="star" size={20} color={theme.colors.premium} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        {profiles.map((profile, index) => renderCard(profile, index))}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={handlePass}>
          <Icon name="close" size={24} color={theme.colors.error} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.superLikeButton]}
          onPress={handleSuperLike}>
          <Icon name="star" size={24} color={theme.colors.premium} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleSwipe('right')}>
          <Icon name="favorite" size={24} color={theme.colors.success} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  premiumButton: {
    padding: 8,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 20,
  },
  cardInfo: {
    marginBottom: 16,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardAge: {
    fontSize: 16,
    marginBottom: 8,
  },
  cardBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 40,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  passButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#F44336',
  },
  superLikeButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  likeButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SwipeScreen;
