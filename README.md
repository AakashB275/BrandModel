# BrandMatch

A Tinder-style app for models and brands to discover, verify, and collaborate.

## Features

- **Swipe-based Discovery**: Tinder-style interface for models and brands to discover each other
- **Identity Verification**: Photo ID verification for models, business document verification for brands
- **Real-time Chat**: 24-hour match timer with in-app messaging
- **Premium Features**: Extended timers, see who liked you, stay visible when inactive
- **Role-based Profiles**: Different interfaces for models and brands
- **Location-based Matching**: Find matches within your preferred distance

## Tech Stack

- **Frontend**: React Native
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Payments**: Stripe
- **Chat**: React Native Gifted Chat
- **Navigation**: React Navigation
- **UI**: React Native Paper + Custom Components

## Prerequisites

- Node.js (>= 16)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)
- Firebase project
- Stripe account

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd BrandMatch
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Storage
5. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
6. Place them in the appropriate directories:
   - `android/app/google-services.json`
   - `ios/GoogleService-Info.plist`
7. Update `src/config/firebase.js` with your Firebase config

### 3. Stripe Setup

1. Create a Stripe account at [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your publishable and secret keys
3. Create products and prices for premium plans
4. Update `src/config/stripe.js` with your Stripe keys and price IDs

### 4. Android Setup

```bash
cd android
./gradlew clean
cd ..
```

### 5. iOS Setup

```bash
cd ios
pod install
cd ..
```

### 6. Run the App

#### Android
```bash
npx react-native run-android
```

#### iOS
```bash
npx react-native run-ios
```

## Project Structure

```
src/
├── App.js                 # Main app component
├── context/              # React contexts
│   ├── AuthContext.js   # Authentication context
│   └── ThemeContext.js  # Theme context
├── navigation/           # Navigation configuration
│   └── MainTabNavigator.js
├── screens/             # App screens
│   ├── WelcomeScreen.js
│   ├── RoleSelectionScreen.js
│   ├── SignUpScreen.js
│   ├── SignInScreen.js
│   ├── VerificationScreen.js
│   ├── ProfileSetupScreen.js
│   ├── SwipeScreen.js
│   ├── MatchesScreen.js
│   ├── ChatScreen.js
│   ├── ProfileScreen.js
│   ├── SettingsScreen.js
│   └── PremiumUpgradeScreen.js
└── config/              # Configuration files
    ├── firebase.js
    └── stripe.js
```

## Key Features Implementation

### Authentication Flow
- Email/password authentication with Firebase
- Role selection (Model/Brand)
- Profile verification system

### Swipe Interface
- Pan gesture handling for swipe actions
- Card stack animation
- Like/pass/super like functionality

### Matching System
- Real-time match detection
- 24-hour chat timer
- Match expiration handling

### Premium Features
- Stripe payment integration
- Extended match timers
- See who liked you
- Stay visible when inactive

## Database Schema

### Users Collection
```javascript
{
  uid: string,
  email: string,
  userType: 'model' | 'brand',
  firstName: string,
  lastName: string,
  bio: string,
  photos: Array<{url: string, uploadedAt: timestamp}>,
  tags: Array<string>,
  location: string,
  distance: number,
  collaborationTypes: Array<string>,
  isVerified: boolean,
  verificationStatus: 'pending' | 'approved' | 'rejected',
  profileComplete: boolean,
  isPremium: boolean,
  premiumExpiresAt: timestamp,
  isActive: boolean,
  lastActive: timestamp,
  swipedProfiles: Array<string>,
  likedProfiles: Array<string>,
  matches: Array<string>,
  createdAt: timestamp
}
```

### Matches Collection
```javascript
{
  users: Array<string>,
  createdAt: timestamp,
  expiresAt: timestamp,
  isActive: boolean,
  lastMessage: string,
  lastMessageAt: timestamp
}
```

### Messages Subcollection
```javascript
{
  text: string,
  createdAt: timestamp,
  user: {
    _id: string,
    name: string,
    avatar: string
  }
}
```

## Environment Variables

Create a `.env` file in the root directory:

```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
```

## Deployment

### Android
1. Generate a signed APK
2. Upload to Google Play Store

### iOS
1. Archive the app in Xcode
2. Upload to App Store Connect

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@brandmatch.com or create an issue in the repository.
