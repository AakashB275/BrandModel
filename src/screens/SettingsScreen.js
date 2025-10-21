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
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';

const SettingsScreen = ({navigation}) => {
  const {theme, isDarkMode, toggleTheme} = useTheme();
  const {user, signOut, updateUserProfile} = useAuth();
  const [adminTapCount, setAdminTapCount] = useState(0);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Feature Coming Soon', 'Account deletion will be available in a future update.');
          },
        },
      ]
    );
  };

  const handleUpdateLocation = () => {
    Alert.alert('Update Location', 'Location update feature coming soon!');
  };

  const handleUpdateDistance = () => {
    Alert.alert('Update Distance', 'Distance update feature coming soon!');
  };

  const handleNotificationSettings = () => {
    Alert.alert('Notifications', 'Notification settings coming soon!');
  };

  const handlePrivacySettings = () => {
    Alert.alert('Privacy', 'Privacy settings coming soon!');
  };

  const handleHelpSupport = () => {
    Alert.alert('Help & Support', 'Help and support feature coming soon!');
  };

  const handleTermsPrivacy = () => {
    Alert.alert('Terms & Privacy', 'Terms and privacy policy coming soon!');
  };

  const handleAdminAccess = () => {
    setAdminTapCount(prev => prev + 1);
    if (adminTapCount >= 4) {
      Alert.alert(
        'Admin Access',
        'Enter admin mode?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Enter',
            onPress: () => navigation.navigate('Admin'),
          },
        ]
      );
      setAdminTapCount(0);
    }
  };

  const renderSettingItem = (icon, title, onPress, rightElement = null, showArrow = true) => (
    <TouchableOpacity
      style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.settingLeft}>
        <Icon name={icon} size={24} color={theme.colors.textSecondary} />
        <Text style={[styles.settingTitle, {color: theme.colors.text}]}>
          {title}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showArrow && (
          <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
            Settings
          </Text>
        </View>

        <View style={[styles.section, {backgroundColor: theme.colors.surface}]}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Account
          </Text>
          
          <View style={styles.userInfo}>
            <Text style={[styles.userName, {color: theme.colors.text}]}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={[styles.userEmail, {color: theme.colors.textSecondary}]}>
              {user.email}
            </Text>
            <View style={styles.userBadges}>
              <View style={[styles.badge, {backgroundColor: theme.colors.success}]}>
                <Text style={[styles.badgeText, {color: theme.colors.background}]}>
                  Verified
                </Text>
              </View>
              {user.isPremium && (
                <View style={[styles.badge, {backgroundColor: theme.colors.premium}]}>
                  <Text style={[styles.badgeText, {color: theme.colors.background}]}>
                    Premium
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.section, {backgroundColor: theme.colors.surface}]}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Preferences
          </Text>
          
          {renderSettingItem(
            'location-on',
            'Location',
            handleUpdateLocation
          )}
          
          {renderSettingItem(
            'my-location',
            'Search Distance',
            handleUpdateDistance
          )}
          
          {renderSettingItem(
            'notifications',
            'Notifications',
            handleNotificationSettings
          )}
          
          {renderSettingItem(
            'dark-mode',
            'Dark Mode',
            toggleTheme,
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{false: theme.colors.border, true: theme.colors.primary}}
              thumbColor={isDarkMode ? theme.colors.background : theme.colors.textSecondary}
            />,
            false
          )}
        </View>

        <View style={[styles.section, {backgroundColor: theme.colors.surface}]}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Privacy & Safety
          </Text>
          
          {renderSettingItem(
            'privacy-tip',
            'Privacy Settings',
            handlePrivacySettings
          )}
          
          {renderSettingItem(
            'block',
            'Blocked Users',
            () => Alert.alert('Blocked Users', 'Blocked users feature coming soon!')
          )}
          
          {renderSettingItem(
            'report',
            'Report a Problem',
            () => Alert.alert('Report', 'Report feature coming soon!')
          )}
        </View>

        <View style={[styles.section, {backgroundColor: theme.colors.surface}]}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Support
          </Text>
          
          {renderSettingItem(
            'help',
            'Help & Support',
            handleHelpSupport
          )}
          
          {renderSettingItem(
            'info',
            'About',
            () => Alert.alert('About', 'BrandMatch v1.0.0\n\nA Tinder-style app for models and brands to discover, verify, and collaborate.')
          )}
          
          {renderSettingItem(
            'description',
            'Terms & Privacy Policy',
            handleTermsPrivacy
          )}
        </View>

        <View style={[styles.section, {backgroundColor: theme.colors.surface}]}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Account Actions
          </Text>
          
          {renderSettingItem(
            'logout',
            'Sign Out',
            handleSignOut,
            null,
            false
          )}
          
          {renderSettingItem(
            'delete-forever',
            'Delete Account',
            handleDeleteAccount,
            null,
            false
          )}
        </View>

        <TouchableOpacity style={styles.footer} onPress={handleAdminAccess}>
          <Text style={[styles.footerText, {color: theme.colors.textSecondary}]}>
            BrandMatch v1.0.0
          </Text>
          <Text style={[styles.footerText, {color: theme.colors.textSecondary}]}>
            Made with ❤️ for creators
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
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  userInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  userBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
});

export default SettingsScreen;
