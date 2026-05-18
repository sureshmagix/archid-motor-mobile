import 'react-native-get-random-values';

import 'react-native-url-polyfill/auto';


import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
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

  subscribedTopics = new Map();
  reconnectTimer = null;
  reconnectAttempt = 0;
  appStateSubscription = null;
  netInfoUnsubscribe = null;

  isManuallyDisconnected = false;
  isNetworkAvailable = true;

  connect() {
    if (this.client?.connected) {
      return this.client;
    }

    this.isManuallyDisconnected = false;
    this.setupNetworkListeners();
    this.createClient();

    return this.client;
  }

  createClient() {
    this.clearReconnectTimer();

    if (this.client) {
      try {
        this.client.end(true);
      } catch (error) {
        console.log('MQTT old client close error:', error?.message);
      }
      this.client = null;
    }

    if (!this.isNetworkAvailable) {
      this.emitStatus('OFFLINE', 'No internet connection');
      return null;
    }

    this.emitStatus('CONNECTING');

    const clientId = `archid_motor_${Date.now()}_${Math.random()
      .toString(16)
      .slice(2, 8)}`;

    const mqttConnect = getMqttConnect();
    const url = getMqttUrl();

    this.client = mqttConnect(url, {
      username: MQTT_CONFIG.username,
      password: MQTT_CONFIG.password,
      clientId,
      reconnectPeriod: MQTT_CONFIG.reconnectPeriod,
      connectTimeout: MQTT_CONFIG.connectTimeout,
      keepalive: MQTT_CONFIG.keepalive,
      clean: MQTT_CONFIG.clean,
      resubscribe: true,
    });

    this.client.on('connect', () => {
      this.reconnectAttempt = 0;
      this.emitStatus('CONNECTED');
      this.resubscribeAll();
    });

    this.client.on('reconnect', () => {
      this.emitStatus('RECONNECTING');
    });

    this.client.on('close', () => {
      if (!this.isManuallyDisconnected) {
        this.emitStatus('OFFLINE');
        this.scheduleReconnect();
      }
    });

    this.client.on('offline', () => {
      if (!this.isManuallyDisconnected) {
        this.emitStatus('OFFLINE');
        this.scheduleReconnect();
      }
    });

    this.client.on('error', error => {
      this.emitStatus('ERROR', error?.message || 'MQTT connection error');
      this.scheduleReconnect();
    });

    this.client.on('message', (topic, message) => {
      this.messageListeners.forEach(listener => listener(topic, message));
    });

    return this.client;
  }

  setupNetworkListeners() {
    if (!this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
        const isConnected = Boolean(state.isConnected && state.isInternetReachable !== false);

        this.isNetworkAvailable = isConnected;

        if (!isConnected) {
          this.emitStatus('OFFLINE', 'Internet disconnected');
          return;
        }

        if (!this.client?.connected && !this.isManuallyDisconnected) {
          this.scheduleReconnect(1000);
        }
      });
    }

    if (!this.appStateSubscription) {
      this.appStateSubscription = AppState.addEventListener('change', nextState => {
        if (nextState === 'active' && !this.client?.connected && !this.isManuallyDisconnected) {
          this.scheduleReconnect(1000);
        }
      });
    }
  }

  scheduleReconnect(delayOverride = null) {
    if (this.isManuallyDisconnected || this.reconnectTimer || !this.isNetworkAvailable) {
      return;
    }

    this.reconnectAttempt += 1;

    const delay =
      delayOverride ??
      Math.min(
        MQTT_CONFIG.reconnectPeriod * this.reconnectAttempt,
        MQTT_CONFIG.maxReconnectDelay,
      );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.createClient();
    }, delay);
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  subscribe(topic, options = { qos: MQTT_CONFIG.qos }) {
    this.subscribedTopics.set(topic, options);

    if (!this.client?.connected) {
      return;
    }

    this.client.subscribe(topic, options, error => {
      if (error) {
        this.emitStatus('ERROR', error.message);
      }
    });
  }

  resubscribeAll() {
    this.subscribedTopics.forEach((options, topic) => {
      this.client?.subscribe(topic, options, error => {
        if (error) {
          this.emitStatus('ERROR', error.message);
        }
      });
    });
  }

  publish(topic, payload, options = { qos: MQTT_CONFIG.qos, retain: false }) {
    if (!this.client?.connected) {
      this.emitStatus('ERROR', 'MQTT client is not connected');
      this.scheduleReconnect(1000);
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
    this.isManuallyDisconnected = true;
    this.clearReconnectTimer();

    if (this.client) {
      this.client.end(true);
      this.client = null;
    }

    this.emitStatus('OFFLINE');
  }

  destroy() {
    this.disconnect();

    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
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