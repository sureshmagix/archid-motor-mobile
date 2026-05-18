export const MQTT_CONFIG = {
  brokerUrl: 'wss://archidtech.in:9443',
  path: '/mqtt',
  username: 'admin',
  password: 'suresh123',

  reconnectPeriod: 5000,
  connectTimeout: 30000,
  keepalive: 30,
  qos: 1,
  clean: true,

  maxReconnectDelay: 30000,
};

export const getMqttUrl = () => `${MQTT_CONFIG.brokerUrl}${MQTT_CONFIG.path}`;