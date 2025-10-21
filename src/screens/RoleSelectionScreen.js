import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../context/ThemeContext';

const {width, height} = Dimensions.get('window');

const RoleSelectionScreen = ({navigation}) => {
  const {theme} = useTheme();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      navigation.navigate('SignUp', {userType: selectedRole});
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          Choose Your Role
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
          Select how you'll be using BrandMatch
        </Text>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[
              styles.roleCard,
              {
                backgroundColor: selectedRole === 'model' ? theme.colors.model : theme.colors.surface,
                borderColor: selectedRole === 'model' ? theme.colors.model : theme.colors.border,
              },
            ]}
            onPress={() => handleRoleSelection('model')}
            activeOpacity={0.8}>
            <View style={styles.roleIcon}>
              <Icon 
                name="person" 
                size={40} 
                color={selectedRole === 'model' ? theme.colors.background : theme.colors.model} 
              />
            </View>
            <Text style={[
              styles.roleTitle,
              {color: selectedRole === 'model' ? theme.colors.background : theme.colors.text}
            ]}>
              Model
            </Text>
            <Text style={[
              styles.roleDescription,
              {color: selectedRole === 'model' ? theme.colors.background : theme.colors.textSecondary}
            ]}>
              Create a portfolio, showcase your work, and connect with brands for collaborations
            </Text>
            <View style={styles.featuresList}>
              <Text style={[
                styles.feature,
                {color: selectedRole === 'model' ? theme.colors.background : theme.colors.textSecondary}
              ]}>
                • Portfolio with 4-10 photos
              </Text>
              <Text style={[
                styles.feature,
                {color: selectedRole === 'model' ? theme.colors.background : theme.colors.textSecondary}
              ]}>
                • Photo ID verification
              </Text>
              <Text style={[
                styles.feature,
                {color: selectedRole === 'model' ? theme.colors.background : theme.colors.textSecondary}
              ]}>
                • Set collaboration preferences
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleCard,
              {
                backgroundColor: selectedRole === 'brand' ? theme.colors.brand : theme.colors.surface,
                borderColor: selectedRole === 'brand' ? theme.colors.brand : theme.colors.border,
              },
            ]}
            onPress={() => handleRoleSelection('brand')}
            activeOpacity={0.8}>
            <View style={styles.roleIcon}>
              <Icon 
                name="business" 
                size={40} 
                color={selectedRole === 'brand' ? theme.colors.background : theme.colors.brand} 
              />
            </View>
            <Text style={[
              styles.roleTitle,
              {color: selectedRole === 'brand' ? theme.colors.background : theme.colors.text}
            ]}>
              Brand
            </Text>
            <Text style={[
              styles.roleDescription,
              {color: selectedRole === 'brand' ? theme.colors.background : theme.colors.textSecondary}
            ]}>
              Find verified models, create campaigns, and manage collaborations
            </Text>
            <View style={styles.featuresList}>
              <Text style={[
                styles.feature,
                {color: selectedRole === 'brand' ? theme.colors.background : theme.colors.textSecondary}
              ]}>
                • Business verification
              </Text>
              <Text style={[
                styles.feature,
                {color: selectedRole === 'brand' ? theme.colors.background : theme.colors.textSecondary}
              ]}>
                • Campaign management
              </Text>
              <Text style={[
                styles.feature,
                {color: selectedRole === 'brand' ? theme.colors.background : theme.colors.textSecondary}
              ]}>
                • Budget and collaboration types
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedRole ? theme.colors.primary : theme.colors.border,
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
          activeOpacity={0.8}>
          <Text style={[
            styles.continueButtonText,
            {color: selectedRole ? theme.colors.background : theme.colors.textSecondary}
          ]}>
            Continue
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  roleContainer: {
    gap: 20,
  },
  roleCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleIcon: {
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  featuresList: {
    alignSelf: 'stretch',
  },
  feature: {
    fontSize: 14,
    marginBottom: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default RoleSelectionScreen;
