import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {COLORS} from '../constants/colors';
import MqttIndicator from './MqttIndicator';


const HeaderBar = ({title = 'ARCHIDTECH | Flow', subtitle, mqttStatus, onLogout, showLogout = true}) => (
  <View style={styles.header}>
    <View style={styles.left}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/archidtech_logo.jpg')} style={styles.logo} resizeMode="contain" />
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>

    <View style={styles.right}>
      <MqttIndicator status={mqttStatus} />
      {showLogout && (
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  titleContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.6,
  },
  subtitle: {
    color: '#94a3b8', // slate-400
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.2)', // Slate-100 translucent
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  logoutText: {
    color: '#f8fafc', // Slate-50
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});


export default HeaderBar;
