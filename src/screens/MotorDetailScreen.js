import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import HeaderBar from '../components/HeaderBar';
import MotorPumpIcon from '../components/MotorPumpIcon';
import { COLORS, statusColor } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useMqtt } from '../context/MqttContext';
import FloatingHomeButton from '../components/FloatingHomeButton';
import useScreenMqttActivity from '../hooks/useScreenMqttActivity';

const EMPTY_VALUE = '--';

const getFirstValue = (...values) => {
  const value = values.find(
    item => item !== undefined && item !== null && item !== ''
  );

  return value === undefined ? EMPTY_VALUE : value;
};

const formatElectricalValue = (value, unit) => {
  if (value === EMPTY_VALUE) {
    return EMPTY_VALUE;
  }

  const text = String(value).trim();

  // Prevent duplicate unit if MQTT already sends "415 V" or "12 A"
  if (/[a-zA-Z]/.test(text)) {
    return text;
  }

  return `${text} ${unit}`;
};

const normalizeStatus = value => {
  if (value === EMPTY_VALUE) {
    return 'UNKNOWN';
  }

  return String(value).trim().toUpperCase();
};

const getMotorStatusColor = status => {
  const text = String(status).toUpperCase();

  if (text.includes('ON') || text.includes('RUN') || text.includes('ACTIVE')) {
    return COLORS.success;
  }

  if (text.includes('FAULT') || text.includes('TRIP') || text.includes('ERROR')) {
    return '#e74c3c';
  }

  if (text.includes('OFF') || text.includes('STOP')) {
    return COLORS.off;
  }

  return COLORS.accent;
};

