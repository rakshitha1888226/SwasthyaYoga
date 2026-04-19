import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';

// ── Auth ──────────────────────────────────────────────────────────────────────
import WelcomeScreen         from './src/features/auth/WelcomeScreen';

// ── Home / Dashboard ──────────────────────────────────────────────────────────
import DashboardScreen       from './src/features/home/DashboardScreen';

// ── AI Pose Check ─────────────────────────────────────────────────────────────
import WebViewPoseScreen     from './src/features/pose/WebViewPoseScreen';
import PoseResultScreen      from './src/features/pose/PoseResultScreen';
import SettingsScreen        from './src/features/pose/SettingsScreen';

// ── Health Yoga ───────────────────────────────────────────────────────────────
import HealthYogaScreen      from './src/features/health/HealthYogaScreen';
import ConditionDetailScreen from './src/features/health/ConditionDetailScreen';

// ── Healthy Weight Check ──────────────────────────────────────────────────────
import WeightCheckScreen     from './src/features/health/WeightCheckScreen';

// ── Yoga Library ──────────────────────────────────────────────────────────────
import YogaLibraryScreen     from './src/features/library/YogaLibraryScreen';
import YogaCategoryScreen    from './src/features/library/YogaCategoryScreen';
import YogaAsanaDetailScreen from './src/features/library/YogaAsanaDetailScreen';

const Stack = createStackNavigator();

function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
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
          /* ── Not logged in ─────────────────────────────────────────────── */
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        ) : (
          /* ── Logged in ─────────────────────────────────────────────────── */
          <>
            {/* Dashboard */}
            <Stack.Screen name="Dashboard"       component={DashboardScreen} />

            {/* AI Pose Check — receives optional poseOfDay + onPoseDone params
                from PoseOfTheDay streak component */}
            <Stack.Screen name="Pose"            component={WebViewPoseScreen} />
            <Stack.Screen name="PoseResult"      component={PoseResultScreen} />
            <Stack.Screen name="Settings"        component={SettingsScreen} />

            {/* Health Yoga */}
            <Stack.Screen name="HealthYoga"      component={HealthYogaScreen} />
            <Stack.Screen name="ConditionDetail" component={ConditionDetailScreen} />

            {/* Healthy Weight Check */}
            <Stack.Screen name="WeightCheck"     component={WeightCheckScreen} />

            {/* Yoga Library */}
            <Stack.Screen name="YogaLibrary"     component={YogaLibraryScreen} />
            <Stack.Screen name="YogaCategory"    component={YogaCategoryScreen} />
            <Stack.Screen name="YogaAsanaDetail" component={YogaAsanaDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
