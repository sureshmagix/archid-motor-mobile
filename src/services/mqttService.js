import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import mqtt from 'mqtt';

import { MQTT_CONFIG, getMqttUrl } from '../constants/mqttConfig';

const getMqttConnect = () => {
  const candidates = [
    mqtt?.connect,
    mqtt?.default?.connect,
    mqtt?.default,
    mqtt,
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

  appStateSubscription = null;
  netInfoUnsubscribe = null;

  isManuallyDisconnected = false;
  isNetworkAvailable = true;

  lastStatus = '';
  lastErrorMessage = '';

  connect() {
    this.isManuallyDisconnected = false;
    this.setupNetworkListeners();

    // Important:
    // If a client already exists, do not create another client.
    // MQTT.js will handle reconnect internally.
    if (this.client) {
      return this.client;
    }

    return this.createClient();
  }

  createClient() {
    if (this.client) {
      return this.client;
    }

    if (!this.isNetworkAvailable) {
      this.emitStatus('OFFLINE', 'No internet connection');
      return null;
    }

    this.emitStatus('CONNECTING');

    const clientId = `am_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 6)}`;

    const mqttConnect = getMqttConnect();

    this.client = mqttConnect({
      protocol: 'wss',
      host: 'mqtt.archidtech.in',
      port: 443,
      path: '/mqtt',
      username: MQTT_CONFIG.username,
      password: MQTT_CONFIG.password,
      clientId,
      reconnectPeriod: MQTT_CONFIG.reconnectPeriod,
      connectTimeout: MQTT_CONFIG.connectTimeout,
      keepalive: MQTT_CONFIG.keepalive,
      clean: MQTT_CONFIG.clean,
      resubscribe: MQTT_CONFIG.resubscribe,
      forceNativeWebSocket: true,
    });

    this.client.on('connect', () => {
      console.log('MQTT Client Connected Successfully!');
      this.emitStatus('CONNECTED');
      this.resubscribeAll();
    });

    this.client.on('reconnect', () => {
      if (!this.isManuallyDisconnected) {
        console.log('MQTT Client Reconnecting...');
        this.emitStatus('RECONNECTING');
      }
    });

    this.client.on('close', () => {
      if (this.isManuallyDisconnected) {
        this.emitStatus('OFFLINE');
        return;
      }

      if (!this.isNetworkAvailable) {
        this.emitStatus('OFFLINE', 'No internet connection');
        return;
      }

      // Do not create a new client here.
      // MQTT.js reconnectPeriod will reconnect the same client.
      this.emitStatus('RECONNECTING');
    });

    this.client.on('offline', () => {
      if (!this.isManuallyDisconnected) {
        this.emitStatus('RECONNECTING');
      }
    });

    this.client.on('error', error => {
      // Do not destroy/recreate the client here.
      // MQTT.js will keep reconnecting automatically.
      console.log('MQTT Client Error:', error);
      this.emitStatus('ERROR', error?.message || 'MQTT connection error');
    });

    this.client.on('message', (topic, message) => {
      this.messageListeners.forEach(listener => listener(topic, message));
    });

    return this.client;
  }

  setupNetworkListeners() {
    if (!this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
        const isConnected = Boolean(
          state.isConnected && state.isInternetReachable !== false,
        );

        this.isNetworkAvailable = isConnected;

        if (!isConnected) {
          this.emitStatus('OFFLINE', 'Internet disconnected');
          return;
        }

        if (this.isManuallyDisconnected) {
          return;
        }

        if (!this.client) {
          this.createClient();
          return;
        }

        if (!this.client.connected && typeof this.client.reconnect === 'function') {
          try {
            this.client.reconnect();
          } catch (error) {
            console.log('MQTT reconnect call failed:', error?.message);
          }
        }
      });
    }

    if (!this.appStateSubscription) {
      this.appStateSubscription = AppState.addEventListener(
        'change',
        nextState => {
          if (nextState !== 'active') {
            return;
          }

          if (this.isManuallyDisconnected) {
            return;
          }

          if (!this.client) {
            this.createClient();
            return;
          }

          if (!this.client.connected && typeof this.client.reconnect === 'function') {
            try {
              this.client.reconnect();
            } catch (error) {
              console.log('MQTT reconnect on app active failed:', error?.message);
            }
          }
        },
      );
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
    if (!this.client?.connected) {
      return;
    }

    this.subscribedTopics.forEach((options, topic) => {
      this.client.subscribe(topic, options, error => {
        if (error) {
          this.emitStatus('ERROR', error.message);
        }
      });
    });
  }

  publish(topic, payload, options = { qos: MQTT_CONFIG.qos, retain: false }) {
    if (!this.client) {
      this.connect();
    }

    if (!this.client?.connected) {
      this.emitStatus('RECONNECTING', 'MQTT client is not connected');
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

    if (this.client) {
      try {
        this.client.end(true);
      } catch (error) {
        console.log('MQTT disconnect error:', error?.message);
      }

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

    this.statusListeners.clear();
    this.messageListeners.clear();
    this.subscribedTopics.clear();
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
    // Prevent repeated identical status updates.
    if (this.lastStatus === status && this.lastErrorMessage === errorMessage) {
      return;
    }

    this.lastStatus = status;
    this.lastErrorMessage = errorMessage;

    this.statusListeners.forEach(listener => listener(status, errorMessage));
  }

  isConnected() {
    return Boolean(this.client?.connected);
  }
}

export const mqttService = new MqttService();