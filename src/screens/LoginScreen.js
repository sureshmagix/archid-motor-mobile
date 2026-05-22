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
  const [isUserFocused, setIsUserFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);

  const handleLogin = () => {
    login(username, password);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/archidtech_logo.jpg')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.brand}>ARCHIDTECH</Text>
        <Text style={styles.subtitle}>FLOW CONTROL SYSTEMS</Text>

        {!!loginError && <Text style={styles.error}>{loginError}</Text>}

        <View style={styles.formGroup}>
          <Text style={[styles.label, isUserFocused && styles.labelFocused]}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            autoCapitalize="none"
            style={[styles.input, isUserFocused && styles.inputFocused]}
            placeholderTextColor="#94a3b8"
            onFocus={() => setIsUserFocused(true)}
            onBlur={() => setIsUserFocused(false)}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isPassFocused && styles.labelFocused]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
            style={[styles.input, isPassFocused && styles.inputFocused]}
            placeholderTextColor="#94a3b8"
            onFocus={() => setIsPassFocused(true)}
            onBlur={() => setIsPassFocused(false)}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Secure Login</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Default credentials: admin / admin</Text>
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
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  logoContainer: {
    width: 90,
    height: 76,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  brand: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 1.5,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 28,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  error: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: COLORS.danger,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 12,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  formGroup: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  labelFocused: {
    color: COLORS.accent,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: COLORS.text,
    fontSize: 15,
    backgroundColor: '#f8fafc',
    fontWeight: '700',
  },
  inputFocused: {
    borderColor: COLORS.accent,
    backgroundColor: '#ffffff',
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.accent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 24,
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default LoginScreen;
