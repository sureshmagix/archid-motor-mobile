import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {COLORS} from '../constants/colors';

const ParameterRow = ({label, value}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    color: COLORS.muted,
    fontWeight: '700',
  },
  value: {
    color: COLORS.text,
    fontWeight: '900',
  },
});

export default ParameterRow;
