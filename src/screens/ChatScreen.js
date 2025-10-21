import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {GiftedChat, Bubble, InputToolbar, Composer, Send} from 'react-native-gifted-chat';
import firestore from '@react-native-firebase/firestore';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';

const ChatScreen = ({navigation, route}) => {
  const {theme} = useTheme();
  const {user} = useAuth();
  const {matchId} = route.params;
  
  const [messages, setMessages] = useState([]);
  const [match, setMatch] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');
  
  const messagesRef = useRef(null);

  useEffect(() => {
    loadMatchData();
    setupMessagesListener();
    
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [matchId]);

  const loadMatchData = async () => {
    try {
      const matchDoc = await firestore().collection('matches').doc(matchId).get();
      if (!matchDoc.exists) {
        Alert.alert('Error', 'Match not found');
        navigation.goBack();
        return;
      }
      
      const matchData = matchDoc.data();
      setMatch(matchData);
      
      const otherUserId = matchData.users.find(id => id !== user.uid);
      const otherUserDoc = await firestore().collection('users').doc(otherUserId).get();
      const otherUserData = otherUserDoc.data();
      
      setOtherUser({
        id: otherUserId,
        ...otherUserData,
      });
      
      updateTimeRemaining();
    } catch (error) {
      console.error('Error loading match data:', error);
      Alert.alert('Error', 'Failed to load match data');
    } finally {
      setLoading(false);
    }
  };

  const setupMessagesListener = () => {
    messagesRef.current = firestore()
      .collection('matches')
      .doc(matchId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({
          _id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        }));
        setMessages(newMessages);
      });
  };

  const updateTimeRemaining = () => {
    if (!match) return;
    
    const now = new Date();
    const expiry = match.expiresAt.toDate();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) {
      setTimeRemaining('Expired');
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m left`);
    } else {
      setTimeRemaining(`${minutes}m left`);
    }
  };

  const onSend = async (newMessages = []) => {
    if (!match || timeRemaining === 'Expired') {
      Alert.alert('Match Expired', 'This match has expired. Upgrade to Premium to extend match timers.');
      return;
    }

    try {
      const message = newMessages[0];
      const messageData = {
        ...message,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore()
        .collection('matches')
        .doc(matchId)
        .collection('messages')
        .add(messageData);

      // Update match with latest message
      await firestore().collection('matches').doc(matchId).update({
        lastMessage: message.text,
        lastMessageAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleUnmatch = () => {
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
              
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to unmatch');
            }
          },
        },
      ]
    );
  };

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: theme.colors.primary,
          },
          left: {
            backgroundColor: theme.colors.surface,
          },
        }}
        textStyle={{
          right: {
            color: theme.colors.background,
          },
          left: {
            color: theme.colors.text,
          },
        }}
      />
    );
  };

  const renderInputToolbar = (props) => {
    if (timeRemaining === 'Expired') {
      return (
        <View style={[styles.expiredInput, {backgroundColor: theme.colors.border}]}>
          <Text style={[styles.expiredText, {color: theme.colors.textSecondary}]}>
            Match expired - Upgrade to Premium to extend
          </Text>
        </View>
      );
    }
    
    return <InputToolbar {...props} />;
  };

  const renderComposer = (props) => {
    return (
      <Composer
        {...props}
        textInputStyle={{
          color: theme.colors.text,
          fontSize: 16,
        }}
        placeholder="Type a message..."
        placeholderTextColor={theme.colors.textSecondary}
      />
    );
  };

  const renderSend = (props) => {
    return (
      <Send {...props}>
        <View style={[styles.sendButton, {backgroundColor: theme.colors.primary}]}>
          <Icon name="send" size={20} color={theme.colors.background} />
        </View>
      </Send>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, {color: theme.colors.text}]}>
            Loading chat...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!match || !otherUser) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, {color: theme.colors.text}]}>
            Chat not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}>
        
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, {color: theme.colors.text}]}>
              {otherUser.firstName} {otherUser.lastName}
            </Text>
            <Text style={[styles.headerType, {color: theme.colors.textSecondary}]}>
              {otherUser.userType === 'model' ? 'Model' : 'Brand'}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <Text style={[
              styles.timeRemaining,
              {
                color: timeRemaining === 'Expired' 
                  ? theme.colors.error 
                  : theme.colors.textSecondary,
              },
            ]}>
              {timeRemaining}
            </Text>
            
            <TouchableOpacity
              style={styles.unmatchButton}
              onPress={handleUnmatch}>
              <Icon name="close" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: user.uid,
            name: `${user.firstName} ${user.lastName}`,
            avatar: user.photos?.[0]?.url,
          }}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderSend={renderSend}
          placeholder="Type a message..."
          alwaysShowSend
          scrollToBottom
          infiniteScroll
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerType: {
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRemaining: {
    fontSize: 12,
    marginRight: 12,
  },
  unmatchButton: {
    padding: 8,
  },
  expiredInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  expiredText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
});

export default ChatScreen;
