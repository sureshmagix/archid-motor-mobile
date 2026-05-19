import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../constants/colors';
import MotorPumpIcon from './MotorPumpIcon';

const getMotorState = status => {
  const normalized = String(status || 'OFF').toUpperCase();

  if (normalized === 'ON') {
    return {
      label: 'RUNNING',
      color: COLORS.success || '#16A34A',
      soft: '#DCFCE7',
      border: '#BBF7D0',
      description: 'Motor is active',
    };
  }

  if (normalized === 'FAULT') {
    return {
      label: 'FAULT',
      color: COLORS.warning || '#F59E0B',
      soft: '#FEF3C7',
      border: '#FDE68A',
      description: 'Needs attention',
    };
  }

  return {
    label: 'STOPPED',
    color: COLORS.off || '#94A3B8',
    soft: '#F1F5F9',
    border: '#E2E8F0',
    description: 'Motor is idle',
  };
};

const MotorCard = ({ motor, onPress }) => {
  const state = getMotorState(motor?.status);
  const motorName = motor?.name || `Motor ${motor?.id}`;

  return (
    <Pressable
      android_ripple={{ color: '#E2E8F0' }}
      onPress={() => onPress(motor)}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: state.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}>
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: state.soft,
              borderColor: state.border,
            },
          ]}>
          <MotorPumpIcon size={30} color={state.color} />
        </View>

        <View style={[styles.statusBadge, { backgroundColor: state.soft }]}>
          <View style={[styles.statusDot, { backgroundColor: state.color }]} />
          <Text style={[styles.statusText, { color: state.color }]}>
            {state.label}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.motorName} numberOfLines={1}>
          {motorName}
        </Text>

        <Text style={styles.motorDescription} numberOfLines={1}>
          {state.description}
        </Text>
      </View>

      <View style={styles.infoPanel}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>ID</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {motor?.id || '--'}
          </Text>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Health</Text>
          <Text
            style={[
              styles.infoValue,
              {
                color:
                  motor?.status === 'FAULT'
                    ? COLORS.warning || '#F59E0B'
                    : COLORS.success || '#16A34A',
              },
            ]}
            numberOfLines={1}>
            {motor?.status === 'FAULT' ? 'Alert' : 'Normal'}
          </Text>
        </View>
      </View>

      <View style={[styles.bottomLine, { backgroundColor: state.color }]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    minHeight: 184,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',

    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  body: {
    marginTop: 16,
  },

  motorName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.3,
  },

  motorDescription: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  infoPanel: {
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  infoItem: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111827',
  },

  infoDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },

  bottomLine: {
    position: 'absolute',
    left: 15,
    right: 15,
    bottom: 0,
    height: 4,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
});

export default MotorCard;