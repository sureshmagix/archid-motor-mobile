import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {COLORS} from '../constants/colors';

const StatusCard = ({title, value, caption, accentColor = COLORS.off, children, compact = false}) => (
  <View style={[styles.card, compact && styles.compactCard]}>
    <View style={[styles.header, compact && styles.compactHeader]}>
      {compact ? (
        <View style={styles.compactTitleRow}>
          {children ? (
            <View style={styles.compactIcon}>{children}</View>
          ) : (
            <View style={[styles.indicator, {backgroundColor: accentColor}]} />
          )}
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>
      ) : (
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.value, {color: accentColor}]}>{value}</Text>
          {!!caption && <Text style={styles.caption}>{caption}</Text>}
        </View>
      )}
      {!compact && children ? <View style={styles.iconBlock}>{children}</View> : null}
    </View>

    {compact && (
      <View style={styles.compactContent}>
        <Text style={[styles.value, styles.compactValue, {color: accentColor}]} numberOfLines={1}>{value}</Text>
        {!!caption && <Text style={[styles.caption, styles.compactCaption]} numberOfLines={1}>{caption}</Text>}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  compactCard: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  value: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '800',
  },
  compactValue: {
    marginTop: 0,
    fontSize: 20,
    fontWeight: '700',
  },
  caption: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 12,
  },
  compactCaption: {
    marginTop: 2,
    fontSize: 11,
  },
  iconBlock: {
    marginLeft: 14,
  },
  compactIcon: {
    // Allows icon to be constrained
  },
  compactContent: {
    marginTop: 4,
  }
});

export default StatusCard;
