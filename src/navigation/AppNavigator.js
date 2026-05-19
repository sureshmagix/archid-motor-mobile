import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { MqttProvider } from '../context/MqttContext';

import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import MotorDetailScreen from '../screens/MotorDetailScreen';
import MqttSettingsScreen from '../screens/MqttSettingsScreen';
import WifiProvisioningScreen from '../screens/WifiProvisioningScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MqttProvider>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="MotorDetail" component={MotorDetailScreen} />
            <Stack.Screen name="MqttSettings" component={MqttSettingsScreen} />
            <Stack.Screen
              name="WifiProvisioning"
              component={WifiProvisioningScreen}
            />
          </Stack.Navigator>
        </MqttProvider>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;