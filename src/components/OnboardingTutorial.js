import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '../context/ThemeContext';

const {width, height} = Dimensions.get('window');

const OnboardingTutorial = ({navigation, onComplete}) => {
  const {theme} = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const markOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    await markOnboardingComplete();
    setIsVisible(false);
    if (onComplete) {
      onComplete();
    }
  };

  const tutorialSteps = [
    {
      id: 1,
      title: 'Welcome to BrandMatch',
      subtitle: 'Where Models Meet Brands',
      description: 'Discover verified models and brands through our swipe-based matching platform.',
      icon: 'favorite',
      color: theme.colors.primary,
    },
    {
      id: 2,
      title: 'Swipe to Discover',
      subtitle: 'Find Your Perfect Match',
      description: 'Swipe right to like, left to pass. When both users swipe right, it\'s a match!',
      icon: 'swipe',
      color: theme.colors.secondary,
    },
    {
      id: 3,
      title: 'Chat & Collaborate',
      subtitle: 'Connect Instantly',
      description: 'Once matched, you have 24 hours to start chatting and plan your collaboration.',
      icon: 'chat',
      color: theme.colors.accent,
    },
    {
      id: 4,
      title: 'Get Verified',
      subtitle: 'Build Trust',
      description: 'Models verify with photo ID, brands with business documents. Safety first!',
      icon: 'verified',
      color: theme.colors.success,
    },
    {
      id: 5,
      title: 'Go Premium',
      subtitle: 'Unlock More Features',
      description: 'Get extended match timers, see who liked you, and stay visible when inactive.',
      icon: 'star',
      color: theme.colors.premium,
    },
  ];

  if (!isVisible) {
    return null;
  }

  const currentStepData = tutorialSteps[currentStep];

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, {backgroundColor: currentStepData.color}]}>
            <Icon name={currentStepData.icon} size={48} color={theme.colors.background} />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, {color: theme.colors.text}]}>
            {currentStepData.title}
          </Text>
          <Text style={[styles.subtitle, {color: currentStepData.color}]}>
            {currentStepData.subtitle}
          </Text>
          <Text style={[styles.description, {color: theme.colors.textSecondary}]}>
            {currentStepData.description}
          </Text>
        </View>

        <View style={styles.stepIndicator}>
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                {
                  backgroundColor: index === currentStep 
                    ? currentStepData.color 
                    : theme.colors.border,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}>
          <Text style={[styles.skipButtonText, {color: theme.colors.textSecondary}]}>
            Skip
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, {backgroundColor: currentStepData.color}]}
          onPress={handleNext}>
          <Text style={[styles.nextButtonText, {color: theme.colors.background}]}>
            {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingTutorial;
