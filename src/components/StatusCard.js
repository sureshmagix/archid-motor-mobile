import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const StatusCard = ({
  title,
  value,
  caption,
  accentColor,
  compact = false,
  children,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const activeAccentColor = accentColor || colors.accent;

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <View style={styles.topRow}>
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          <Text style={[styles.value, { color: activeAccentColor }]} numberOfLines={1}>
            {value}
          </Text>
        </View>

        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: `${activeAccentColor}10`, // extra translucent
              borderColor: `${activeAccentColor}25`,
            },
          ]}>
          {children ? (
            children
          ) : (
            <View style={[styles.statusDot, { backgroundColor: activeAccentColor }]} />
          )}
        </View>
      </View>

      <Text style={styles.caption} numberOfLines={2}>
        {caption}
      </Text>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  card: {
    width: '48%',
    minHeight: 114,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',

    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  compactCard: {
    minHeight: 108,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },

  textBlock: {
    flex: 1,
  },

  title: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },

  value: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  caption: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    fontWeight: '700',
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default StatusCard;