const MetricCard = ({ icon, title, value, subtitle, color }) => (
  <View style={[styles.metricCard, { borderTopColor: color }]}>
    <View style={styles.metricHeader}>
      <View style={[styles.iconBadge, { backgroundColor: `${color}18` }]}>
        <Text style={[styles.iconText, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>

    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    <Text style={styles.metricSubtitle}>{subtitle}</Text>
  </View>
);

const PhaseCard = ({ phase, title, value, unit, icon, color }) => (
  <View style={styles.phaseCard}>
    <View style={styles.phaseHeader}>
      <View style={[styles.phaseDot, { backgroundColor: color }]} />
      <Text style={styles.phaseName}>{phase}</Text>
    </View>

    <View style={styles.phaseBody}>
      <Text style={styles.phaseIcon}>{icon}</Text>
      <View style={styles.phaseTextBox}>
        <Text style={styles.phaseTitle}>{title}</Text>
        <Text style={styles.phaseValue}>{formatElectricalValue(value, unit)}</Text>
      </View>
    </View>
  </View>
);

const MotorDetailScreen = ({ navigation, route }) => {
  const { publishRefresh } = useScreenMqttActivity('MotorDetail');
  const [refreshing, setRefreshing] = useState(false);

  const { logout } = useAuth();
  const { motors, connectionStatus, controlMotor } = useMqtt();
  const { motorId } = route.params;

  const motor = useMemo(
    () => motors.find(item => item.id === motorId),
    [motors, motorId]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);

    publishRefresh({
      motorId,
      requestedData: 'MOTOR_DETAIL',
    });

    setTimeout(() => {
      setRefreshing(false);
    }, 900);
  }, [motorId, publishRefresh]);

  if (!motor) {
    return (
      <View style={styles.root}>
        <HeaderBar
          title="ARCHIDTECH | Flow"
          mqttStatus={connectionStatus}
          onLogout={logout}
        />

        <View style={styles.missingBox}>
          <Text style={styles.missingText}>Motor not found.</Text>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const params = motor.parameters || {};
  const motorBaseColor = statusColor(motor.status);

  const motorStatus = normalizeStatus(
    getFirstValue(
      params.motorStatus,
      params.runStatus,
      params.status,
      motor.status
    )
  );

  const motorStatusColor = getMotorStatusColor(motorStatus);

  const voltageRV = getFirstValue(
    params.voltageRV,
    params.rvVoltage,
    params.voltage_rv,
    params.voltage?.rv,
    params.voltage?.RV
  );

  const voltageYB = getFirstValue(
    params.voltageYB,
    params.ybVoltage,
    params.voltage_yb,
    params.voltage?.yb,
    params.voltage?.YB
  );

  const voltageRB = getFirstValue(
    params.voltageRB,
    params.rbVoltage,
    params.voltage_rb,
    params.voltage?.rb,
    params.voltage?.RB
  );

  const currentR = getFirstValue(
    params.currentR,
    params.rCurrent,
    params.current_r,
    params.current?.r,
    params.current?.R
  );

  const currentY = getFirstValue(
    params.currentY,
    params.yCurrent,
    params.current_y,
    params.current?.y,
    params.current?.Y
  );

  const currentB = getFirstValue(
    params.currentB,
    params.bCurrent,
    params.current_b,
    params.current?.b,
    params.current?.B
  );

  return (
    <View style={styles.root}>
      <HeaderBar
        title="ARCHIDTECH | Flow"
        subtitle={motor.name}
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back to Home</Text>
        </TouchableOpacity>

        <View style={[styles.heroCard, { borderLeftColor: motorStatusColor }]}>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>MOTOR CONTROL PANEL</Text>
            <Text style={styles.title}>{motor.name}</Text>

            <View style={[styles.statusPill, { backgroundColor: `${motorStatusColor}18` }]}>
              <View style={[styles.statusDot, { backgroundColor: motorStatusColor }]} />
              <Text style={[styles.statusPillText, { color: motorStatusColor }]}>
                {motorStatus}
              </Text>
            </View>

            <Text style={styles.caption}>
              {motor.lastMessage || 'Waiting for latest controller update'}
            </Text>
          </View>

          <View style={styles.motorIconBox}>
            <MotorPumpIcon size={88} color={motorStatusColor || motorBaseColor} />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.onButton]}
            onPress={() => controlMotor(motor, 'ON')}
          >
            <Text style={styles.actionText}>⏻ Turn ON</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.offButton]}
            onPress={() => controlMotor(motor, 'OFF')}
          >
            <Text style={styles.actionText}>■ Turn OFF</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Live Motor Status</Text>

        <MetricCard
          icon="⚙"
          title="Motor Status"
          value={motorStatus}
          subtitle="Real-time running condition"
          color={motorStatusColor}
        />

        <Text style={styles.sectionTitle}>Voltage Measurement</Text>
        <Text style={styles.sectionSubtitle}>Line-to-line voltage in volts</Text>

        <View style={styles.phaseGrid}>
          <PhaseCard
            phase="RV"
            title="Voltage"
            value={voltageRV}
            unit="V"
            icon="⚡"
            color="#ef4444"
          />

          <PhaseCard
            phase="YB"
            title="Voltage"
            value={voltageYB}
            unit="V"
            icon="⚡"
            color="#f59e0b"
          />

          <PhaseCard
            phase="RB"
            title="Voltage"
            value={voltageRB}
            unit="V"
            icon="⚡"
            color="#2563eb"
          />
        </View>

        <Text style={styles.sectionTitle}>Current Measurement</Text>
        <Text style={styles.sectionSubtitle}>Phase current in amps</Text>

        <View style={styles.phaseGrid}>
          <PhaseCard
            phase="R"
            title="Current"
            value={currentR}
            unit="A"
            icon="∿"
            color="#ef4444"
          />

          <PhaseCard
            phase="Y"
            title="Current"
            value={currentY}
            unit="A"
            icon="∿"
            color="#f59e0b"
          />

          <PhaseCard
            phase="B"
            title="Current"
            value={currentB}
            unit="A"
            icon="∿"
            color="#2563eb"
          />
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoIcon}>📡</Text>
            <Text style={styles.infoTitle}>MQTT Status</Text>
          </View>

          <Text style={styles.infoText}>{connectionStatus}</Text>
          <Text style={styles.infoSmall}>
            Live values update after the motor controller publishes confirmation or status data.
          </Text>
        </View>
      </ScrollView>

      <FloatingHomeButton navigation={navigation} />
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
    paddingBottom: 96,
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
    borderRadius: 20,
    padding: 18,
    borderLeftWidth: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  heroText: {
    flex: 1,
    paddingRight: 16,
  },
  kicker: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
  },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 99,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '900',
  },
  caption: {
    marginTop: 10,
    color: COLORS.muted,
    lineHeight: 18,
  },
  motorIconBox: {
    width: 104,
    height: 104,
    borderRadius: 24,
    backgroundColor: '#f4f7fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  onButton: {
    backgroundColor: COLORS.success,
  },
  offButton: {
    backgroundColor: COLORS.off,
  },
  actionText: {
    color: '#fff',
    fontWeight: '900',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 12,
  },
  metricCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderTopWidth: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
    fontWeight: '900',
  },
  metricTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
  },
  metricValue: {
    fontSize: 30,
    fontWeight: '900',
  },
  metricSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 13,
  },
  phaseGrid: {
    gap: 12,
    marginBottom: 20,
  },
  phaseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  phaseDot: {
    width: 11,
    height: 11,
    borderRadius: 99,
  },
  phaseName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
  },
  phaseBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phaseIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#f4f7fb',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 46,
    fontSize: 24,
    marginRight: 12,
  },
  phaseTextBox: {
    flex: 1,
  },
  phaseTitle: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  phaseValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  infoBox: {
    marginTop: 2,
    backgroundColor: '#eef1f4',
    borderRadius: 18,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoTitle: {
    color: COLORS.text,
    fontWeight: '900',
  },
  infoText: {
    marginTop: 8,
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