import React, { useCallback, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import HeaderBar from '../components/HeaderBar';
import MotorCard from '../components/MotorCard';
import MotorPumpIcon from '../components/MotorPumpIcon';
import StatusCard from '../components/StatusCard';
import AppMenu from '../components/AppMenu';

import { COLORS, statusColor } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useMqtt } from '../context/MqttContext';
import useScreenMqttActivity from '../hooks/useScreenMqttActivity';

const HomeScreen = ({ navigation }) => {
  const { publishRefresh } = useScreenMqttActivity('Home');
  const [refreshing, setRefreshing] = useState(false);

  const { logout } = useAuth();

  const {
    motors,
    connectionStatus,
    connectionError,
    lastMessage,
    selectMotor,
  } = useMqtt();

  const runningCount = motors.filter(motor => motor.status === 'ON').length;
  const faultCount = motors.filter(motor => motor.status === 'FAULT').length;
  const totalMotors = motors.length;

  const overallColor =
    faultCount > 0
      ? COLORS.danger
      : runningCount > 0
        ? COLORS.success
        : COLORS.off;

  const networkColor =
    connectionStatus === 'CONNECTED' ? COLORS.success : COLORS.danger;

  const networkValue =
    connectionStatus === 'CONNECTED' ? 'Online' : connectionStatus;

  const networkCaption =
    connectionError ||
    (connectionStatus === 'CONNECTED'
      ? 'MQTT Active'
      : 'Waiting for MQTT connection');

  const motorCaption =
    faultCount > 0
      ? `${faultCount} fault${faultCount > 1 ? 's' : ''} detected`
      : runningCount > 0
        ? 'Motors running'
        : 'All motors stopped';

  const handleMotorPress = motor => {
    selectMotor(motor);
    navigation.navigate('MotorDetail', { motorId: motor.id });
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);

    publishRefresh({
      requestedData: 'ALL_MOTORS',
    });

    setTimeout(() => {
      setRefreshing(false);
    }, 900);
  }, [publishRefresh]);

  return (
    <View style={styles.root}>
      <HeaderBar
        title="ARCHIDTECH | Flow"
        subtitle="Motor Control Dashboard"
        mqttStatus={connectionStatus}
        onLogout={logout}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }>
        <View style={styles.masterPanel}>
          <StatusCard
            title="System Network"
            value={networkValue}
            caption={networkCaption}
            accentColor={networkColor}
            compact
          />

          <StatusCard
            title="Motor Overview"
            value={`${runningCount}/${totalMotors}`}
            caption={motorCaption}
            accentColor={overallColor}
            compact>
            <MotorPumpIcon size={24} color={overallColor} status={runningCount > 0 ? 'ON' : 'OFF'} />
          </StatusCard>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>System Motors</Text>
          <Text style={styles.sectionMeta}>
            {totalMotors} device{totalMotors > 1 ? 's' : ''} active
          </Text>
        </View>

        <View style={styles.grid}>
          {motors.map(motor => (
            <MotorCard
              key={motor.id}
              motor={motor}
              onPress={handleMotorPress}
            />
          ))}
        </View>

        <View style={styles.terminalBox}>
          <View style={styles.terminalHeader}>
            <View style={styles.terminalTitleRow}>
              <Text style={styles.terminalTitle}>MQTT LIVE FEED</Text>
              <View style={styles.terminalTabs}>
                <View style={[styles.terminalTabDot, { backgroundColor: '#ef4444' }]} />
                <View style={[styles.terminalTabDot, { backgroundColor: '#eab308' }]} />
                <View style={[styles.terminalTabDot, { backgroundColor: '#10b981' }]} />
              </View>
            </View>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    connectionStatus === 'CONNECTED'
                      ? COLORS.success
                      : statusColor(connectionStatus),
                },
              ]}
            />
          </View>

          <Text
            style={[
              styles.terminalText,
              {
                color:
                  connectionStatus === 'CONNECTED'
                    ? '#10b981'
                    : '#ef4444',
              },
            ]}
            numberOfLines={4}>
            {lastMessage || '$ waiting for MQTT connection logs...'}
          </Text>
        </View>

        <AppMenu navigation={navigation} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.page,
  },

  content: {
    padding: 16,
    paddingBottom: 90,
  },

  masterPanel: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.2,
  },

  sectionMeta: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.muted,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  terminalBox: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#0f172a', // Slate-900 Dark background
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155', // Slate-700
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b', // Slate-800 divider
    paddingBottom: 8,
  },

  terminalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  terminalTitle: {
    color: '#94a3b8', // Slate-400
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1,
  },

  terminalTabs: {
    flexDirection: 'row',
    gap: 5,
  },

  terminalTabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  terminalText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});

export default HomeScreen;