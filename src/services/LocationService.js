import Geolocation from 'react-native-geolocation-service';
import {PermissionsAndroid, Platform, Alert} from 'react-native';
import firestore from '@react-native-firebase/firestore';

class LocationService {
  constructor() {
    this.currentLocation = null;
    this.watchId = null;
  }

  async requestLocationPermission() {
    if (Platform.OS === 'ios') {
      const result = await Geolocation.requestAuthorization('whenInUse');
      return result === 'granted';
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'BrandMatch needs access to your location to find nearby matches.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  }

  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const {latitude, longitude} = position.coords;
          this.currentLocation = {latitude, longitude};
          resolve({latitude, longitude});
        },
        (error) => {
          console.error('Error getting location:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  }

  async updateUserLocation(userId) {
    try {
      const hasPermission = await this.requestLocationPermission();
      
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to find nearby matches.',
        );
        return null;
      }

      const location = await this.getCurrentLocation();
      
      if (location) {
        // Save location to Firestore
        await firestore().collection('users').doc(userId).update({
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
        });

        return location;
      }
    } catch (error) {
      console.error('Error updating user location:', error);
      return null;
    }
  }

  startLocationTracking(userId) {
    if (this.watchId) {
      this.stopLocationTracking();
    }

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const {latitude, longitude} = position.coords;
        this.currentLocation = {latitude, longitude};
        
        // Update location in Firestore every 5 minutes
        firestore().collection('users').doc(userId).update({
          location: {
            latitude,
            longitude,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
        });
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 100, // Update every 100 meters
        interval: 300000, // Update every 5 minutes
        fastestInterval: 60000, // Fastest update every minute
      },
    );
  }

  stopLocationTracking() {
    if (this.watchId) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  filterProfilesByDistance(profiles, userLocation, maxDistance) {
    if (!userLocation) return profiles;

    return profiles.filter(profile => {
      if (!profile.location) return false;
      
      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        profile.location.latitude,
        profile.location.longitude,
      );
      
      return distance <= maxDistance;
    });
  }

  formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  }
}

export default new LocationService();
