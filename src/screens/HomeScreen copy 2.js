import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import HeaderBar from '../components/HeaderBar';
import MotorCard from '../components/MotorCard';
import MotorPumpIcon from '../components/MotorPumpIcon';
import StatusCard from '../components/StatusCard';

import { COLORS, statusColor } from '../constants/colors';
import { TOPICS } from '../constants/topics';
import { useAuth } from '../context/AuthContext';
import { useMqtt } from '../context/MqttContext';
import { mqttService } from '../services/mqttService';

let hasPublishedHomeVisitInThisAppSession = false;

const HomeScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const { motors, connectionStatus, connectionError, lastMessage, selectMotor } =
    useMqtt();

  useEffect(() => {
    if (hasPublishedHomeVisitInThisAppSession) {
      return;
    }

    if (connectionStatus !== 'CONNECTED') {
      return;
    }

    const published = mqttService.publish(
      TOPICS.mobileHomeVisit,
      {
        event: 'HOME_SCREEN_OPENED',
        screen: 'HomeScreen',
        source: 'archid-motor-mobile',
        timestamp: new Date().toISOString(),
      },
      { qos: 1, retain: false },
    );

    if (published) {
      hasPublishedHomeVisitInThisAppSession = true;
    }
  }, [connectionStatus]);

  const runningCount = motors.filter(motor => motor.status === 'ON').length;
  const faultCount = motors.filter(motor => motor.status === 'FAULT').length;

  const overallColor =
    faultCount > 0
      ? COLORS.warning
      : runningCount > 0
        ? COLORS.success
        : COLORS.off;

  const handleMotorPress = motor => {
    selectMotor(motor);
    navigation.navigate('MotorDetail', { motorId: motor.id });
  };

  return (
    <View style={styles.root}>
      <HeaderBar
        title="ARCHIDTECH | Flow"
        subtitle="Equipment Monitoring Dashboard"
        mqttStatus={connectionStatus}
        onLogout={logout}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroPanel}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroEyebrow}>LIVE EQUIPMENT STATUS</Text>
              <Text style={styles.heroTitle}>Motor Health Overview</Text>
              <Text style={styles.heroSubtitle}>
                MQTT based monitoring and control center
              </Text>
            </View>

            <View
              style={[
                styles.connectionPill,
                {
                  backgroundColor:
                    connectionStatus === 'CONNECTED'
                      ? 'rgba(22, 163, 74, 0.14)'
                      : 'rgba(220, 38, 38, 0.14)',
                },
              ]}>
              <View
                style={[
                  styles.connectionDot,
                  {
                    backgroundColor:
                      connectionStatus === 'CONNECTED'
                        ? COLORS.success
                        : COLORS.danger,
                  },
                ]}
              />
              <Text
                style={[
                  styles.connectionText,
                  {
                    color:
                      connectionStatus === 'CONNECTED'
                        ? COLORS.success
                        : COLORS.danger,
                  },
                ]}>
                {connectionStatus === 'CONNECTED' ? 'Online' : connectionStatus}
              </Text>
            </View>
          </View>

          <View style={styles.heroMetricRow}>
            <View style={styles.heroMetricBlock}>
              <Text style={styles.heroMetricLabel}>Running</Text>
              <Text style={styles.heroMetricValue}>{runningCount}</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroMetricBlock}>
              <Text style={styles.heroMetricLabel}>Faults</Text>
              <Text
                style={[
                  styles.heroMetricValue,
                  { color: faultCount > 0 ? COLORS.warning : COLORS.success },
                ]}>
                {faultCount}
              </Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroMetricBlock}>
              <Text style={styles.heroMetricLabel}>Total</Text>
              <Text style={styles.heroMetricValue}>{motors.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <StatusCard
            title="Network Link"
            value={connectionStatus === 'CONNECTED' ? 'Online' : connectionStatus}
            caption={connectionError || 'MQTT communication active'}
            accentColor={
              connectionStatus === 'CONNECTED' ? COLORS.success : COLORS.danger
            }
            compact
          />

          <StatusCard
            title="Active Motors"
            value={`${runningCount}/${motors.length}`}
            caption={runningCount > 0 ? 'Equipment running' : 'All motors stopped'}
            accentColor={runningCount > 0 ? COLORS.success : COLORS.off}
            compact>
            <MotorPumpIcon
              size={24}
              color={runningCount > 0 ? COLORS.success : COLORS.off}
            />
          </StatusCard>

          <StatusCard
            title="Fault Monitor"
            value={faultCount > 0 ? `${faultCount}` : '0'}
            caption={faultCount > 0 ? 'Attention required' : 'No active faults'}
            accentColor={faultCount > 0 ? COLORS.warning : COLORS.success}
            compact
          />

          <StatusCard
            title="System Health"
            value={faultCount > 0 ? 'Alert' : 'Normal'}
            caption={
              connectionStatus === 'CONNECTED'
                ? 'Equipment status stable'
                : 'Waiting for controller link'
            }
            accentColor={overallColor}
            compact
          />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Motor Equipment</Text>
            <Text style={styles.sectionSubtitle}>
              Select a motor to view details and controls
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{motors.length} Units</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {motors.map(motor => (
            <MotorCard key={motor.id} motor={motor} onPress={handleMotorPress} />
          ))}
        </View>

        <View style={styles.messageBox}>
          <View style={styles.messageHeader}>
            <View>
              <Text style={styles.messageTitle}>Live Communication Log</Text>
              <Text style={styles.messageSubtitle}>Last received MQTT payload</Text>
            </View>

            <View
              style={[
                styles.logStatusDot,
                { backgroundColor: statusColor(connectionStatus) },
              ]}
            />
          </View>

          <Text
            style={[styles.messageText, { color: statusColor(connectionStatus) }]}
            numberOfLines={4}>
            {lastMessage || 'Waiting for MQTT messages...'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F6FA',
  },

  content: {
    padding: 16,
    paddingBottom: 32,
  },

  heroPanel: {
    backgroundColor: '#0F172A',
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },

  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },

  heroEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#93C5FD',
    marginBottom: 6,
  },

  heroTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },

  heroSubtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#CBD5E1',
    maxWidth: 230,
  },

  connectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },

  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  connectionText: {
    fontSize: 11,
    fontWeight: '900',
  },

  heroMetricRow: {
    marginTop: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroMetricBlock: {
    flex: 1,
    alignItems: 'center',
  },

  heroMetricLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 5,
  },

  heroMetricValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  heroDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 22,
  },

  sectionHeader: {
    marginTop: 2,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  countBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },

  countBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0369A1',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    marginBottom: 18,
  },

  messageBox: {
    marginTop: 4,
    backgroundColor: '#0B1120',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },

  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  messageTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  messageSubtitle: {
    marginTop: 3,
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },

  logStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  messageText: {
    fontSize: 12,
    lineHeight: 19,
    fontFamily: 'monospace',
  },
});

export default HomeScreen;