export const MQTT_CONFIG = {
  brokerUrl: 'wss://archidtech.in:9443',
  path: '/mqtt',
  username: 'admin',
  password: 'suresh123',
  reconnectPeriod: 3000,
  connectTimeout: 15000,
  qos: 1,
};

export const getMqttUrl = () => `${MQTT_CONFIG.brokerUrl}${MQTT_CONFIG.path}`;
