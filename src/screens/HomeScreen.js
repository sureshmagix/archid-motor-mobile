import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import HeaderBar from '../components/HeaderBar';
import MotorCard from '../components/MotorCard';
import MotorPumpIcon from '../components/MotorPumpIcon';
import StatusCard from '../components/StatusCard';
import {COLORS, statusColor} from '../constants/colors';
import {useAuth} from '../context/AuthContext';
import {useMqtt} from '../context/MqttContext';

const HomeScreen = ({navigation}) => {
  const {logout} = useAuth();
  const {motors, connectionStatus, connectionError, lastMessage, selectMotor} = useMqtt();

  const runningCount = motors.filter(motor => motor.status === 'ON').length;
  const faultCount = motors.filter(motor => motor.status === 'FAULT').length;
  const overallColor = faultCount > 0 ? COLORS.warning : runningCount > 0 ? COLORS.success : COLORS.off;

  const handleMotorPress = motor => {
    selectMotor(motor);
    navigation.navigate('MotorDetail', {motorId: motor.id});
  };

  return (
    <View style={styles.root}>
      <HeaderBar
        title="ARCHIDTECH | Flow"
        subtitle="Motor Control Dashboard"
        mqttStatus={connectionStatus}
        onLogout={logout}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.masterPanel}>
          <StatusCard
            title="System Network"
            value={connectionStatus === 'CONNECTED' ? 'Online' : connectionStatus}
            caption={connectionError || 'MQTT broker communication'}
            accentColor={connectionStatus === 'CONNECTED' ? COLORS.success : COLORS.danger}
          />

          <StatusCard
            title="Motor Overview"
            value={`${runningCount}/6 Running`}
            caption={faultCount > 0 ? `${faultCount} fault detected` : 'Six motor controller'}
            accentColor={overallColor}>
            <MotorPumpIcon size={62} color={overallColor} />
          </StatusCard>
        </View>

        <Text style={styles.sectionTitle}>Motors</Text>
        <View style={styles.grid}>
          {motors.map(motor => (
            <MotorCard key={motor.id} motor={motor} onPress={handleMotorPress} />
          ))}
        </View>

        <View style={styles.messageBox}>
          <Text style={styles.messageTitle}>Last MQTT Message</Text>
          <Text style={[styles.messageText, {color: statusColor(connectionStatus)}]} numberOfLines={4}>
            {lastMessage}
          </Text>
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
    paddingBottom: 28,
  },
  masterPanel: {
    gap: 14,
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  messageBox: {
    marginTop: 4,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageTitle: {
    color: COLORS.text,
    fontWeight: '900',
    marginBottom: 6,
  },
  messageText: {
    fontSize: 12,
    lineHeight: 18,
  },
});

export default HomeScreen;
