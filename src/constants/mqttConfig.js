export const MQTT_CONFIG = {
  brokerUrl: 'wss://mqtt.archidtech.in:443',
  path: '/mqtt',
  username: 'archiduser',
  password: 'suresh123',

  // Let MQTT.js handle reconnect automatically.
  // Do not create a second manual reconnect loop.
  reconnectPeriod: 5000,
  connectTimeout: 30000,
  keepalive: 60,

  qos: 1,
  clean: true,
  resubscribe: true,
};

export const getMqttUrl = () => `${MQTT_CONFIG.brokerUrl}${MQTT_CONFIG.path}`;