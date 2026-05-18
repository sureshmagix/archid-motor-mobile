import React, {useState} from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {COLORS} from '../constants/colors';
import {useAuth} from '../context/AuthContext';

const LoginScreen = () => {
  const {login, loginError} = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');

  const handleLogin = () => {
    login(username, password);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}>
      <View style={styles.card}>
        <Image source={require('../assets/archidtech_logo.jpg')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brand}>ARCHIDTECH</Text>
        <Text style={styles.subtitle}>Motor Control Automation</Text>

        {!!loginError && <Text style={styles.error}>{loginError}</Text>}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            autoCapitalize="none"
            style={styles.input}
            placeholderTextColor="#9aa4aa"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#9aa4aa"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Secure Login</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Default: admin / admin</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  logo: {
    width: 110,
    height: 90,
  },
  brand: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 22,
    color: COLORS.muted,
    fontSize: 14,
  },
  error: {
    width: '100%',
    padding: 10,
    color: '#cc0000',
    backgroundColor: '#fce4e4',
    borderRadius: 6,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '700',
  },
  formGroup: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    color: COLORS.text,
    fontWeight: '800',
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d8dee4',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    backgroundColor: '#2980b9',
    borderRadius: 7,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  footer: {
    marginTop: 18,
    fontSize: 12,
    color: '#9aa4aa',
  },
});

export default LoginScreen;
