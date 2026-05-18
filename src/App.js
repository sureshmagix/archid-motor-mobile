import './polyfills';
import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {COLORS} from './constants/colors';
import {AuthProvider} from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';

const App = () => (
  <SafeAreaProvider>
    <SafeAreaView style={{flex: 1, backgroundColor: COLORS.primary}} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaView>
  </SafeAreaProvider>
);

export default App;
