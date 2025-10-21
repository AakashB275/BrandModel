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
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useStripe} from '@stripe/stripe-react-native';
import firestore from '@react-native-firebase/firestore';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';

const {width} = Dimensions.get('window');

const PremiumUpgradeScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {user, updateUserProfile} = useAuth();
  const {initPaymentSheet, presentPaymentSheet} = useStripe();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const plans = {
    monthly: {
      id: 'premium_monthly',
      price: '$9.99',
      period: 'month',
      features: [
        '48-hour match timer',
        'See who liked you',
        'Stay visible when inactive',
        'Unlimited super likes',
        'Priority customer support',
      ],
    },
    yearly: {
      id: 'premium_yearly',
      price: '$99.99',
      period: 'year',
      originalPrice: '$119.88',
      discount: '17% OFF',
      features: [
        '48-hour match timer',
        'See who liked you',
        'Stay visible when inactive',
        'Unlimited super likes',
        'Priority customer support',
        'Exclusive premium features',
      ],
    },
  };

  const handleUpgrade = async () => {
    if (loading) return;

    setLoading(true);
    try {
      // In a real app, you would:
      // 1. Create a payment intent on your backend
      // 2. Initialize the payment sheet
      // 3. Present the payment sheet
      
      // For demo purposes, we'll simulate a successful payment
      await simulatePayment();
      
      Alert.alert(
        'Welcome to Premium! 🎉',
        'Your premium subscription is now active. Enjoy all the premium features!',
        [
          {
            text: 'Start Using Premium',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Failed', 'Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const simulatePayment = async () => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update user to premium
    await updateUserProfile({
      isPremium: true,
      premiumExpiresAt: new Date(Date.now() + (selectedPlan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
      premiumPlan: selectedPlan,
    });
  };

  const renderFeature = (feature, index) => (
    <View key={index} style={styles.featureItem}>
      <Icon name="check-circle" size={20} color={theme.colors.success} />
      <Text style={[styles.featureText, {color: theme.colors.text}]}>
        {feature}
      </Text>
    </View>
  );

  const renderPlanCard = (planKey, plan) => {
    const isSelected = selectedPlan === planKey;
    const isYearly = planKey === 'yearly';
    
    return (
      <TouchableOpacity
        key={planKey}
        style={[
          styles.planCard,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setSelectedPlan(planKey)}
        activeOpacity={0.8}>
        
        {isYearly && (
          <View style={[styles.discountBadge, {backgroundColor: theme.colors.success}]}>
            <Text style={[styles.discountText, {color: theme.colors.background}]}>
              {plan.discount}
            </Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <Text style={[
            styles.planName,
            {color: isSelected ? theme.colors.background : theme.colors.text}
          ]}>
            {isYearly ? 'Premium Yearly' : 'Premium Monthly'}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={[
              styles.planPrice,
              {color: isSelected ? theme.colors.background : theme.colors.text}
            ]}>
              {plan.price}
            </Text>
            <Text style={[
              styles.planPeriod,
              {color: isSelected ? theme.colors.background : theme.colors.textSecondary}
            ]}>
              /{plan.period}
            </Text>
          </View>
          {isYearly && (
            <Text style={[styles.originalPrice, {color: theme.colors.textSecondary}]}>
              {plan.originalPrice}
            </Text>
          )}
        </View>
        
        <View style={styles.planFeatures}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Icon 
                name="check-circle" 
                size={16} 
                color={isSelected ? theme.colors.background : theme.colors.success} 
              />
              <Text style={[
                styles.featureText,
                {color: isSelected ? theme.colors.background : theme.colors.text}
              ]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
            Upgrade to Premium
          </Text>
        </View>

        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.heroSection}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <View style={styles.heroContent}>
            <Icon name="star" size={48} color={theme.colors.background} />
            <Text style={[styles.heroTitle, {color: theme.colors.background}]}>
              Unlock Premium Features
            </Text>
            <Text style={[styles.heroSubtitle, {color: theme.colors.background}]}>
              Get more matches, better visibility, and exclusive features
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.benefitsSection}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Premium Benefits
          </Text>
          
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitItem}>
              <Icon name="schedule" size={32} color={theme.colors.primary} />
              <Text style={[styles.benefitTitle, {color: theme.colors.text}]}>
                48-Hour Timer
              </Text>
              <Text style={[styles.benefitDescription, {color: theme.colors.textSecondary}]}>
                Extended match timer for more time to chat
              </Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Icon name="visibility" size={32} color={theme.colors.primary} />
              <Text style={[styles.benefitTitle, {color: theme.colors.text}]}>
                See Who Liked You
              </Text>
              <Text style={[styles.benefitDescription, {color: theme.colors.textSecondary}]}>
                View profiles of users who liked you
              </Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Icon name="visibility-off" size={32} color={theme.colors.primary} />
              <Text style={[styles.benefitTitle, {color: theme.colors.text}]}>
                Stay Visible
              </Text>
              <Text style={[styles.benefitDescription, {color: theme.colors.textSecondary}]}>
                Remain visible even when inactive
              </Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Icon name="star" size={32} color={theme.colors.premium} />
              <Text style={[styles.benefitTitle, {color: theme.colors.text}]}>
                Unlimited Super Likes
              </Text>
              <Text style={[styles.benefitDescription, {color: theme.colors.textSecondary}]}>
                Send unlimited super likes to stand out
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.plansSection}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Choose Your Plan
          </Text>
          
          <View style={styles.plansContainer}>
            {Object.entries(plans).map(([key, plan]) => renderPlanCard(key, plan))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.upgradeButton,
            {
              backgroundColor: loading ? theme.colors.border : theme.colors.primary,
            },
          ]}
          onPress={handleUpgrade}
          disabled={loading}
          activeOpacity={0.8}>
          <Text style={[styles.upgradeButtonText, {color: theme.colors.background}]}>
            {loading ? 'Processing...' : `Upgrade to Premium - ${plans[selectedPlan].price}/${plans[selectedPlan].period}`}
          </Text>
        </TouchableOpacity>

        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, {color: theme.colors.textSecondary}]}>
            By upgrading, you agree to our Terms of Service and Privacy Policy. 
            Subscription will auto-renew unless cancelled.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  heroSection: {
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  benefitsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  benefitItem: {
    width: (width - 60) / 2,
    alignItems: 'center',
    marginBottom: 24,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  plansSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 24,
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  planPeriod: {
    fontSize: 16,
    marginLeft: 4,
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  planFeatures: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  upgradeButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  termsContainer: {
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PremiumUpgradeScreen;
