export const MQTT_CONFIG = {
  brokerUrl: 'wss://mqtt.archidtech.in:443/mqtt',

  username: 'archiduser',
  password: 'suresh123',

  clientIdPrefix: 'archid_motor_mobile',

  reconnectPeriod: 10000,
  connectTimeout: 30000,

  keepalive: 25,

  qos: 1,
  clean: true,
  resubscribe: true,

  reconnectUiGracePeriodMs: 30000,
};

export const getMqttUrl = () => MQTT_CONFIG.brokerUrl;

export const updateMqttConfig = nextConfig => {
  MQTT_CONFIG.brokerUrl = nextConfig.brokerUrl || MQTT_CONFIG.brokerUrl;
  MQTT_CONFIG.username = nextConfig.username ?? MQTT_CONFIG.username;
  MQTT_CONFIG.password = nextConfig.password ?? MQTT_CONFIG.password;
  MQTT_CONFIG.clientIdPrefix =
    nextConfig.clientIdPrefix || MQTT_CONFIG.clientIdPrefix;

  return MQTT_CONFIG;
};