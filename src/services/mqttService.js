import * as mqttModule from 'mqtt';
import { MQTT_CONFIG, getMqttUrl } from '../constants/mqttConfig';

const getMqttConnect = () => {
  const candidates = [
    mqttModule?.connect,
    mqttModule?.default?.connect,
    mqttModule?.default,
    mqttModule,
  ];

  const connectFn = candidates.find(candidate => typeof candidate === 'function');

  if (!connectFn) {
    throw new Error(
      'MQTT connect function not found. Check mqtt package import and Metro polyfills.',
    );
  }

  return connectFn;
};

class MqttService {
  client = null;
  statusListeners = new Set();
  messageListeners = new Set();

  connect() {
    if (this.client) {
      return this.client;
    }

    this.emitStatus('CONNECTING');

    const clientId = `rn_${Math.random().toString(16).slice(2, 10)}`;
    const url = getMqttUrl();
    const mqttConnect = getMqttConnect();

    this.client = mqttConnect(url, {
      username: MQTT_CONFIG.username,
      password: MQTT_CONFIG.password,
      clientId,
      reconnectPeriod: MQTT_CONFIG.reconnectPeriod,
      connectTimeout: MQTT_CONFIG.connectTimeout,
      clean: true,
    });

    this.client.on('connect', () => this.emitStatus('CONNECTED'));
    this.client.on('reconnect', () => this.emitStatus('RECONNECTING'));
    this.client.on('close', () => this.emitStatus('OFFLINE'));
    this.client.on('offline', () => this.emitStatus('OFFLINE'));
    this.client.on('error', error => this.emitStatus('ERROR', error?.message));
    this.client.on('message', (topic, message) => {
      this.messageListeners.forEach(listener => listener(topic, message));
    });

    return this.client;
  }

  subscribe(topic, options = { qos: MQTT_CONFIG.qos }) {
    if (!this.client) return;

    this.client.subscribe(topic, options, error => {
      if (error) {
        this.emitStatus('ERROR', error.message);
      }
    });
  }

  publish(topic, payload, options = { qos: MQTT_CONFIG.qos, retain: false }) {
    if (!this.client || !this.client.connected) {
      this.emitStatus('ERROR', 'MQTT client is not connected');
      return false;
    }

    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);

    this.client.publish(topic, message, options, error => {
      if (error) {
        this.emitStatus('ERROR', error.message);
      }
    });

    return true;
  }

  disconnect() {
    if (!this.client) return;

    this.client.end(true);
    this.client = null;
    this.emitStatus('OFFLINE');
  }

  onStatus(listener) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  onMessage(listener) {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  emitStatus(status, errorMessage = '') {
    this.statusListeners.forEach(listener => listener(status, errorMessage));
  }

  isConnected() {
    return Boolean(this.client?.connected);
  }
}

export const mqttService = new MqttService();