import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';

import WelcomeScreen         from './src/features/auth/WelcomeScreen';
import DashboardScreen       from './src/features/home/DashboardScreen';
import PoseResultScreen      from './src/features/pose/PoseResultScreen';
import SettingsScreen        from './src/features/pose/SettingsScreen';
import PoseGroupScreen       from './src/features/pose/PoseGroupScreen';
import PoseSequenceScreen    from './src/features/pose/PoseSequenceScreen';
import PoseCameraScreen      from './src/features/pose/PoseCameraScreen';
import PoseFeedbackScreen    from './src/features/pose/PoseFeedbackScreen';
import HealthYogaScreen      from './src/features/health/HealthYogaScreen';
import ConditionDetailScreen from './src/features/health/ConditionDetailScreen';
import WeightCheckScreen     from './src/features/health/WeightCheckScreen';
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
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        ) : (
          <>
            <Stack.Screen name="Dashboard"       component={DashboardScreen} />

            {/* ── 'Pose' alias → PoseGroupScreen ─────────────────────────────
                Many screens navigate to 'Pose' — this handles all of them    */}
            <Stack.Screen name="Pose"            component={PoseGroupScreen} />

            {/* ── Full pose detection flow ────────────────────────────────── */}
            <Stack.Screen name="PoseGroup"       component={PoseGroupScreen} />
            <Stack.Screen name="PoseSequence"    component={PoseSequenceScreen} />
            <Stack.Screen name="PoseCamera"      component={PoseCameraScreen} />
            <Stack.Screen name="PoseFeedback"    component={PoseFeedbackScreen} />

            {/* ── Legacy screens ──────────────────────────────────────────── */}
            <Stack.Screen name="PoseResult"      component={PoseResultScreen} />
            <Stack.Screen name="Settings"        component={SettingsScreen} />

            {/* ── Health Yoga ─────────────────────────────────────────────── */}
            <Stack.Screen name="HealthYoga"      component={HealthYogaScreen} />
            <Stack.Screen name="ConditionDetail" component={ConditionDetailScreen} />
            <Stack.Screen name="WeightCheck"     component={WeightCheckScreen} />

            {/* ── Yoga Library ────────────────────────────────────────────── */}
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