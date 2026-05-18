import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {COLORS} from '../constants/colors';

const StatusCard = ({title, value, caption, accentColor = COLORS.off, children}) => (
  <View style={[styles.card, {borderLeftColor: accentColor}]}>
    <View style={styles.textBlock}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, {color: accentColor}]}>{value}</Text>
      {!!caption && <Text style={styles.caption}>{caption}</Text>}
    </View>
    {children ? <View style={styles.iconBlock}>{children}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  value: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '900',
  },
  caption: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 12,
  },
  iconBlock: {
    marginLeft: 14,
  },
});

export default StatusCard;
