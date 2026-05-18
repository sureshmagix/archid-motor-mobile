import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import HeaderBar from '../components/HeaderBar';
import MotorPumpIcon from '../components/MotorPumpIcon';
import ParameterRow from '../components/ParameterRow';
import {COLORS, statusColor} from '../constants/colors';
import {useAuth} from '../context/AuthContext';
import {useMqtt} from '../context/MqttContext';

const MotorDetailScreen = ({navigation, route}) => {
  const {logout} = useAuth();
  const {motors, connectionStatus, controlMotor} = useMqtt();
  const {motorId} = route.params;

  const motor = useMemo(() => motors.find(item => item.id === motorId), [motors, motorId]);

  if (!motor) {
    return (
      <View style={styles.root}>
        <HeaderBar title="ARCHIDTECH | Flow" mqttStatus={connectionStatus} onLogout={logout} />
        <View style={styles.missingBox}>
          <Text style={styles.missingText}>Motor not found.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const color = statusColor(motor.status);
  const params = motor.parameters;

  return (
    <View style={styles.root}>
      <HeaderBar
        title="ARCHIDTECH | Flow"
        subtitle={motor.name}
        mqttStatus={connectionStatus}
        onLogout={logout}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back to Home</Text>
        </TouchableOpacity>

        <View style={[styles.heroCard, {borderLeftColor: color}]}>
          <View style={styles.heroText}>
            <Text style={styles.title}>{motor.name}</Text>
            <Text style={[styles.status, {color}]}>{motor.status}</Text>
            <Text style={styles.caption}>{motor.lastMessage}</Text>
          </View>
          <MotorPumpIcon size={92} color={color} />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, {backgroundColor: COLORS.success}]} onPress={() => controlMotor(motor, 'ON')}>
            <Text style={styles.actionText}>Turn ON</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, {backgroundColor: COLORS.off}]} onPress={() => controlMotor(motor, 'OFF')}>
            <Text style={styles.actionText}>Turn OFF</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Motor Parameters</Text>
        <ParameterRow label="Voltage" value={params.voltage} />
        <ParameterRow label="Current" value={params.current} />
        <ParameterRow label="RPM" value={params.rpm} />
        <ParameterRow label="Temperature" value={params.temperature} />
        <ParameterRow label="Run Status" value={params.runStatus} />
        <ParameterRow label="Fault Status" value={params.faultStatus} />

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>MQTT Status</Text>
          <Text style={styles.infoText}>{connectionStatus}</Text>
          <Text style={styles.infoSmall}>The UI changes color after a confirmation is received on the motor confirmation/status topic.</Text>
        </View>
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
    paddingBottom: 32,
  },
  backLink: {
    marginBottom: 12,
  },
  backLinkText: {
    color: COLORS.accent,
    fontWeight: '900',
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  heroText: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
  },
  status: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '900',
  },
  caption: {
    marginTop: 8,
    color: COLORS.muted,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: '900',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  infoBox: {
    marginTop: 10,
    backgroundColor: '#eef1f4',
    borderRadius: 12,
    padding: 14,
  },
  infoTitle: {
    color: COLORS.text,
    fontWeight: '900',
  },
  infoText: {
    marginTop: 6,
    color: COLORS.accent,
    fontWeight: '900',
  },
  infoSmall: {
    marginTop: 8,
    color: COLORS.muted,
    lineHeight: 18,
  },
  missingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingText: {
    color: COLORS.text,
    fontWeight: '800',
    marginBottom: 12,
  },
  backButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '900',
  },
});

export default MotorDetailScreen;
