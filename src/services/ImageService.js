import {launchImageLibrary, launchCamera, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import {Alert, Platform} from 'react-native';

class ImageService {
  constructor() {
    this.maxImageSize = 1024; // Max width/height in pixels
    this.quality = 0.8; // Compression quality (0-1)
    this.maxFileSize = 5 * 1024 * 1024; // 5MB max file size
  }

  showImagePickerOptions() {
    return new Promise((resolve, reject) => {
      Alert.alert(
        'Select Image',
        'Choose how you want to add an image',
        [
          {text: 'Camera', onPress: () => this.openCamera(resolve, reject)},
          {text: 'Gallery', onPress: () => this.openGallery(resolve, reject)},
          {text: 'Cancel', style: 'cancel', onPress: () => reject('cancelled')},
        ]
      );
    });
  }

  openCamera(resolve, reject) {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: this.quality,
      maxWidth: this.maxImageSize,
      maxHeight: this.maxImageSize,
      includeBase64: false,
    };

    launchCamera(options, (response) => {
      this.handleImageResponse(response, resolve, reject);
    });
  }

  openGallery(resolve, reject) {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: this.quality,
      maxWidth: this.maxImageSize,
      maxHeight: this.maxImageSize,
      includeBase64: false,
      selectionLimit: 1,
    };

    launchImageLibrary(options, (response) => {
      this.handleImageResponse(response, resolve, reject);
    });
  }

  openMultipleGallery(maxCount = 10) {
    return new Promise((resolve, reject) => {
      const options = {
        mediaType: 'photo' as MediaType,
        quality: this.quality,
        maxWidth: this.maxImageSize,
        maxHeight: this.maxImageSize,
        includeBase64: false,
        selectionLimit: maxCount,
      };

      launchImageLibrary(options, (response) => {
        this.handleMultipleImageResponse(response, resolve, reject);
      });
    });
  }

  handleImageResponse(response, resolve, reject) {
    if (response.didCancel) {
      reject('cancelled');
      return;
    }

    if (response.errorMessage) {
      reject(response.errorMessage);
      return;
    }

    if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      
      // Validate file size
      if (asset.fileSize && asset.fileSize > this.maxFileSize) {
        reject('File size too large. Please select an image smaller than 5MB.');
        return;
      }

      // Validate image dimensions
      if (asset.width && asset.height) {
        if (asset.width < 200 || asset.height < 200) {
          reject('Image too small. Please select an image at least 200x200 pixels.');
          return;
        }
      }

      resolve({
        uri: asset.uri,
        name: asset.fileName || 'image.jpg',
        type: asset.type || 'image/jpeg',
        size: asset.fileSize || 0,
        width: asset.width,
        height: asset.height,
      });
    } else {
      reject('No image selected');
    }
  }

  handleMultipleImageResponse(response, resolve, reject) {
    if (response.didCancel) {
      reject('cancelled');
      return;
    }

    if (response.errorMessage) {
      reject(response.errorMessage);
      return;
    }

    if (response.assets && response.assets.length > 0) {
      const validAssets = response.assets.filter(asset => {
        // Validate file size
        if (asset.fileSize && asset.fileSize > this.maxFileSize) {
          return false;
        }

        // Validate image dimensions
        if (asset.width && asset.height) {
          if (asset.width < 200 || asset.height < 200) {
            return false;
          }
        }

        return true;
      });

      if (validAssets.length === 0) {
        reject('No valid images selected. Please ensure images are at least 200x200 pixels and under 5MB.');
        return;
      }

      const processedAssets = validAssets.map(asset => ({
        uri: asset.uri,
        name: asset.fileName || 'image.jpg',
        type: asset.type || 'image/jpeg',
        size: asset.fileSize || 0,
        width: asset.width,
        height: asset.height,
      }));

      resolve(processedAssets);
    } else {
      reject('No images selected');
    }
  }

  async compressImage(imageUri) {
    // In a real app, you might use a library like react-native-image-resizer
    // For now, we'll return the original URI
    return imageUri;
  }

  generateImageId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  validateImage(image) {
    const errors = [];

    if (!image.uri) {
      errors.push('Image URI is required');
    }

    if (image.size && image.size > this.maxFileSize) {
      errors.push('Image size exceeds 5MB limit');
    }

    if (image.width && image.height) {
      if (image.width < 200 || image.height < 200) {
        errors.push('Image dimensions too small (minimum 200x200)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  getImageDimensions(uri) {
    return new Promise((resolve, reject) => {
      // In a real app, you'd use a library to get image dimensions
      // For now, we'll return default dimensions
      resolve({width: 400, height: 400});
    });
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default new ImageService();
