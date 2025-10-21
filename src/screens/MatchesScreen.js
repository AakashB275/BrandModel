import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';

const MatchesScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {user} = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      
      if (!user.matches || user.matches.length === 0) {
        setMatches([]);
        return;
      }

      const matchesData = await Promise.all(
        user.matches.map(async (matchId) => {
          const matchDoc = await firestore().collection('matches').doc(matchId).get();
          if (!matchDoc.exists) return null;
          
          const matchData = matchDoc.data();
          const otherUserId = matchData.users.find(id => id !== user.uid);
          
          if (!otherUserId) return null;
          
          const otherUserDoc = await firestore().collection('users').doc(otherUserId).get();
          const otherUserData = otherUserDoc.data();
          
          return {
            id: matchId,
            ...matchData,
            otherUser: {
              id: otherUserId,
              ...otherUserData,
            },
          };
        })
      );

      const validMatches = matchesData.filter(match => match !== null);
      setMatches(validMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
      Alert.alert('Error', 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = expiresAt.toDate();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else {
      return `${minutes}m left`;
    }
  };

  const handleMatchPress = (match) => {
    const now = new Date();
    const expiry = match.expiresAt.toDate();
    
    if (now > expiry) {
      Alert.alert('Match Expired', 'This match has expired. Upgrade to Premium to extend match timers.');
      return;
    }
    
    navigation.navigate('Chat', {matchId: match.id});
  };

  const handleUnmatch = async (matchId) => {
    Alert.alert(
      'Unmatch',
      'Are you sure you want to unmatch with this user?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore().collection('matches').doc(matchId).update({
                isActive: false,
              });
              
              // Remove from user's matches
              await firestore().collection('users').doc(user.uid).update({
                matches: firestore.FieldValue.arrayRemove(matchId),
              });
              
              // Reload matches
              await loadMatches();
            } catch (error) {
              Alert.alert('Error', 'Failed to unmatch');
            }
          },
        },
      ]
    );
  };

  const renderMatch = ({item: match}) => {
    const timeRemaining = formatTimeRemaining(match.expiresAt);
    const isExpired = timeRemaining === 'Expired';
    
    return (
      <TouchableOpacity
        style={[
          styles.matchCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: isExpired ? 0.6 : 1,
          },
        ]}
        onPress={() => handleMatchPress(match)}
        disabled={isExpired}>
        
        <View style={styles.matchHeader}>
          <View style={styles.matchInfo}>
            <Image
              source={{uri: match.otherUser.photos?.[0]?.url}}
              style={styles.matchAvatar}
            />
            <View style={styles.matchDetails}>
              <Text style={[styles.matchName, {color: theme.colors.text}]}>
                {match.otherUser.firstName} {match.otherUser.lastName}
              </Text>
              <Text style={[styles.matchType, {color: theme.colors.textSecondary}]}>
                {match.otherUser.userType === 'model' ? 'Model' : 'Brand'}
              </Text>
              <Text style={[
                styles.timeRemaining,
                {
                  color: isExpired ? theme.colors.error : theme.colors.textSecondary,
                },
              ]}>
                {timeRemaining}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.unmatchButton}
            onPress={() => handleUnmatch(match.id)}>
            <Icon name="close" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        {match.messages && match.messages.length > 0 && (
          <View style={styles.lastMessageContainer}>
            <Text style={[styles.lastMessage, {color: theme.colors.textSecondary}]}>
              {match.messages[match.messages.length - 1].text}
            </Text>
          </View>
        )}

        {isExpired && (
          <View style={styles.expiredOverlay}>
            <Text style={[styles.expiredText, {color: theme.colors.error}]}>
              Match Expired
            </Text>
            <TouchableOpacity
              style={[styles.upgradeButton, {backgroundColor: theme.colors.primary}]}
              onPress={() => navigation.navigate('PremiumUpgrade')}>
              <Text style={[styles.upgradeButtonText, {color: theme.colors.background}]}>
                Upgrade to Extend
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="favorite" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, {color: theme.colors.text}]}>
        No Matches Yet
      </Text>
      <Text style={[styles.emptySubtitle, {color: theme.colors.textSecondary}]}>
        Start swiping to find your perfect match!
      </Text>
      <TouchableOpacity
        style={[styles.startSwipingButton, {backgroundColor: theme.colors.primary}]}
        onPress={() => navigation.navigate('Swipe')}>
        <Text style={[styles.startSwipingButtonText, {color: theme.colors.background}]}>
          Start Swiping
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, {color: theme.colors.text}]}>
            Loading matches...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
          Matches
        </Text>
        <TouchableOpacity
          style={styles.premiumButton}
          onPress={() => navigation.navigate('PremiumUpgrade')}>
          <Icon name="star" size={20} color={theme.colors.premium} />
        </TouchableOpacity>
      </View>

      {matches.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.matchesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
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
  matchesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  matchCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    position: 'relative',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  matchAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  matchDetails: {
    flex: 1,
  },
  matchName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  matchType: {
    fontSize: 14,
    marginBottom: 2,
  },
  timeRemaining: {
    fontSize: 12,
    fontWeight: '500',
  },
  unmatchButton: {
    padding: 8,
  },
  lastMessageContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  lastMessage: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  expiredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiredText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  upgradeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  startSwipingButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startSwipingButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MatchesScreen;
