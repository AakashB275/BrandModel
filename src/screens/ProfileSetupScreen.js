import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchImageLibrary} from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';

const {width} = Dimensions.get('window');

const ProfileSetupScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {user, updateUserProfile} = useAuth();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    distance: 50,
    tags: [],
    collaborationTypes: [],
    budget: '',
    campaignType: '',
  });

  const isModel = user?.userType === 'model';

  const availableTags = isModel 
    ? ['streetwear', 'editorial', 'commercial', 'fashion', 'beauty', 'lifestyle', 'fitness', 'artistic']
    : ['fashion', 'beauty', 'lifestyle', 'commercial', 'editorial', 'streetwear', 'fitness', 'artistic'];

  const collaborationTypes = isModel
    ? ['paid', 'barter', 'collaboration']
    : ['paid', 'barter', 'collaboration'];

  const budgetRanges = [
    '$0 - $500',
    '$500 - $1,000',
    '$1,000 - $2,500',
    '$2,500 - $5,000',
    '$5,000+',
  ];

  const campaignTypes = [
    'Social Media',
    'Print Advertisement',
    'Website Content',
    'Product Launch',
    'Brand Ambassador',
    'Event Promotion',
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleCollaborationTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      collaborationTypes: prev.collaborationTypes.includes(type)
        ? prev.collaborationTypes.filter(t => t !== type)
        : [...prev.collaborationTypes, type]
    }));
  };

  const showImagePicker = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 10 - photos.length,
    };

    launchImageLibrary(options, (response) => {
      if (response.assets) {
        const newPhotos = response.assets.map(asset => ({
          id: Date.now().toString() + Math.random(),
          uri: asset.uri,
          name: asset.fileName || 'photo.jpg',
        }));
        setPhotos(prev => [...prev, ...newPhotos]);
      }
    });
  };

  const removePhoto = (id) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const uploadPhoto = async (photo) => {
    const filename = `${user.uid}_${photo.id}.jpg`;
    const reference = storage().ref(`profiles/${filename}`);
    
    await reference.putFile(photo.uri);
    const downloadURL = await reference.getDownloadURL();
    
    return {
      url: downloadURL,
      uploadedAt: firestore.FieldValue.serverTimestamp(),
    };
  };

  const validateForm = () => {
    if (photos.length < 4) {
      Alert.alert('Error', 'Please upload at least 4 photos');
      return false;
    }

    if (!formData.bio.trim()) {
      Alert.alert('Error', 'Please write a bio');
      return false;
    }

    if (formData.tags.length === 0) {
      Alert.alert('Error', 'Please select at least one tag');
      return false;
    }

    if (formData.collaborationTypes.length === 0) {
      Alert.alert('Error', 'Please select at least one collaboration type');
      return false;
    }

    if (!isModel && !formData.budget) {
      Alert.alert('Error', 'Please select a budget range');
      return false;
    }

    if (!isModel && !formData.campaignType) {
      Alert.alert('Error', 'Please select a campaign type');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const uploadedPhotos = await Promise.all(
        photos.map(photo => uploadPhoto(photo))
      );

      const profileData = {
        photos: uploadedPhotos,
        bio: formData.bio,
        location: formData.location,
        distance: formData.distance,
        tags: formData.tags,
        collaborationTypes: formData.collaborationTypes,
        profileComplete: true,
        ...(isModel ? {} : {
          budget: formData.budget,
          campaignType: formData.campaignType,
        }),
      };

      await updateUserProfile(profileData);

      Alert.alert(
        'Profile Complete!',
        'Your profile has been set up successfully. You can now start discovering matches!',
        [
          {
            text: 'Start Swiping',
            onPress: () => {
              // Navigation will be handled by the auth state change
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
      console.error('Profile setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: theme.colors.text}]}>
            Complete Your Profile
          </Text>
          <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
            {isModel 
              ? 'Add photos and preferences to help brands find you'
              : 'Add information about your brand and campaigns'
            }
          </Text>
        </View>

        {/* Photos Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Photos ({photos.length}/10)
          </Text>
          <Text style={[styles.sectionSubtitle, {color: theme.colors.textSecondary}]}>
            Upload 4-10 high-quality photos
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.photoItem}>
                <Image source={{uri: photo.uri}} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(photo.id)}>
                  <Icon name="close" size={16} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            
            {photos.length < 10 && (
              <TouchableOpacity
                style={[styles.addPhotoButton, {borderColor: theme.colors.primary}]}
                onPress={showImagePicker}>
                <Icon name="add" size={32} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Bio
          </Text>
          <TextInput
            style={[styles.textArea, {borderColor: theme.colors.border, color: theme.colors.text}]}
            value={formData.bio}
            onChangeText={(value) => handleInputChange('bio', value)}
            placeholder="Tell us about yourself..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={[styles.charCount, {color: theme.colors.textSecondary}]}>
            {formData.bio.length}/500
          </Text>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Location
          </Text>
          <TextInput
            style={[styles.input, {borderColor: theme.colors.border, color: theme.colors.text}]}
            value={formData.location}
            onChangeText={(value) => handleInputChange('location', value)}
            placeholder="Enter your city"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        {/* Distance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Search Distance: {formData.distance} miles
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, {color: theme.colors.textSecondary}]}>1 mile</Text>
            <View style={[styles.slider, {backgroundColor: theme.colors.border}]}>
              <View 
                style={[
                  styles.sliderFill, 
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${(formData.distance / 100) * 100}%`
                  }
                ]} 
              />
            </View>
            <Text style={[styles.sliderLabel, {color: theme.colors.textSecondary}]}>100 miles</Text>
          </View>
        </View>

        {/* Tags Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Tags
          </Text>
          <View style={styles.tagsContainer}>
            {availableTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  {
                    backgroundColor: formData.tags.includes(tag) 
                      ? theme.colors.primary 
                      : theme.colors.surface,
                    borderColor: formData.tags.includes(tag) 
                      ? theme.colors.primary 
                      : theme.colors.border,
                  },
                ]}
                onPress={() => handleTagToggle(tag)}>
                <Text style={[
                  styles.tagText,
                  {
                    color: formData.tags.includes(tag) 
                      ? theme.colors.background 
                      : theme.colors.text,
                  },
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Collaboration Types Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Collaboration Types
          </Text>
          <View style={styles.tagsContainer}>
            {collaborationTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.tag,
                  {
                    backgroundColor: formData.collaborationTypes.includes(type) 
                      ? theme.colors.secondary 
                      : theme.colors.surface,
                    borderColor: formData.collaborationTypes.includes(type) 
                      ? theme.colors.secondary 
                      : theme.colors.border,
                  },
                ]}
                onPress={() => handleCollaborationTypeToggle(type)}>
                <Text style={[
                  styles.tagText,
                  {
                    color: formData.collaborationTypes.includes(type) 
                      ? theme.colors.background 
                      : theme.colors.text,
                  },
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Brand-specific sections */}
        {!isModel && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
                Budget Range
              </Text>
              <View style={styles.optionsContainer}>
                {budgetRanges.map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[
                      styles.option,
                      {
                        backgroundColor: formData.budget === range 
                          ? theme.colors.brand 
                          : theme.colors.surface,
                        borderColor: formData.budget === range 
                          ? theme.colors.brand 
                          : theme.colors.border,
                      },
                    ]}
                    onPress={() => handleInputChange('budget', range)}>
                    <Text style={[
                      styles.optionText,
                      {
                        color: formData.budget === range 
                          ? theme.colors.background 
                          : theme.colors.text,
                      },
                    ]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
                Campaign Type
              </Text>
              <View style={styles.optionsContainer}>
                {campaignTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.option,
                      {
                        backgroundColor: formData.campaignType === type 
                          ? theme.colors.brand 
                          : theme.colors.surface,
                        borderColor: formData.campaignType === type 
                          ? theme.colors.brand 
                          : theme.colors.border,
                      },
                    ]}
                    onPress={() => handleInputChange('campaignType', type)}>
                    <Text style={[
                      styles.optionText,
                      {
                        color: formData.campaignType === type 
                          ? theme.colors.background 
                          : theme.colors.text,
                      },
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: loading ? theme.colors.border : theme.colors.primary,
            },
          ]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}>
          <Text style={[styles.submitButtonText, {color: theme.colors.background}]}>
            {loading ? 'Saving...' : 'Complete Profile'}
          </Text>
        </TouchableOpacity>
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
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  photosContainer: {
    marginTop: 16,
  },
  photoItem: {
    marginRight: 12,
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  sliderLabel: {
    fontSize: 12,
    marginHorizontal: 8,
  },
  slider: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ProfileSetupScreen;
