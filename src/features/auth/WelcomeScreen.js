// ── SwasthyaYoga — Welcome Screen ────────────────────────────────────────────
// Full OTP phone login + Google Sign In
// Flow: Enter phone → Send OTP → Enter 6-digit code → Verify → Dashboard

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  Animated, Dimensions, StatusBar, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const { width, height } = Dimensions.get('window');

const BG_ITEMS = [
  { emoji: '🧘‍♀️', pose: 'Padmasana',      te: 'పద్మాసన',         color: '#1B5E20' },
  { emoji: '🌅',   pose: 'Surya Namaskar', te: 'సూర్య నమస్కారం', color: '#1A237E' },
  { emoji: '🧘',   pose: 'Tadasana',       te: 'తాడాసన',          color: '#4A148C' },
  { emoji: '🌿',   pose: 'Vrikshasana',    te: 'వృక్షాసన',        color: '#1B5E20' },
  { emoji: '☀️',   pose: 'Bhujangasana',   te: 'భుజంగాసన',        color: '#E65100' },
];

// ─────────────────────────────────────────────────────────────────────────────

const WelcomeScreen = () => {
  // UI state
  const [bgIndex,  setBgIndex]  = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState('phone'); // 'phone' | 'otp'

  // Phone OTP state
  const [phone,       setPhone]       = useState('');
  const [otp,         setOtp]         = useState(['', '', '', '', '', '']);
  const [confirm,     setConfirm]     = useState(null); // Firebase confirmation result
  const [otpTimer,    setOtpTimer]    = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // Animations
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;
  const cardFade  = useRef(new Animated.Value(0)).current;

  // OTP input refs for auto-focus
  const otpRefs = useRef([...Array(6)].map(() => React.createRef()));

  // ── Timer countdown for resend ──────────────────────────────────────────
  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [otpTimer]);

  // ── Background cycling ──────────────────────────────────────────────────
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '538955948011-cna0rpefcp2u3c0sup45u6mkkomgv7ab.apps.googleusercontent.com',
      offlineAccess: false,
      scopes: ['profile', 'email'],
    });

    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(cardFade,  { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 600, delay: 300, useNativeDriver: true }),
    ]).start();

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setBgIndex(i => (i + 1) % BG_ITEMS.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const current = BG_ITEMS[bgIndex];

  // ── SEND OTP ────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    const cleaned = phone.trim().replace(/\s/g, '');
    if (cleaned.length !== 10 || !/^\d{10}$/.test(cleaned)) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      const fullPhone = `+91${cleaned}`;
      const confirmation = await auth().signInWithPhoneNumber(fullPhone);
      setConfirm(confirmation);
      setStep('otp');
      setOtpTimer(30);
      setResendCount(c => c + 1);
      // Auto-focus first OTP box
      setTimeout(() => otpRefs.current[0]?.current?.focus(), 300);
    } catch (error) {
      console.log('OTP Send Error:', error.code, error.message);
      let msg = 'Failed to send OTP. Please try again.';
      if (error.code === 'auth/invalid-phone-number')  msg = 'Invalid phone number. Check and try again.';
      if (error.code === 'auth/too-many-requests')     msg = 'Too many attempts. Please wait a few minutes.';
      if (error.code === 'auth/quota-exceeded')        msg = 'SMS quota exceeded. Try again later.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── VERIFY OTP ──────────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Incomplete', 'Please enter the full 6-digit OTP.');
      return;
    }
    if (!confirm) {
      Alert.alert('Error', 'Session expired. Please go back and resend OTP.');
      return;
    }

    try {
      setLoading(true);
      await confirm.confirm(code);
      // Auth state listener in App.js will navigate to Dashboard automatically
    } catch (error) {
      console.log('OTP Verify Error:', error.code, error.message);
      let msg = 'Wrong OTP. Please check and try again.';
      if (error.code === 'auth/code-expired')       msg = 'OTP expired. Please go back and resend.';
      if (error.code === 'auth/invalid-verification-code') msg = 'Invalid OTP. Please check the code.';
      Alert.alert('Verification Failed', msg);
      // Clear OTP boxes on wrong code
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // ── RESEND OTP ──────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (otpTimer > 0) return;
    setOtp(['', '', '', '', '', '']);
    await handleSendOTP();
  };

  // ── OTP box input handler ───────────────────────────────────────────────
  const handleOtpChange = (text, index) => {
    // Allow only digits
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    // Auto-advance to next box
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.current?.focus();
    }
    // Auto-verify when all 6 filled
    if (digit && index === 5) {
      const complete = [...newOtp.slice(0, 5), digit];
      if (complete.every(d => d !== '')) {
        setTimeout(() => handleVerifyOTPDirect(complete.join('')), 100);
      }
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.current?.focus();
    }
  };

  // Direct verify with code string (called from auto-verify)
  const handleVerifyOTPDirect = async (code) => {
    if (!confirm) return;
    try {
      setLoading(true);
      await confirm.confirm(code);
    } catch (error) {
      let msg = 'Wrong OTP. Please try again.';
      if (error.code === 'auth/code-expired') msg = 'OTP expired. Please resend.';
      Alert.alert('Verification Failed', msg);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // ── GOOGLE SIGN IN ──────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut();
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      if (!tokens?.idToken) throw new Error('No token received');
      const credential = auth.GoogleAuthProvider.credential(tokens.idToken);
      await auth().signInWithCredential(credential);
    } catch (error) {
      console.log('Google Sign-In Error:', error.code, error.message);
      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Sign In Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.root, { backgroundColor: current.color }]}>
        <StatusBar barStyle="light-content" backgroundColor={current.color} />

        {/* Background visual */}
        <Animated.View style={[styles.bgVisual, { opacity: fadeAnim }]}>
          <Text style={styles.bgEmoji}>{current.emoji}</Text>
          <Text style={styles.bgPose}>{current.pose}</Text>
          <Text style={styles.bgPoseTe}>{current.te}</Text>
        </Animated.View>

        {/* App title */}
        <Animated.View style={[styles.titleBlock, {
          opacity: slideAnim,
          transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        }]}>
          <Text style={styles.appName}>స్వాస్థ్య యోగా</Text>
          <Text style={styles.appNameEn}>Swasthya Yoga</Text>
          <Text style={styles.tagline}>AI-powered yoga in Telugu 🙏</Text>
        </Animated.View>

        {/* Login card */}
        <Animated.View style={[styles.card, {
          opacity: cardFade,
          transform: [{ translateY: cardSlide }],
        }]}>

          {step === 'phone' ? (
            /* ── PHONE STEP ───────────────────────────────────────────── */
            <>
              <Text style={styles.cardTitle}>Sign In</Text>
              <Text style={styles.cardSub}>Enter your mobile number to continue</Text>

              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#aaa"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleSendOTP}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.primaryBtnText}>Send OTP →</Text>
                }
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.googleBtn, loading && { opacity: 0.7 }]}
                onPress={handleGoogleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#2E7D32" size="small" />
                  : <>
                      <Text style={styles.googleIcon}>G</Text>
                      <Text style={styles.googleBtnText}>Continue with Google</Text>
                    </>
                }
              </TouchableOpacity>

              <Text style={styles.terms}>
                By continuing you agree to our{' '}
                <Text style={styles.termsLink}>Terms</Text> &{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </>

          ) : (
            /* ── OTP STEP ─────────────────────────────────────────────── */
            <>
              <TouchableOpacity
                style={styles.backRow}
                onPress={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}
              >
                <Text style={styles.backRowText}>← Change number</Text>
              </TouchableOpacity>

              <Text style={styles.cardTitle}>Enter OTP</Text>
              <Text style={styles.cardSub}>
                We sent a 6-digit code to{'\n'}
                <Text style={styles.phoneHighlight}>+91 {phone}</Text>
              </Text>

              {/* 6-box OTP input */}
              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={otpRefs.current[i]}
                    style={[styles.otpBox, digit && styles.otpBoxFilled]}
                    value={digit}
                    onChangeText={text => handleOtpChange(text, i)}
                    onKeyPress={e => handleOtpKeyPress(e, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleVerifyOTP}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.primaryBtnText}>Verify OTP ✓</Text>
                }
              </TouchableOpacity>

              {/* Resend timer */}
              <View style={styles.resendRow}>
                {otpTimer > 0 ? (
                  <Text style={styles.resendTimer}>
                    Resend OTP in <Text style={{ color: '#2E7D32', fontWeight: 'bold' }}>{otpTimer}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={loading}>
                    <Text style={styles.resendBtn}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.otpNote}>
                📱 Check your SMS inbox. The code is valid for 60 seconds.
              </Text>
            </>
          )}
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },

  bgVisual: {
    position: 'absolute', top: height * 0.08,
    alignItems: 'center', width: '100%',
  },
  bgEmoji:  { fontSize: 100, marginBottom: 16 },
  bgPose:   { color: 'rgba(255,255,255,0.9)', fontSize: 22, fontWeight: 'bold' },
  bgPoseTe: { color: 'rgba(255,255,255,0.65)', fontSize: 16, marginTop: 4 },

  titleBlock: { alignItems: 'center', marginBottom: 20 },
  appName:    { color: '#fff', fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  appNameEn:  { color: 'rgba(255,255,255,0.75)', fontSize: 16, textAlign: 'center', marginTop: 2 },
  tagline:    { color: 'rgba(255,255,255,0.65)', fontSize: 13, textAlign: 'center', marginTop: 6 },

  card: {
    width: '100%', backgroundColor: '#fff',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 28, paddingBottom: 44, elevation: 20,
  },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  cardSub:   { fontSize: 13, color: '#888', marginBottom: 20, lineHeight: 20 },

  backRow:     { marginBottom: 16 },
  backRowText: { color: '#2E7D32', fontSize: 14, fontWeight: '600' },

  fieldLabel: { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 8 },

  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E0E0E0',
    borderRadius: 12, marginBottom: 16, overflow: 'hidden',
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

  primaryBtn: {
    backgroundColor: '#2E7D32', borderRadius: 12,
    padding: 15, alignItems: 'center', marginBottom: 20,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { color: '#999', fontSize: 13, fontWeight: '600' },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E0E0E0',
    borderRadius: 12, padding: 14, gap: 12, marginBottom: 18,
    backgroundColor: '#fff',
  },
  googleIcon:    { fontSize: 18, fontWeight: 'bold', color: '#4285F4', width: 24, textAlign: 'center' },
  googleBtnText: { fontSize: 15, color: '#333', fontWeight: '600' },

  terms:     { fontSize: 11, color: '#aaa', textAlign: 'center', lineHeight: 18 },
  termsLink: { color: '#4CAF50', textDecorationLine: 'underline' },

  // OTP boxes
  otpRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 24, gap: 8,
  },
  otpBox: {
    flex: 1, height: 54, borderRadius: 12,
    borderWidth: 2, borderColor: '#E0E0E0',
    textAlign: 'center', fontSize: 22, fontWeight: 'bold',
    color: '#111', backgroundColor: '#FAFAFA',
  },
  otpBoxFilled: { borderColor: '#2E7D32', backgroundColor: '#F1F8E9' },

  phoneHighlight: { color: '#2E7D32', fontWeight: 'bold' },

  resendRow:  { alignItems: 'center', marginBottom: 12 },
  resendTimer:{ fontSize: 13, color: '#888' },
  resendBtn:  { fontSize: 14, color: '#2E7D32', fontWeight: 'bold', textDecorationLine: 'underline' },

  otpNote: { fontSize: 11, color: '#aaa', textAlign: 'center', lineHeight: 18, marginTop: 4 },
});

export default WelcomeScreen;