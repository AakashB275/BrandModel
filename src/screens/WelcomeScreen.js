import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../context/ThemeContext';

const {width, height} = Dimensions.get('window');

const WelcomeScreen = ({navigation}) => {
  const {theme} = useTheme();

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.gradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={[styles.logo, {color: theme.colors.background}]}>
              BrandMatch
            </Text>
            <Text style={[styles.tagline, {color: theme.colors.background}]}>
              Where Models Meet Brands
            </Text>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={[styles.description, {color: theme.colors.background}]}>
              Discover, verify, and collaborate with verified models and brands through our swipe-based matching platform.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, {backgroundColor: theme.colors.background}]}
              onPress={() => navigation.navigate('RoleSelection')}
              activeOpacity={0.8}>
              <Text style={[styles.buttonText, {color: theme.colors.primary}]}>
                Get Started
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buttonOutline, {borderColor: theme.colors.background}]}
              onPress={() => navigation.navigate('SignIn')}
              activeOpacity={0.8}>
              <Text style={[styles.buttonOutlineText, {color: theme.colors.background}]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: height * 0.1,
    paddingBottom: height * 0.05,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '300',
    textAlign: 'center',
  },
  descriptionContainer: {
    marginVertical: 32,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonOutline: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  buttonOutlineText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
