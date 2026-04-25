import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';

import WelcomeScreen from './src/features/auth/WelcomeScreen';
import HomeScreen from './src/features/home/HomeScreen';

const Stack = createStackNavigator();

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout — if Firebase hangs, force show the app
    const timeout = setTimeout(() => {
      console.log('Firebase auth timed out — forcing load');
      setLoading(false);
    }, 5000);

    const unsubscribe = auth().onAuthStateChanged((user: any) => {
      clearTimeout(timeout);
      setUser(user);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        ) : (
          <Stack.Screen name="Home" component={HomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;