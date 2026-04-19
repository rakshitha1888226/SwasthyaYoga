import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  Animated, Dimensions, StatusBar,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const { width, height } = Dimensions.get('window');

// ── Background yoga poses cycling as visual ───────────────────────────────
const BG_ITEMS = [
  { emoji: '🧘‍♀️', pose: 'Padmasana', te: 'పద్మాసన', color: '#1B5E20' },
  { emoji: '🌅', pose: 'Surya Namaskar', te: 'సూర్య నమస్కారం', color: '#1A237E' },
  { emoji: '🧘', pose: 'Tadasana', te: 'తాడాసన', color: '#4A148C' },
  { emoji: '🌿', pose: 'Vrikshasana', te: 'వృక్షాసన', color: '#1B5E20' },
  { emoji: '☀️', pose: 'Bhujangasana', te: 'భుజంగాసన', color: '#E65100' },
];

const WelcomeScreen = ({ navigation }) => {
  const [phone,    setPhone]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [bgIndex,  setBgIndex]  = useState(0);
  const fadeAnim               = useRef(new Animated.Value(1)).current;
  const slideAnim              = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '538955948011-cna0rpefcp2u3c0sup45u6mkkomgv7ab.apps.googleusercontent.com',
      offlineAccess: false,
      scopes: ['profile', 'email'],
    });

    // Animate in
    Animated.timing(slideAnim, {
      toValue: 1, duration: 800, useNativeDriver: true,
    }).start();

    // Cycle background every 4 seconds
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0, duration: 500, useNativeDriver: true,
      }).start(() => {
        setBgIndex(i => (i + 1) % BG_ITEMS.length);
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 500, useNativeDriver: true,
        }).start();
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const current = BG_ITEMS[bgIndex];

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      if (!tokens?.idToken) throw new Error('No token received');
      const credential = auth.GoogleAuthProvider.credential(tokens.idToken);
      await auth().signInWithCredential(credential);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Sign In Failed', error.message);
      }
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: current.color }]}>
      <StatusBar barStyle="light-content" backgroundColor={current.color} />

      {/* ── Animated background yoga visual ─────────────────────────────── */}
      <Animated.View style={[styles.bgVisual, { opacity: fadeAnim }]}>
        <Text style={styles.bgEmoji}>{current.emoji}</Text>
        <Text style={styles.bgPose}>{current.pose}</Text>
        <Text style={styles.bgPoseTe}>{current.te}</Text>
      </Animated.View>

      {/* ── App title ────────────────────────────────────────────────────── */}
      <Animated.View style={[
        styles.titleBlock,
        {
          opacity: slideAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1], outputRange: [40, 0],
            }),
          }],
        },
      ]}>
        <Text style={styles.appName}>స్వాస్థ్య యోగా</Text>
        <Text style={styles.appNameEn}>Swasthya Yoga</Text>
        <Text style={styles.tagline}>AI-powered yoga in Telugu 🙏</Text>
      </Animated.View>

      {/* ── Login card ───────────────────────────────────────────────────── */}
      <View style={styles.card}>

        {/* Phone input */}
        <Text style={styles.cardLabel}>Phone Number</Text>
        <View style={styles.phoneRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="Enter mobile number"
            placeholderTextColor="#aaa"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={10}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.otpBtn, loading && { opacity: 0.6 }]}
          onPress={() => Alert.alert('Coming soon', 'OTP login will be added soon!')}
          disabled={loading}
        >
          <Text style={styles.otpBtnText}>Send OTP</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google sign in */}
        <TouchableOpacity
          style={[styles.googleBtn, loading && { opacity: 0.6 }]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#2E7D32" size="small" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing you agree to our{' '}
          <Text style={styles.termsLink}>Terms</Text> &{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  // ── Background visual ─────────────────────────────────────────────────────
  bgVisual: {
    position: 'absolute',
    top: height * 0.08,
    alignItems: 'center',
    width: '100%',
  },
  bgEmoji:  { fontSize: 100, marginBottom: 16 },
  bgPose:   { color: 'rgba(255,255,255,0.9)', fontSize: 22, fontWeight: 'bold' },
  bgPoseTe: { color: 'rgba(255,255,255,0.65)', fontSize: 16, marginTop: 4 },

  // ── App title ─────────────────────────────────────────────────────────────
  titleBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appName:   { color: '#fff', fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  appNameEn: { color: 'rgba(255,255,255,0.75)', fontSize: 16, textAlign: 'center', marginTop: 2 },
  tagline:   { color: 'rgba(255,255,255,0.65)', fontSize: 13, textAlign: 'center', marginTop: 6 },

  // ── Login card ────────────────────────────────────────────────────────────
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingBottom: 40,
    elevation: 20,
  },
  cardLabel: { fontSize: 13, color: '#666', marginBottom: 8, fontWeight: '500' },

  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E0E0E0',
    borderRadius: 12, marginBottom: 14, overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: '#F5F5F5',
    borderRightWidth: 1, borderRightColor: '#E0E0E0',
  },
  countryCodeText: { fontSize: 15, color: '#333' },
  phoneInput: {
    flex: 1, paddingHorizontal: 14,
    fontSize: 16, color: '#222', height: 50,
  },

  otpBtn: {
    backgroundColor: '#2E7D32', borderRadius: 12,
    padding: 15, alignItems: 'center', marginBottom: 20,
  },
  otpBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 20, gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { color: '#999', fontSize: 13, fontWeight: '600' },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E0E0E0',
    borderRadius: 12, padding: 14, gap: 12, marginBottom: 18,
    backgroundColor: '#fff',
  },
  googleIcon: {
    fontSize: 18, fontWeight: 'bold', color: '#4285F4',
    width: 24, textAlign: 'center',
  },
  googleBtnText: { fontSize: 15, color: '#333', fontWeight: '600' },

  terms:     { fontSize: 11, color: '#aaa', textAlign: 'center', lineHeight: 18 },
  termsLink: { color: '#4CAF50', textDecorationLine: 'underline' },
});

export default WelcomeScreen;