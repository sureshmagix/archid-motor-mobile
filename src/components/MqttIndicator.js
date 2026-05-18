import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {COLORS} from '../constants/colors';

const getIndicator = status => {
  if (status === 'CONNECTED') return {color: COLORS.success, label: 'Online'};
  if (status === 'CONNECTING' || status === 'RECONNECTING') {
    return {color: COLORS.warning, label: 'Connecting...'};
  }
  if (status === 'ERROR') return {color: COLORS.danger, label: 'Error'};
  return {color: COLORS.danger, label: 'Offline'};
};

const MqttIndicator = ({status, compact = false}) => {
  const indicator = getIndicator(status);

  return (
    <View style={[styles.wrapper, compact && styles.compactWrapper]}>
      <View style={[styles.dot, {backgroundColor: indicator.color, shadowColor: indicator.color}]} />
      <Text style={[styles.text, compact && styles.compactText]}>{indicator.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
  },
  compactWrapper: {
    backgroundColor: '#f8f9fa',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    shadowOpacity: 0.55,
    shadowRadius: 5,
    elevation: 4,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  compactText: {
    color: COLORS.text,
  },
});

export default MqttIndicator;
