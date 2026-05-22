import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, statusColor } from '../constants/colors';
import MotorPumpIcon from './MotorPumpIcon';
import { useMqtt } from '../context/MqttContext';

const MotorCard = ({ motor, onPress }) => {
  const { selectedIcons } = useMqtt();
  const color = statusColor(motor.status);
  const iconStyle = selectedIcons?.[motor.id] || 'DEFAULT';

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(motor)} style={[styles.card, { borderTopColor: color }]}>
      <View style={styles.topRow}>
        <View style={styles.titleArea}>
          <Text style={styles.name} numberOfLines={1}>{motor.name}</Text>
          <Text style={styles.subText}>Tap for telemetry</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${color}10` }]}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text style={[styles.statusText, { color }]}>{motor.status}</Text>
        </View>
      </View>

      <View style={styles.iconWrap}>
        <MotorPumpIcon size={68} color={color} status={motor.status} styleName={iconStyle} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>LAST SEEN</Text>
        <Text style={styles.footerValue} numberOfLines={1}>
          {motor.updatedAt ? new Date(motor.updatedAt).toLocaleTimeString() : 'Waiting for connection'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    minHeight: 198,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 14,
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 4,
  },
  titleArea: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  subText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 99,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  iconWrap: {
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  footer: {
    backgroundColor: COLORS.page,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  footerLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.muted,
    letterSpacing: 0.5,
  },
  footerValue: {
    marginTop: 1,
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '800',
  },
});

export default MotorCard;
