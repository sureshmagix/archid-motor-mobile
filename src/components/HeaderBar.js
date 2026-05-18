import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {COLORS} from '../constants/colors';
import MqttIndicator from './MqttIndicator';

const HeaderBar = ({title = 'ARCHIDTECH | Flow', subtitle, mqttStatus, onLogout, showLogout = true}) => (
  <View style={styles.header}>
    <View style={styles.left}>
      <Image source={require('../assets/archidtech_logo.jpg')} style={styles.logo} />
      <View>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>

    <View style={styles.right}>
      <MqttIndicator status={mqttStatus} />
      {showLogout && (
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  title: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.4,
  },
  subtitle: {
    color: '#dce6ec',
    fontSize: 11,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  logoutText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default HeaderBar;
