export const MQTT_CONFIG = {
  brokerUrl: 'wss://mqtt.archidtech.in:443/mqtt',

  username: 'archiduser',
  password: 'suresh123',

  clientIdPrefix: 'archid_motor_mobile',

  reconnectPeriod: 10000,
  connectTimeout: 30000,

  // Keep this lower than common proxy idle timeout.
  // This helps keep the WebSocket/MQTT connection alive.
  keepalive: 25,

  qos: 1,
  clean: true,
  resubscribe: true,

  // UI will show RECONNECTING only if MQTT is down for more than this time.
  reconnectUiGracePeriodMs: 30000,
};

export const getMqttUrl = () => MQTT_CONFIG.brokerUrl;