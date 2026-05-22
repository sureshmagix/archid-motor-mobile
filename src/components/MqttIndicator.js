import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const getIndicator = (status, colors) => {
  const activeColors = colors || COLORS;
  if (status === 'CONNECTED') return { color: activeColors.success, label: 'Online' };
  if (status === 'CONNECTING' || status === 'RECONNECTING') {
    return { color: activeColors.warning, label: 'Connecting...' };
  }
  if (status === 'ERROR') return { color: activeColors.danger, label: 'Error' };
  return { color: activeColors.danger, label: 'Offline' };
};

const MqttIndicator = ({ status, compact = false }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const indicator = getIndicator(status, colors);

  return (
    <View style={[styles.wrapper, compact && styles.compactWrapper]}>
      <View style={[styles.dot, { backgroundColor: indicator.color, shadowColor: indicator.color }]} />
      <Text style={[styles.text, compact && styles.compactText]}>{indicator.label}</Text>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
  },
  compactWrapper: {
    backgroundColor: colors.borderLight,
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
    color: colors.text,
  },
});

export default MqttIndicator;
