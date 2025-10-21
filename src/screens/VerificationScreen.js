import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';

const VerificationScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {user, updateUserProfile} = useAuth();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);

  const isModel = user?.userType === 'model';

  const showImagePicker = () => {
    Alert.alert(
      'Select Document',
      'Choose how you want to upload your document',
      [
        {text: 'Camera', onPress: () => openCamera()},
        {text: 'Gallery', onPress: () => openGallery()},
        {text: 'Cancel', style: 'cancel'},
      ]
    );
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchCamera(options, (response) => {
      if (response.assets && response.assets[0]) {
        handleImageSelection(response.assets[0]);
      }
    });
  };

  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, (response) => {
      if (response.assets && response.assets[0]) {
        handleImageSelection(response.assets[0]);
      }
    });
  };

  const openDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
      });
      
      if (result && result[0]) {
        handleDocumentSelection(result[0]);
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker
      } else {
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  const handleImageSelection = (asset) => {
    const newDocument = {
      id: Date.now().toString(),
      uri: asset.uri,
      name: asset.fileName || 'document.jpg',
      type: asset.type || 'image/jpeg',
      size: asset.fileSize || 0,
    };
    setDocuments(prev => [...prev, newDocument]);
  };

  const handleDocumentSelection = (document) => {
    const newDocument = {
      id: Date.now().toString(),
      uri: document.uri,
      name: document.name,
      type: document.type,
      size: document.size,
    };
    setDocuments(prev => [...prev, newDocument]);
  };

  const removeDocument = (id) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const uploadDocument = async (document) => {
    const filename = `${user.uid}_${document.id}.${document.type.split('/')[1]}`;
    const reference = storage().ref(`verification/${filename}`);
    
    await reference.putFile(document.uri);
    const downloadURL = await reference.getDownloadURL();
    
    return {
      name: document.name,
      type: document.type,
      url: downloadURL,
      uploadedAt: firestore.FieldValue.serverTimestamp(),
    };
  };

  const handleSubmitVerification = async () => {
    if (documents.length === 0) {
      Alert.alert('Error', 'Please upload at least one document');
      return;
    }

    setLoading(true);
    try {
      const uploadedDocuments = await Promise.all(
        documents.map(doc => uploadDocument(doc))
      );

      await updateUserProfile({
        verificationDocuments: uploadedDocuments,
        verificationStatus: 'pending',
        verificationSubmittedAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert(
        'Verification Submitted',
        'Your documents have been submitted for review. You will be notified once verification is complete.',
        [
          {
            text: 'OK',
            onPress: () => {
              // User will be redirected to profile setup once verified
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit verification documents');
      console.error('Verification error:', error);
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
            Identity Verification
          </Text>
          <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
            {isModel 
              ? 'Upload a clear photo of your government-issued ID to verify your identity'
              : 'Upload your business registration documents to verify your brand'
            }
          </Text>
        </View>

        <View style={styles.requirementsContainer}>
          <Text style={[styles.requirementsTitle, {color: theme.colors.text}]}>
            Requirements:
          </Text>
          {isModel ? (
            <>
              <Text style={[styles.requirement, {color: theme.colors.textSecondary}]}>
                • Government-issued photo ID (driver's license, passport, etc.)
              </Text>
              <Text style={[styles.requirement, {color: theme.colors.textSecondary}]}>
                • Clear, well-lit photo
              </Text>
              <Text style={[styles.requirement, {color: theme.colors.textSecondary}]}>
                • All text must be readable
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.requirement, {color: theme.colors.textSecondary}]}>
                • Business registration certificate
              </Text>
              <Text style={[styles.requirement, {color: theme.colors.textSecondary}]}>
                • Tax ID or business license
              </Text>
              <Text style={[styles.requirement, {color: theme.colors.textSecondary}]}>
                • Company logo or branding materials
              </Text>
            </>
          )}
        </View>

        <View style={styles.uploadContainer}>
          <TouchableOpacity
            style={[styles.uploadButton, {borderColor: theme.colors.primary}]}
            onPress={isModel ? showImagePicker : openDocumentPicker}
            activeOpacity={0.8}>
            <Icon name="cloud-upload" size={32} color={theme.colors.primary} />
            <Text style={[styles.uploadText, {color: theme.colors.primary}]}>
              {isModel ? 'Upload Photo ID' : 'Upload Documents'}
            </Text>
            <Text style={[styles.uploadSubtext, {color: theme.colors.textSecondary}]}>
              Tap to select files
            </Text>
          </TouchableOpacity>
        </View>

        {documents.length > 0 && (
          <View style={styles.documentsContainer}>
            <Text style={[styles.documentsTitle, {color: theme.colors.text}]}>
              Uploaded Documents:
            </Text>
            {documents.map((doc) => (
              <View key={doc.id} style={[styles.documentItem, {backgroundColor: theme.colors.surface}]}>
                <View style={styles.documentInfo}>
                  <Icon name="description" size={24} color={theme.colors.primary} />
                  <View style={styles.documentDetails}>
                    <Text style={[styles.documentName, {color: theme.colors.text}]}>
                      {doc.name}
                    </Text>
                    <Text style={[styles.documentSize, {color: theme.colors.textSecondary}]}>
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeDocument(doc.id)}>
                  <Icon name="close" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.privacyContainer}>
          <Icon name="security" size={20} color={theme.colors.success} />
          <Text style={[styles.privacyText, {color: theme.colors.textSecondary}]}>
            Your documents are encrypted and stored securely. They will only be used for verification purposes.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: documents.length > 0 && !loading 
                ? theme.colors.primary 
                : theme.colors.border,
            },
          ]}
          onPress={handleSubmitVerification}
          disabled={documents.length === 0 || loading}
          activeOpacity={0.8}>
          <Text style={[styles.submitButtonText, {color: theme.colors.background}]}>
            {loading ? 'Submitting...' : 'Submit for Verification'}
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
  requirementsContainer: {
    marginBottom: 32,
  },
  requirementsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  requirement: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  uploadContainer: {
    marginBottom: 32,
  },
  uploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 14,
  },
  documentsContainer: {
    marginBottom: 32,
  },
  documentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
  },
  documentSize: {
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default VerificationScreen;
