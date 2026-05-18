import { Buffer } from 'buffer';

export const normalizeMotorStatus = value => {
  if (value === true) return 'ON';
  if (value === false) return 'OFF';

  const normalized = String(value || '').trim().toUpperCase();

  if (['ON', 'RUNNING', 'START', 'STARTED', 'ACTIVE', '1', 'TRUE'].includes(normalized)) {
    return 'ON';
  }

  if (['OFF', 'STOP', 'STOPPED', 'INACTIVE', '0', 'FALSE'].includes(normalized)) {
    return 'OFF';
  }

  if (['FAULT', 'ERROR', 'TRIP', 'TRIPPED', 'FAILED'].includes(normalized)) {
    return 'FAULT';
  }

  if (normalized === 'PENDING') return 'PENDING';

  return normalized || 'UNKNOWN';
};

export const extractMotorIdFromTopic = topic => {
  const parts = String(topic || '').split('/');
  const motorIndex = parts.findIndex(part => part === 'motor');

  if (motorIndex >= 0 && parts[motorIndex + 1] && parts[motorIndex + 1] !== 'status') {
    return parts[motorIndex + 1];
  }

  return null;
};

export const parseMqttPayload = message => {
  const text = Buffer.isBuffer(message) ? message.toString() : String(message || '');

  try {
    return JSON.parse(text);
  } catch (error) {
    return {status: text};
  }
};

export const buildMotorCommandPayload = (motor, command = 'SELECT') => ({
  motorId: motor.id,
  motorName: motor.name,
  command,
  requestedState: motor.status === 'ON' ? 'OFF' : 'ON',
  source: 'archid-motor-mobile',
  timestamp: new Date().toISOString(),
});

export const mergeParameters = (currentParameters, incoming = {}) => ({
  ...currentParameters,
  voltage: incoming.voltage ?? incoming.v ?? currentParameters.voltage,
  current: incoming.current ?? incoming.amps ?? currentParameters.current,
  rpm: incoming.rpm ?? currentParameters.rpm,
  temperature: incoming.temperature ?? incoming.temp ?? currentParameters.temperature,
  runStatus: incoming.runStatus ?? incoming.run_status ?? incoming.status ?? currentParameters.runStatus,
  faultStatus: incoming.faultStatus ?? incoming.fault_status ?? incoming.fault ?? currentParameters.faultStatus,
});
