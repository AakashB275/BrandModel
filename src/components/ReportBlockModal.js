import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  SafeAreaView,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';

const ReportBlockModal = ({visible, onClose, targetUser, onReport, onBlock}) => {
  const {theme} = useTheme();
  const {user} = useAuth();
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  const reportReasons = [
    'Inappropriate content',
    'Spam or fake profile',
    'Harassment or bullying',
    'Underage user',
    'Inappropriate behavior',
    'Other',
  ];

  const handleReport = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    if (selectedReason === 'Other' && !customReason.trim()) {
      Alert.alert('Error', 'Please provide details for your report');
      return;
    }

    setLoading(true);
    try {
      const reportData = {
        reporterId: user.uid,
        reportedUserId: targetUser.id,
        reason: selectedReason,
        customReason: selectedReason === 'Other' ? customReason : '',
        reportedAt: firestore.FieldValue.serverTimestamp(),
        status: 'pending',
      };

      await firestore().collection('reports').add(reportData);

      Alert.alert(
        'Report Submitted',
        'Thank you for your report. We will review it and take appropriate action.',
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              if (onReport) onReport();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${targetUser.firstName}? You won't see each other's profiles anymore.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Add to blocked users list
              await firestore().collection('users').doc(user.uid).update({
                blockedUsers: firestore.FieldValue.arrayUnion(targetUser.id),
              });

              // Remove any existing matches
              const matchesSnapshot = await firestore()
                .collection('matches')
                .where('users', 'array-contains', user.uid)
                .get();

              const batch = firestore().batch();
              matchesSnapshot.forEach(doc => {
                const matchData = doc.data();
                if (matchData.users.includes(targetUser.id)) {
                  batch.update(doc.ref, {
                    isActive: false,
                    blockedAt: firestore.FieldValue.serverTimestamp(),
                  });
                }
              });
              await batch.commit();

              Alert.alert(
                'User Blocked',
                `${targetUser.firstName} has been blocked successfully.`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      onClose();
                      if (onBlock) onBlock();
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert('Error', 'Failed to block user. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}>
          <Icon name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
          Report or Block
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, {color: theme.colors.text}]}>
            {targetUser.firstName} {targetUser.lastName}
          </Text>
          <Text style={[styles.userType, {color: theme.colors.textSecondary}]}>
            {targetUser.userType === 'model' ? 'Model' : 'Brand'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Why are you reporting this user?
          </Text>
          
          <View style={styles.reasonsContainer}>
            {reportReasons.map((reason, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.reasonItem,
                  {
                    backgroundColor: selectedReason === reason 
                      ? theme.colors.primary 
                      : theme.colors.surface,
                    borderColor: selectedReason === reason 
                      ? theme.colors.primary 
                      : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedReason(reason)}
                activeOpacity={0.8}>
                <Text style={[
                  styles.reasonText,
                  {
                    color: selectedReason === reason 
                      ? theme.colors.background 
                      : theme.colors.text,
                  },
                ]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedReason === 'Other' && (
            <View style={styles.customReasonContainer}>
              <Text style={[styles.customReasonLabel, {color: theme.colors.text}]}>
                Please provide details:
              </Text>
              <TextInput
                style={[styles.customReasonInput, {borderColor: theme.colors.border, color: theme.colors.text}]}
                value={customReason}
                onChangeText={setCustomReason}
                placeholder="Describe the issue..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={[styles.charCount, {color: theme.colors.textSecondary}]}>
                {customReason.length}/500
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.blockButton]}
          onPress={handleBlock}
          disabled={loading}>
          <Icon name="block" size={20} color={theme.colors.error} />
          <Text style={[styles.actionButtonText, {color: theme.colors.error}]}>
            Block User
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.reportButton,
            {
              backgroundColor: loading ? theme.colors.border : theme.colors.primary,
            },
          ]}
          onPress={handleReport}
          disabled={loading}>
          <Icon name="report" size={20} color={theme.colors.background} />
          <Text style={[styles.actionButtonText, {color: theme.colors.background}]}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userType: {
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  reasonsContainer: {
    gap: 12,
  },
  reasonItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  reasonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  customReasonContainer: {
    marginTop: 16,
  },
  customReasonLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  customReasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  blockButton: {
    borderColor: '#F44336',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  reportButton: {
    borderColor: 'transparent',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ReportBlockModal;
