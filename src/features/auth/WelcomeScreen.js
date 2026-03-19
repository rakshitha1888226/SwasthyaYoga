import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const WelcomeScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

 useEffect(() => {
  // Configure Google Sign-In
  GoogleSignin.configure({
    webClientId: '538955948011-cna0rpefcp2u3c0sup45u6mkkomgv7ab.apps.googleusercontent.com', // 0 (zero) not O
    offlineAccess: false,
    scopes: ['profile', 'email'],
  });
}, []);

  const handlePhoneLogin = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const formattedNumber = '+91' + phoneNumber;
      Alert.alert('Info', 'Phone authentication coming soon!');
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.message);
    }
  };

 const handleGoogleLogin = async () => {
  try {
    setLoading(true);
    
    // Force sign out first (clean slate)
    await GoogleSignin.signOut();
    
    // Check Play Services
    await GoogleSignin.hasPlayServices();
    
    // Sign in with Google
    await GoogleSignin.signIn();
    
    // Get tokens
    const tokens = await GoogleSignin.getTokens();
    console.log('Tokens received:', !!tokens.idToken);
    
    if (!tokens || !tokens.idToken) {
      throw new Error('Failed to get authentication token');
    }
    
    // Create Firebase credential
    const googleCredential = auth.GoogleAuthProvider.credential(tokens.idToken);
    
    // Sign in to Firebase
    await auth().signInWithCredential(googleCredential);
    
    setLoading(false);
    // Navigation automatic ga avtundi via App.js auth state
    
  } catch (error) {
    setLoading(false);
    console.error('Google Sign-In Error:', error);
    
    if (error.code === 'SIGN_IN_CANCELLED') {
      // User cancelled - ignore
      console.log('User cancelled sign in');
    } else {
      Alert.alert('Sign In Failed', error.message || 'Could not sign in with Google');
    }
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>స్వస్థ్య యోగా</Text>
        <Text style={styles.tagline}>Find Balance. Find Peace.</Text>
      </View>

      <View style={styles.quoteContainer}>
        <Text style={styles.quote}>"Health is wealth"</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.countryCode}>+91</Text>
        <TextInput
          style={styles.input}
          placeholder="9876543210"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          maxLength={10}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handlePhoneLogin}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.divider} />
      </View>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleLogin}
        disabled={loading}>
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By continuing, you agree to our{' '}
        <Text style={styles.link}>Terms</Text> and{' '}
        <Text style={styles.link}>Privacy Policy</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 30,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  quoteContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  quote: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  countryCode: {
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#2E7D32',
    borderRightWidth: 1,
    borderRightColor: '#4CAF50',
    paddingVertical: 15,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#4CAF50',
  },
  dividerText: {
    paddingHorizontal: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  link: {
    color: '#4CAF50',
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;