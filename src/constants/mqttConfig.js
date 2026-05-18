export const MQTT_CONFIG = {
  brokerUrl: 'wss://mqtt.archidtech.in:443',
  path: '/mqtt',
  username: 'archiduser',
  password: 'suresh123',

  reconnectPeriod: 5000,
  connectTimeout: 30000,
  keepalive: 30,
  qos: 1,
  clean: true,

  maxReconnectDelay: 30000,
};

export const getMqttUrl = () => `${MQTT_CONFIG.brokerUrl}${MQTT_CONFIG.path}`;