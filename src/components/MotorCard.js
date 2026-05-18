import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {COLORS, statusColor} from '../constants/colors';
import MotorPumpIcon from './MotorPumpIcon';

const MotorCard = ({motor, onPress}) => {
  const color = statusColor(motor.status);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(motor)} style={[styles.card, {borderTopColor: color}]}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.name}>{motor.name}</Text>
          <Text style={styles.subText}>Tap to open details</Text>
        </View>
        <View style={[styles.statusPill, {backgroundColor: `${color}18`}]}>
          <View style={[styles.statusDot, {backgroundColor: color}]} />
          <Text style={[styles.statusText, {color}]}>{motor.status}</Text>
        </View>
      </View>

      <View style={styles.iconWrap}>
        <MotorPumpIcon size={78} color={color} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Last update</Text>
        <Text style={styles.footerValue} numberOfLines={1}>
          {motor.updatedAt ? new Date(motor.updatedAt).toLocaleTimeString() : 'Waiting'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    minHeight: 190,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderTopWidth: 4,
    marginBottom: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
  },
  subText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 14,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },
  iconWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  footerLabel: {
    fontSize: 10,
    color: COLORS.muted,
  },
  footerValue: {
    marginTop: 2,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },
});

export default MotorCard;
