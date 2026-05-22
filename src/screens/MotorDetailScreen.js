import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import HeaderBar from '../components/HeaderBar';
import MotorPumpIcon from '../components/MotorPumpIcon';
import { COLORS, statusColor } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useMqtt } from '../context/MqttContext';
import { useTheme } from '../context/ThemeContext';
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

const getMotorStatusColor = (status, colors) => {
  const activeColors = colors || COLORS;
  const text = String(status).toUpperCase();

  if (text.includes('ON') || text.includes('RUN') || text.includes('ACTIVE')) {
    return activeColors.success;
  }

  if (text.includes('FAULT') || text.includes('TRIP') || text.includes('ERROR')) {
    return activeColors.danger;
  }

  if (text.includes('OFF') || text.includes('STOP')) {
    return activeColors.off;
  }

  return activeColors.accent;
};

const PhaseCard = ({ phase, title, value, unit, icon, color, bgLight, isDark, styles = {} }) => {
  const resolvedBg = isDark ? `${color}18` : bgLight;
  return (
    <View style={[styles.phaseCard, resolvedBg ? { backgroundColor: resolvedBg, borderColor: `${color}33`, borderWidth: 1 } : null]}>
      <View style={styles.phaseHeader}>
        <View style={[styles.phaseDot, { backgroundColor: color }]} />
        <Text style={styles.phaseName}>{phase}</Text>
      </View>

      <View style={styles.phaseBody}>
        <Text style={[styles.phaseIcon, isDark ? { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#fff' } : { backgroundColor: 'rgba(255, 255, 255, 0.75)' }]}>{icon}</Text>
        <View style={styles.phaseTextBox}>
          <Text style={styles.phaseTitle}>{title}</Text>
          <Text style={styles.phaseValue}>{formatElectricalValue(value, unit)}</Text>
        </View>
      </View>
    </View>
  );
};

const MotorDetailScreen = ({ navigation, route }) => {
  const { publishRefresh } = useScreenMqttActivity('MotorDetail');
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const isStacked = width < 480;

  const { logout } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isStacked), [colors, isStacked]);
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
  const motorBaseColor = statusColor(motor.status, colors);

  const motorStatus = normalizeStatus(
    getFirstValue(
      params.motorStatus,
      params.runStatus,
      params.status,
      motor.status
    )
  );

  const motorStatusColor = getMotorStatusColor(motorStatus, colors);

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
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back to Home</Text>
        </TouchableOpacity>

        {/* Motor Control Panel + Live Motor Status */}
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
                  size={54}
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

        {/* Voltage + Current Measurements */}
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
                isDark={isDark}
                styles={styles}
              />

              <PhaseCard
                phase="YB"
                title="Voltage"
                value={voltageYB}
                unit="V"
                icon="⚡"
                color="#f59e0b"
                bgLight="#fffbeb"
                isDark={isDark}
                styles={styles}
              />

              <PhaseCard
                phase="RB"
                title="Voltage"
                value={voltageRB}
                unit="V"
                icon="⚡"
                color="#2563eb"
                bgLight="#eff6ff"
                isDark={isDark}
                styles={styles}
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
                isDark={isDark}
                styles={styles}
              />

              <PhaseCard
                phase="Y"
                title="Current"
                value={currentY}
                unit="A"
                icon="∿"
                color="#f59e0b"
                bgLight="#fffbeb"
                isDark={isDark}
                styles={styles}
              />

              <PhaseCard
                phase="B"
                title="Current"
                value={currentB}
                unit="A"
                icon="∿"
                color="#2563eb"
                bgLight="#eff6ff"
                isDark={isDark}
                styles={styles}
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
                      size={34}
                      color={isSelected ? colors.accent : colors.muted}
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

const getStyles = (colors, isStacked) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.page,
  },
  content: {
    padding: 10,
    paddingBottom: 72,
  },
  backLink: {
    marginBottom: 8,
  },
  backLinkText: {
    color: colors.accent,
    fontWeight: '900',
  },

  topStatusRow: {
    flexDirection: isStacked ? 'column' : 'row',
    alignItems: 'stretch',
    gap: 10,
    marginBottom: 10,
  },
  controlPanelColumn: {
    flex: isStacked ? undefined : 1.35,
    width: isStacked ? '100%' : undefined,
    minWidth: 0,
  },

  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 10,
    borderLeftWidth: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  heroText: {
    flex: 1,
    paddingRight: 10,
    minWidth: 0,
  },
  kicker: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  caption: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  motorIconBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  onButton: {
    backgroundColor: colors.success,
    borderBottomWidth: 3,
    borderBottomColor: colors.isDark ? '#065f46' : '#059669',
    borderColor: colors.isDark ? '#34d399' : '#34d399',
    borderWidth: 1,
  },
  offButton: {
    backgroundColor: colors.off,
    borderBottomWidth: 3,
    borderBottomColor: colors.isDark ? '#334155' : '#475569',
    borderColor: colors.isDark ? '#64748b' : '#94a3b8',
    borderWidth: 1,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  liveStatusPanel: {
    flex: isStacked ? undefined : 0.85,
    width: isStacked ? '100%' : undefined,
    minWidth: 0,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 10,
    justifyContent: 'space-between',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    minHeight: isStacked ? 100 : undefined,
  },
  liveStatusIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  liveStatusIcon: {
    fontSize: 18,
    fontWeight: '900',
  },
  liveStatusValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6,
  },
  liveStatusLabel: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },

  measurementsRow: {
    flexDirection: isStacked ? 'column' : 'row',
    alignItems: 'stretch',
    gap: 10,
    marginBottom: 12,
  },
  measurementPanel: {
    flex: isStacked ? undefined : 1,
    width: isStacked ? '100%' : undefined,
    minWidth: 0,
    backgroundColor: colors.borderLight,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  measurementHeader: {
    marginBottom: 8,
  },
  measurementTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  measurementSubtitle: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 2,
    fontWeight: '700',
  },

  phaseGrid: {
    gap: 8,
  },
  phaseCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
  },
  phaseName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  phaseBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phaseIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 28,
    fontSize: 14,
    marginRight: 8,
  },
  phaseTextBox: {
    flex: 1,
    minWidth: 0,
  },
  phaseTitle: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  phaseValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 1,
  },

  infoBox: {
    marginTop: 2,
    backgroundColor: colors.borderLight,
    borderRadius: 16,
    padding: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 13,
  },
  infoText: {
    marginTop: 4,
    color: colors.accent,
    fontWeight: '900',
    fontSize: 13,
  },
  infoSmall: {
    marginTop: 4,
    color: colors.muted,
    lineHeight: 15,
    fontSize: 11,
  },

  metricCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderTopWidth: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
    fontWeight: '900',
  },
  metricTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  metricSubtitle: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 11,
  },

  selectionPanel: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  selectionTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  selectionSubtitle: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 1,
    fontWeight: '700',
    marginBottom: 10,
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  selectionItem: {
    flex: 1,
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.borderLight,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  thumbnailContainerActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}08`,
  },
  selectionItemLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.muted,
  },
  selectionItemLabelActive: {
    color: colors.accent,
    fontWeight: '900',
  },

  missingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingText: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: 12,
  },
  backButton: {
    backgroundColor: colors.accent,
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