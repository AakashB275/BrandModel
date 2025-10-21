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
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchImageLibrary} from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';

const ProfileScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {user, updateUserProfile} = useAuth();
  const [loading, setLoading] = useState(false);

  const handleEditProfile = () => {
    // Navigate to profile edit screen
    Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
  };

  const handleAddPhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, async (response) => {
      if (response.assets && response.assets[0]) {
        setLoading(true);
        try {
          const asset = response.assets[0];
          const filename = `${user.uid}_${Date.now()}.jpg`;
          const reference = storage().ref(`profiles/${filename}`);
          
          await reference.putFile(asset.uri);
          const downloadURL = await reference.getDownloadURL();
          
          const newPhoto = {
            url: downloadURL,
            uploadedAt: firestore.FieldValue.serverTimestamp(),
          };
          
          const updatedPhotos = [...(user.photos || []), newPhoto];
          await updateUserProfile({photos: updatedPhotos});
          
          Alert.alert('Success', 'Photo added successfully!');
        } catch (error) {
          Alert.alert('Error', 'Failed to add photo');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleUpgradeToPremium = () => {
    navigation.navigate('PremiumUpgrade');
  };

  const renderPhoto = (photo, index) => (
    <TouchableOpacity key={index} style={styles.photoItem}>
      <Image source={{uri: photo.url}} style={styles.photo} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
            My Profile
          </Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}>
            <Icon name="edit" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.profileCard, {backgroundColor: theme.colors.surface}]}>
          <View style={styles.profileHeader}>
            <Image
              source={{uri: user.photos?.[0]?.url}}
              style={styles.profileAvatar}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, {color: theme.colors.text}]}>
                {user.firstName} {user.lastName}
              </Text>
              <Text style={[styles.profileType, {color: theme.colors.textSecondary}]}>
                {user.userType === 'model' ? 'Model' : 'Brand'}
              </Text>
              <View style={styles.verificationBadge}>
                <Icon name="verified" size={16} color={theme.colors.success} />
                <Text style={[styles.verificationText, {color: theme.colors.success}]}>
                  Verified
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.bio, {color: theme.colors.text}]}>
            {user.bio || 'No bio added yet'}
          </Text>

          <View style={styles.tagsContainer}>
            {user.tags?.map((tag, index) => (
              <View key={index} style={[styles.tag, {backgroundColor: theme.colors.primary}]}>
                <Text style={[styles.tagText, {color: theme.colors.background}]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.photosSection}>
          <View style={styles.photosHeader}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              Photos ({user.photos?.length || 0}/10)
            </Text>
            <TouchableOpacity
              style={[styles.addPhotoButton, {backgroundColor: theme.colors.primary}]}
              onPress={handleAddPhoto}
              disabled={loading}>
              <Icon name="add" size={20} color={theme.colors.background} />
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
            {user.photos?.map((photo, index) => renderPhoto(photo, index))}
            {(!user.photos || user.photos.length < 10) && (
              <TouchableOpacity
                style={[styles.addPhotoPlaceholder, {borderColor: theme.colors.border}]}
                onPress={handleAddPhoto}>
                <Icon name="add" size={32} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Stats
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, {backgroundColor: theme.colors.surface}]}>
              <Text style={[styles.statNumber, {color: theme.colors.primary}]}>
                {user.matches?.length || 0}
              </Text>
              <Text style={[styles.statLabel, {color: theme.colors.textSecondary}]}>
                Matches
              </Text>
            </View>
            
            <View style={[styles.statItem, {backgroundColor: theme.colors.surface}]}>
              <Text style={[styles.statNumber, {color: theme.colors.secondary}]}>
                {user.swipedProfiles?.length || 0}
              </Text>
              <Text style={[styles.statLabel, {color: theme.colors.textSecondary}]}>
                Profiles Viewed
              </Text>
            </View>
            
            <View style={[styles.statItem, {backgroundColor: theme.colors.surface}]}>
              <Text style={[styles.statNumber, {color: theme.colors.success}]}>
                {user.likedProfiles?.length || 0}
              </Text>
              <Text style={[styles.statLabel, {color: theme.colors.textSecondary}]}>
                Likes Sent
              </Text>
            </View>
          </View>
        </View>

        {!user.isPremium && (
          <View style={styles.premiumSection}>
            <View style={[styles.premiumCard, {backgroundColor: theme.colors.premium}]}>
              <Icon name="star" size={32} color={theme.colors.background} />
              <Text style={[styles.premiumTitle, {color: theme.colors.background}]}>
                Upgrade to Premium
              </Text>
              <Text style={[styles.premiumSubtitle, {color: theme.colors.background}]}>
                Get more matches and exclusive features
              </Text>
              <TouchableOpacity
                style={[styles.premiumButton, {backgroundColor: theme.colors.background}]}
                onPress={handleUpgradeToPremium}>
                <Text style={[styles.premiumButtonText, {color: theme.colors.premium}]}>
                  Upgrade Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 8,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileType: {
    fontSize: 16,
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  photosSection: {
    marginBottom: 24,
  },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addPhotoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photosContainer: {
    marginTop: 16,
  },
  photoItem: {
    marginRight: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  addPhotoPlaceholder: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  premiumSection: {
    marginBottom: 20,
  },
  premiumCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  premiumButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  premiumButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
