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

const PhaseCard = ({ phase, title, value, unit, icon, color, bgLight }) => (
  <View style={[styles.phaseCard, bgLight ? { backgroundColor: bgLight, borderColor: `${color}33`, borderWidth: 1 } : null]}>
    <View style={styles.phaseHeader}>
      <View style={[styles.phaseDot, { backgroundColor: color }]} />
      <Text style={styles.phaseName}>{phase}</Text>
    </View>

    <View style={styles.phaseBody}>
      <Text style={[styles.phaseIcon, bgLight ? { backgroundColor: 'rgba(255, 255, 255, 0.75)' } : null]}>{icon}</Text>
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
  const { motors, connectionStatus, controlMotor, selectedIcons, setMotorIcon } = useMqtt();
  const { motorId } = route.params;

  const motor = useMemo(
    () => motors.find(item => item.id === motorId),
    [motors, motorId]
  );

  const iconStyle = selectedIcons?.[motorId] || 'DEFAULT';

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

        {/* Motor Control Panel + Live Motor Status in one line */}
        <View style={styles.topStatusRow}>
          <View style={styles.controlPanelColumn}>
            <View style={[styles.heroCard, { borderLeftColor: motorStatusColor }]}>
              <View style={styles.heroText}>
                <Text style={styles.kicker}>MOTOR CONTROL PANEL</Text>
                <Text style={styles.title} numberOfLines={1}>
                  {motor.name}
                </Text>

                <View style={[styles.statusPill, { backgroundColor: `${motorStatusColor}18` }]}>
                  <View style={[styles.statusDot, { backgroundColor: motorStatusColor }]} />
                  <Text style={[styles.statusPillText, { color: motorStatusColor }]}>
                    {motorStatus}
                  </Text>
                </View>

                <Text style={styles.caption} numberOfLines={2}>
                  {motor.lastMessage || 'Waiting for latest controller update'}
                </Text>
              </View>

              <View style={styles.motorIconBox}>
                <MotorPumpIcon
                  size={76}
                  color={motorStatusColor || motorBaseColor}
                  status={motorStatus}
                  styleName={iconStyle}
                />
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.onButton]}
                onPress={() => controlMotor(motor, 'ON')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionText}>⏻ Turn ON</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.offButton]}
                onPress={() => controlMotor(motor, 'OFF')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionText}>■ Turn OFF</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.liveStatusPanel}>
            <Text style={styles.kicker}>LIVE MOTOR STATUS</Text>

            <View style={[styles.liveStatusIconBadge, { backgroundColor: `${motorStatusColor}18` }]}>
              <Text style={[styles.liveStatusIcon, { color: motorStatusColor }]}>⚙</Text>
            </View>

            <Text style={[styles.liveStatusValue, { color: motorStatusColor }]} numberOfLines={1}>
              {motorStatus}
            </Text>

            <Text style={styles.liveStatusLabel}>Real-time running condition</Text>
          </View>
        </View>

        {/* Voltage + Current Measurements side by side */}
        <View style={styles.measurementsRow}>
          <View style={styles.measurementPanel}>
            <View style={styles.measurementHeader}>
              <Text style={styles.measurementTitle}>Voltage Measurement</Text>
              <Text style={styles.measurementSubtitle}>Line-to-line volts</Text>
            </View>

            <View style={styles.phaseGrid}>
              <PhaseCard
                phase="RV"
                title="Voltage"
                value={voltageRV}
                unit="V"
                icon="⚡"
                color="#ef4444"
                bgLight="#fef2f2"
              />

              <PhaseCard
                phase="YB"
                title="Voltage"
                value={voltageYB}
                unit="V"
                icon="⚡"
                color="#f59e0b"
                bgLight="#fffbeb"
              />

              <PhaseCard
                phase="RB"
                title="Voltage"
                value={voltageRB}
                unit="V"
                icon="⚡"
                color="#2563eb"
                bgLight="#eff6ff"
              />
            </View>
          </View>

          <View style={styles.measurementPanel}>
            <View style={styles.measurementHeader}>
              <Text style={styles.measurementTitle}>Current Measurement</Text>
              <Text style={styles.measurementSubtitle}>Phase current amps</Text>
            </View>

            <View style={styles.phaseGrid}>
              <PhaseCard
                phase="R"
                title="Current"
                value={currentR}
                unit="A"
                icon="∿"
                color="#ef4444"
                bgLight="#fef2f2"
              />

              <PhaseCard
                phase="Y"
                title="Current"
                value={currentY}
                unit="A"
                icon="∿"
                color="#f59e0b"
                bgLight="#fffbeb"
              />

              <PhaseCard
                phase="B"
                title="Current"
                value={currentB}
                unit="A"
                icon="∿"
                color="#2563eb"
                bgLight="#eff6ff"
              />
            </View>
          </View>
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

        <View style={styles.selectionPanel}>
          <Text style={styles.selectionTitle}>PREFERRED MOTOR ICON STYLE</Text>
          <Text style={styles.selectionSubtitle}>Select the style of pump displayed in your panels</Text>
          <View style={styles.selectionRow}>
            {['DEFAULT', 'A', 'B', 'C', 'D'].map(styleOption => {
              const isSelected = iconStyle === styleOption;
              const getOptionLabel = (opt) => {
                switch (opt) {
                  case 'DEFAULT': return 'Default';
                  case 'A': return 'Centrifugal';
                  case 'B': return 'Submersible';
                  case 'C': return 'Inline';
                  case 'D': return 'Diaphragm';
                  default: return opt;
                }
              };
              const optionLabel = getOptionLabel(styleOption);
              return (
                <TouchableOpacity
                  key={styleOption}
                  style={styles.selectionItem}
                  onPress={() => setMotorIcon(motorId, styleOption)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.thumbnailContainer,
                    isSelected && styles.thumbnailContainerActive
                  ]}>
                    <MotorPumpIcon
                      size={44}
                      color={isSelected ? COLORS.accent : COLORS.muted}
                      status={motorStatus}
                      styleName={styleOption}
                    />
                  </View>
                  <Text style={[
                    styles.selectionItemLabel,
                    isSelected && styles.selectionItemLabelActive
                  ]}>
                    {optionLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
    padding: 14,
    paddingBottom: 96,
  },
  backLink: {
    marginBottom: 12,
  },
  backLinkText: {
    color: COLORS.accent,
    fontWeight: '900',
  },

  topStatusRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 14,
  },
  controlPanelColumn: {
    flex: 1.35,
    minWidth: 0,
  },

  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 14,
    borderLeftWidth: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  heroText: {
    flex: 1,
    paddingRight: 10,
    minWidth: 0,
  },
  kicker: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
  },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '900',
  },
  caption: {
    marginTop: 9,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  motorIconBox: {
    width: 86,
    height: 86,
    borderRadius: 22,
    backgroundColor: '#f4f7fb',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  onButton: {
    backgroundColor: COLORS.success,
    borderBottomWidth: 3,
    borderBottomColor: '#059669', // Darker emerald-600
    borderColor: '#34d399',      // Lighter emerald-400
    borderWidth: 1,
  },
  offButton: {
    backgroundColor: COLORS.off,
    borderBottomWidth: 3,
    borderBottomColor: '#475569', // Darker slate-600
    borderColor: '#94a3b8',      // Lighter slate-400
    borderWidth: 1,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  liveStatusPanel: {
    flex: 0.85,
    minWidth: 0,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  liveStatusIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  liveStatusIcon: {
    fontSize: 24,
    fontWeight: '900',
  },
  liveStatusValue: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 12,
  },
  liveStatusLabel: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },

  measurementsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  measurementPanel: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8edf3',
  },
  measurementHeader: {
    marginBottom: 12,
  },
  measurementTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
  },
  measurementSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
    fontWeight: '700',
  },

  phaseGrid: {
    gap: 10,
  },
  phaseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
    gap: 7,
  },
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
  },
  phaseName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
  },
  phaseBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phaseIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f4f7fb',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 36,
    fontSize: 19,
    marginRight: 9,
  },
  phaseTextBox: {
    flex: 1,
    minWidth: 0,
  },
  phaseTitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  phaseValue: {
    color: COLORS.text,
    fontSize: 18,
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

  selectionPanel: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  selectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  selectionSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '700',
    marginBottom: 14,
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectionItem: {
    flex: 1,
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f4f7fb',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  thumbnailContainerActive: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}08`,
  },
  selectionItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
  },
  selectionItemLabelActive: {
    color: COLORS.accent,
    fontWeight: '900',
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