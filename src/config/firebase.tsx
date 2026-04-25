// src/config/firebase.js
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyBtrJXXaVg2mYepVhhingOMCSxOoRpbqs",
  authDomain: "swasthyagoa-ddc05.firebaseapp.com",
  projectId: "swasthyagoa-ddc05",
  storageBucket: "swasthyagoa-ddc05.firebasestorage.app",
  messagingSenderId: "538955948011",
  appId: "1:538955948011:web:627fcd647cb125dd6a03ae",
  measurementId: "G-7GWBD4CX3Q"
};

let auth;

if (Platform.OS === 'web') {
  // Web Firebase (for web support)
  const { initializeApp } = require('firebase/app');
  const { getAuth } = require('firebase/auth');
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  // React Native Firebase
  auth = require('@react-native-firebase/auth').default();
}

export { auth };