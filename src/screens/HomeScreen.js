import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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
  useScreenMqttActivity('Home');

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
      ? COLORS.warning
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
        ? 'Running'
        : 'All motors stopped';

  const handleMotorPress = motor => {
    selectMotor(motor);
    navigation.navigate('MotorDetail', { motorId: motor.id });
  };

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
        showsVerticalScrollIndicator={false}>
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
            <MotorPumpIcon size={24} color={overallColor} />
          </StatusCard>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Motors</Text>
          <Text style={styles.sectionMeta}>
            {totalMotors} device{totalMotors > 1 ? 's' : ''}
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

        <View style={styles.messageBox}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageTitle}>Last MQTT Message</Text>
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
              styles.messageText,
              {
                color:
                  connectionStatus === 'CONNECTED'
                    ? COLORS.success
                    : statusColor(connectionStatus),
              },
            ]}
            numberOfLines={4}>
            {lastMessage || 'No MQTT messages received yet'}
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
    marginBottom: 22,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  sectionMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  messageBox: {
    marginTop: 8,
    marginBottom: 14,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  messageTitle: {
    color: COLORS.text,
    fontWeight: '900',
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 9,
  },

  messageText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
});

export default HomeScreen;