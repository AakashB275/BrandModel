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

const AdminDashboard = () => {
  const {theme} = useTheme();
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const loadPendingVerifications = async () => {
    try {
      setLoading(true);
      
      const snapshot = await firestore()
        .collection('users')
        .where('verificationStatus', '==', 'pending')
        .orderBy('verificationSubmittedAt', 'desc')
        .get();
      
      const verifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setPendingVerifications(verifications);
    } catch (error) {
      console.error('Error loading verifications:', error);
      Alert.alert('Error', 'Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingVerifications();
    setRefreshing(false);
  };

  const handleVerificationDecision = async (userId, decision) => {
    try {
      await firestore().collection('users').doc(userId).update({
        verificationStatus: decision,
        verificationReviewedAt: firestore.FieldValue.serverTimestamp(),
        isVerified: decision === 'approved',
      });
      
      Alert.alert(
        'Success',
        `Verification ${decision === 'approved' ? 'approved' : 'rejected'} successfully`
      );
      
      // Reload verifications
      await loadPendingVerifications();
    } catch (error) {
      console.error('Error updating verification:', error);
      Alert.alert('Error', 'Failed to update verification status');
    }
  };

  const showVerificationDetails = (verification) => {
    Alert.alert(
      'Verification Details',
      `User: ${verification.firstName} ${verification.lastName}\n` +
      `Type: ${verification.userType}\n` +
      `Email: ${verification.email}\n` +
      `Submitted: ${verification.verificationSubmittedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}\n` +
      `Documents: ${verification.verificationDocuments?.length || 0} uploaded`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => handleVerificationDecision(verification.id, 'rejected'),
        },
        {
          text: 'Approve',
          onPress: () => handleVerificationDecision(verification.id, 'approved'),
        },
      ]
    );
  };

  const renderVerificationItem = ({item: verification}) => (
    <TouchableOpacity
      style={[styles.verificationCard, {backgroundColor: theme.colors.surface}]}
      onPress={() => showVerificationDetails(verification)}
      activeOpacity={0.8}>
      
      <View style={styles.verificationHeader}>
        <Image
          source={{uri: verification.photos?.[0]?.url}}
          style={styles.verificationAvatar}
        />
        <View style={styles.verificationInfo}>
          <Text style={[styles.verificationName, {color: theme.colors.text}]}>
            {verification.firstName} {verification.lastName}
          </Text>
          <Text style={[styles.verificationType, {color: theme.colors.textSecondary}]}>
            {verification.userType === 'model' ? 'Model' : 'Brand'}
          </Text>
          <Text style={[styles.verificationEmail, {color: theme.colors.textSecondary}]}>
            {verification.email}
          </Text>
        </View>
        <View style={styles.verificationStatus}>
          <Icon name="schedule" size={20} color={theme.colors.warning} />
        </View>
      </View>

      <View style={styles.verificationDetails}>
        <Text style={[styles.detailText, {color: theme.colors.textSecondary}]}>
          Documents: {verification.verificationDocuments?.length || 0}
        </Text>
        <Text style={[styles.detailText, {color: theme.colors.textSecondary}]}>
          Submitted: {verification.verificationSubmittedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleVerificationDecision(verification.id, 'rejected')}>
          <Icon name="close" size={16} color={theme.colors.error} />
          <Text style={[styles.actionButtonText, {color: theme.colors.error}]}>
            Reject
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleVerificationDecision(verification.id, 'approved')}>
          <Icon name="check" size={16} color={theme.colors.success} />
          <Text style={[styles.actionButtonText, {color: theme.colors.success}]}>
            Approve
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="verified" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, {color: theme.colors.text}]}>
        No Pending Verifications
      </Text>
      <Text style={[styles.emptySubtitle, {color: theme.colors.textSecondary}]}>
        All verification requests have been processed
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, {color: theme.colors.text}]}>
            Loading verifications...
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
          Admin Dashboard
        </Text>
        <Text style={[styles.headerSubtitle, {color: theme.colors.textSecondary}]}>
          Pending Verifications ({pendingVerifications.length})
        </Text>
      </View>

      {pendingVerifications.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={pendingVerifications}
          renderItem={renderVerificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.verificationsList}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  verificationsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  verificationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verificationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  verificationInfo: {
    flex: 1,
  },
  verificationName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  verificationType: {
    fontSize: 14,
    marginBottom: 2,
  },
  verificationEmail: {
    fontSize: 12,
  },
  verificationStatus: {
    padding: 8,
  },
  verificationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  rejectButton: {
    borderColor: '#F44336',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  approveButton: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
  },
});

export default AdminDashboard;
