import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../constants/colors';

const StatusCard = ({
  title,
  value,
  caption,
  accentColor = COLORS.accent || '#2563EB',
  compact = false,
  children,
}) => {
  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.topRow}>
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          <Text style={[styles.value, { color: accentColor }]} numberOfLines={1}>
            {value}
          </Text>
        </View>

        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: `${accentColor}18`,
              borderColor: `${accentColor}35`,
            },
          ]}>
          {children ? (
            children
          ) : (
            <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
          )}
        </View>
      </View>

      <Text style={styles.caption} numberOfLines={2}>
        {caption}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    minHeight: 118,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',

    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },

  compactCard: {
    minHeight: 112,
  },

  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },

  textBlock: {
    flex: 1,
    paddingLeft: 2,
  },

  title: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  value: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  caption: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    color: '#64748B',
    fontWeight: '600',
  },

  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  statusDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
  },
});

export default StatusCard;