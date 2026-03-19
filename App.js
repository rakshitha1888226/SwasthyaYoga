import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';  // ✅ Direct import
import DashboardScreen from './src/features/home/DashboardScreen';  // Add this
// Remove or keep HomeScreen import

import WelcomeScreen from './src/features/auth/WelcomeScreen';
import HomeScreen from './src/features/home/HomeScreen';

const Stack = createStackNavigator();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Correct React Native Firebase syntax
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
       {!user ? (
  <Stack.Screen name="Welcome" component={WelcomeScreen} />
) : (
  <Stack.Screen name="Dashboard" component={DashboardScreen} />   // ← New Dashboard
)}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;