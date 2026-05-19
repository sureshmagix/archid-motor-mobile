import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import NetInfo from '@react-native-community/netinfo';
import { EventEmitter } from 'events';

import { MQTT_CONFIG, getMqttUrl } from '../constants/mqttConfig';

// Use CommonJS require here.
// This is more reliable in React Native than default ESM import for MQTT.js.
const mqttPackage = require('mqtt');
const mqttBrowserBundle = require('mqtt/dist/mqtt');

const getMqttConnect = () => {
  const candidates = [
    mqttPackage?.connect,
    mqttPackage?.default?.connect,
    mqttPackage?.default,
    mqttBrowserBundle?.connect,
    mqttBrowserBundle?.default?.connect,
    mqttBrowserBundle?.default,
    mqttBrowserBundle,
  ];

  return candidates.find(candidate => typeof candidate === 'function');
};

class MqttService extends EventEmitter {
  constructor() {
    super();

    this.client = null;
    this.status = 'OFFLINE';

    this.statusListeners = new Set();
    this.messageListeners = new Set();

    this.topics = new Map();
    this.pendingTopics = new Map();

    this.isConnecting = false;
    this.isManuallyDisconnected = false;
    this.isNetworkAvailable = true;
    this.hasConnectedOnce = false;

    this.netInfoUnsubscribe = null;
    this.reconnectUiTimer = null;

    this.lastStatus = '';
    this.lastErrorMessage = '';
    this.lastLogTimes = new Map();

    // Used to ignore events from older MQTT clients after reconnect.
    this.clientGeneration = 0;
    this.activeGeneration = 0;

    this.setMaxListeners(50);
  }

  connect() {
    this.isManuallyDisconnected = false;
    this.setupNetworkListener();

    if (this.client?.connected) {
      return this.client;
    }

    if (this.isConnecting) {
      return this.client;
    }

    if (this.client) {
      // Client already exists. MQTT.js will reconnect internally.
      return this.client;
    }

    if (!this.isNetworkAvailable) {
      this.emitStatus('OFFLINE', 'No internet connection');
      return null;
    }

    const mqttConnect = getMqttConnect();

    if (!mqttConnect) {
      const message =
        'MQTT connect function not found. Check MQTT.js installation and Metro polyfills.';
      console.log(message);
      this.emitStatus('ERROR', message);
      return null;
    }

    this.isConnecting = true;

    if (!this.hasConnectedOnce) {
      this.emitStatus('CONNECTING');
    }

    const clientId = `${MQTT_CONFIG.clientIdPrefix}_${Date.now().toString(
      36,
    )}_${Math.random().toString(36).slice(2, 8)}`;

    const brokerUrl = getMqttUrl();

    console.log(`MQTT connecting to ${brokerUrl} as ${clientId}`);

    try {
      const generation = ++this.clientGeneration;
      this.activeGeneration = generation;

      const client = mqttConnect(brokerUrl, {
        clientId,
        username: MQTT_CONFIG.username,
        password: MQTT_CONFIG.password,

        clean: MQTT_CONFIG.clean,
        reconnectPeriod: MQTT_CONFIG.reconnectPeriod,
        connectTimeout: MQTT_CONFIG.connectTimeout,
        keepalive: MQTT_CONFIG.keepalive,
        resubscribe: MQTT_CONFIG.resubscribe,

        protocolVersion: 4,
        reconnectOnConnackError: true,
        queueQoSZero: false,

        // React Native WebSocket support.
        forceNativeWebSocket: true,
      });

      this.client = client;
      this.bindClientEvents(client, generation);

      return this.client;
    } catch (error) {
      this.isConnecting = false;
      this.client = null;

      const message = error?.message || 'MQTT connect exception';
      console.log('MQTT connect exception:', message);
      this.emitStatus('ERROR', message);

      return null;
    }
  }

  bindClientEvents(client, generation) {
    if (!client) {
      return;
    }

    const isActiveClient = () =>
      this.client === client && this.activeGeneration === generation;

    client.on('connect', () => {
      if (!isActiveClient()) {
        return;
      }

      this.isConnecting = false;
      this.hasConnectedOnce = true;
      this.status = 'CONNECTED';

      this.clearReconnectUiTimer();

      console.log('MQTT connected successfully');

      this.emitStatus('CONNECTED');
      this.resubscribeAll();
      this.logTopics();
    });

    client.on('reconnect', () => {
      if (!isActiveClient()) {
        return;
      }

      if (this.isManuallyDisconnected) {
        return;
      }

      // Do not immediately show reconnecting in UI.
      // This avoids UI flicker during short network drops.
      console.log('MQTT reconnecting silently...');
      this.scheduleReconnectUiStatus();
    });

    client.on('close', () => {
      if (!isActiveClient()) {
        return;
      }

      this.isConnecting = false;

      if (this.isManuallyDisconnected) {
        this.clearReconnectUiTimer();
        this.status = 'OFFLINE';
        this.emitStatus('OFFLINE');
        return;
      }

      if (!this.isNetworkAvailable) {
        this.clearReconnectUiTimer();
        this.status = 'OFFLINE';
        this.emitStatus('OFFLINE', 'No internet connection');
        return;
      }

      // Do not create a new client here.
      // MQTT.js will reconnect the same client.
      console.log('MQTT socket closed. MQTT.js will reconnect.');
      this.scheduleReconnectUiStatus();
    });

    client.on('offline', () => {
      if (!isActiveClient()) {
        return;
      }

      if (this.isManuallyDisconnected) {
        return;
      }

      console.log('MQTT offline. Waiting for MQTT.js reconnect.');
      this.scheduleReconnectUiStatus();
    });

    client.on('error', error => {
      if (!isActiveClient()) {
        return;
      }

      const errorMessage = error?.message || 'MQTT connection error';

      console.log('MQTT error:', errorMessage);

      // Do not destroy or recreate the client here.
      // MQTT.js reconnectPeriod will handle reconnect.
      if (!this.hasConnectedOnce) {
        this.emitStatus('ERROR', errorMessage);
      } else {
        this.scheduleReconnectUiStatus(errorMessage);
      }
    });

    client.on('message', (topic, message) => {
      if (!isActiveClient()) {
        return;
      }

      const payloadText = message?.toString?.() ?? String(message || '');

      this.throttledLog(topic, payloadText);

      this.emit('message', { topic, data: payloadText });
      this.messageListeners.forEach(listener => listener(topic, payloadText));
    });
  }

  setupNetworkListener() {
    if (this.netInfoUnsubscribe) {
      return;
    }

    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      const isConnected = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );

      this.isNetworkAvailable = isConnected;

      if (!isConnected) {
        this.clearReconnectUiTimer();
        this.emitStatus('OFFLINE', 'Internet disconnected');
        return;
      }

      if (this.isManuallyDisconnected) {
        return;
      }

      // Only create the client if it does not exist.
      // Do not manually call client.reconnect().
      if (!this.client) {
        this.connect();
      }
    });
  }

  scheduleReconnectUiStatus(errorMessage = '') {
    if (this.reconnectUiTimer) {
      return;
    }

    const gracePeriod =
      MQTT_CONFIG.reconnectUiGracePeriodMs !== undefined
        ? MQTT_CONFIG.reconnectUiGracePeriodMs
        : 30000;

    // Keep UI stable for short drops.
    // If it reconnects within the grace period, user will not see "Connecting...".
    if (this.hasConnectedOnce && this.lastStatus === 'CONNECTED') {
      this.reconnectUiTimer = setTimeout(() => {
        this.reconnectUiTimer = null;

        if (!this.client?.connected && !this.isManuallyDisconnected) {
          this.emitStatus('RECONNECTING', errorMessage);
        }
      }, gracePeriod);

      return;
    }

    this.emitStatus('RECONNECTING', errorMessage);
  }

  clearReconnectUiTimer() {
    if (this.reconnectUiTimer) {
      clearTimeout(this.reconnectUiTimer);
      this.reconnectUiTimer = null;
    }
  }

  subscribe(topic, options = { qos: MQTT_CONFIG.qos }) {
    if (!topic) {
      return;
    }

    const finalOptions = {
      qos: options?.qos ?? MQTT_CONFIG.qos,
    };

    this.topics.set(topic, finalOptions);

    if (this.client?.connected) {
      this.subscribeNow(topic, finalOptions);
      return;
    }

    this.pendingTopics.set(topic, finalOptions);
    console.log(`Queued MQTT subscribe until connected: ${topic}`);
  }

  subscribeNow(topic, options = { qos: MQTT_CONFIG.qos }) {
    if (!topic) {
      return;
    }

    const finalOptions = {
      qos: options?.qos ?? MQTT_CONFIG.qos,
    };

    if (!this.client?.connected) {
      this.pendingTopics.set(topic, finalOptions);
      return;
    }

    this.client.subscribe(topic, finalOptions, error => {
      if (error) {
        console.log(`MQTT subscribe error (${topic}):`, error.message);
        this.pendingTopics.set(topic, finalOptions);
        this.emitStatus('ERROR', error.message);
        return;
      }

      this.topics.set(topic, finalOptions);
      this.pendingTopics.delete(topic);

      console.log(`MQTT subscribed: ${topic}`);
    });
  }

  resubscribeAll() {
    if (!this.client?.connected) {
      return;
    }

    const allTopics = new Map([
      ...this.topics.entries(),
      ...this.pendingTopics.entries(),
    ]);

    allTopics.forEach((options, topic) => {
      this.subscribeNow(topic, options);
    });
  }

  unsubscribe(topic) {
    if (!topic) {
      return;
    }

    this.pendingTopics.delete(topic);
    this.topics.delete(topic);

    if (!this.client?.connected) {
      console.log(`MQTT unsubscribe removed offline: ${topic}`);
      return;
    }

    this.client.unsubscribe(topic, error => {
      if (error) {
        console.log(`MQTT unsubscribe error (${topic}):`, error.message);
        return;
      }

      console.log(`MQTT unsubscribed: ${topic}`);
    });
  }

  publish(topic, payload, options = { qos: MQTT_CONFIG.qos, retain: false }) {
    if (!topic) {
      return false;
    }

    if (!this.client) {
      this.connect();
    }

    if (!this.client?.connected) {
      console.log(`MQTT publish skipped. Not connected: ${topic}`);
      return false;
    }

    let message = '';

    try {
      message = typeof payload === 'string' ? payload : JSON.stringify(payload);
    } catch (error) {
      console.log('MQTT payload stringify error:', error?.message || error);
      this.emitStatus('ERROR', 'Invalid MQTT payload');
      return false;
    }

    this.client.publish(
      topic,
      message,
      {
        qos: options?.qos ?? MQTT_CONFIG.qos,
        retain: options?.retain ?? false,
      },
      error => {
        if (error) {
          console.log(`MQTT publish error (${topic}):`, error.message);
          this.emitStatus('ERROR', error.message);
          return;
        }

        console.log(`MQTT published: ${topic}`);
      },
    );

    return true;
  }

  reconnectWithLatestConfig() {
    console.log('MQTT reconnect requested with latest configuration');

    this.isManuallyDisconnected = false;
    this.clearReconnectUiTimer();

    const oldClient = this.client;

    // Invalidate events from the old client immediately.
    this.activeGeneration = ++this.clientGeneration;

    if (oldClient) {
      try {
        if (typeof oldClient.removeAllListeners === 'function') {
          oldClient.removeAllListeners();
        }

        oldClient.end(true);
      } catch (error) {
        console.log('MQTT reconnect close error:', error?.message || error);
      }
    }

    this.client = null;
    this.isConnecting = false;
    this.hasConnectedOnce = false;
    this.status = 'CONNECTING';

    this.emitStatus('CONNECTING');

    return this.connect();
  }

  disconnect() {
    this.isManuallyDisconnected = true;
    this.clearReconnectUiTimer();

    const oldClient = this.client;

    // Invalidate events from the old client immediately.
    this.activeGeneration = ++this.clientGeneration;

    try {
      if (oldClient) {
        if (typeof oldClient.removeAllListeners === 'function') {
          oldClient.removeAllListeners();
        }

        oldClient.end(true, () => {
          console.log('MQTT ended cleanly');
        });
      }
    } catch (error) {
      console.log('MQTT disconnect error:', error?.message || error);
    } finally {
      this.client = null;
      this.isConnecting = false;
      this.status = 'OFFLINE';
      this.emitStatus('OFFLINE');
    }
  }

  destroy() {
    this.disconnect();

    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    this.statusListeners.clear();
    this.messageListeners.clear();
    this.topics.clear();
    this.pendingTopics.clear();
    this.lastLogTimes.clear();

    this.removeAllListeners();
  }

  onStatus(listener) {
    if (typeof listener !== 'function') {
      return () => { };
    }

    this.statusListeners.add(listener);

    // Immediately send current MQTT status to the new listener.
    // This prevents UI from staying in CONNECTING when MQTT is already connected.
    const currentStatus = this.client?.connected
      ? 'CONNECTED'
      : this.status || 'OFFLINE';

    listener(currentStatus, this.lastErrorMessage || '');

    return () => this.statusListeners.delete(listener);
  }

  onMessage(listener) {
    if (typeof listener !== 'function') {
      return () => { };
    }

    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  emitStatus(status, errorMessage = '') {
    if (this.lastStatus === status && this.lastErrorMessage === errorMessage) {
      return;
    }

    this.status = status;
    this.lastStatus = status;
    this.lastErrorMessage = errorMessage;

    this.emit('status', status, errorMessage);
    this.statusListeners.forEach(listener => listener(status, errorMessage));
  }

  throttledLog(topic, payload) {
    const now = Date.now();
    const last = this.lastLogTimes.get(topic) || 0;

    if (now - last > 2000) {
      console.log(`MQTT message ${topic}:`, payload);
      this.lastLogTimes.set(topic, now);
    }
  }

  logTopics() {
    console.log('MQTT active topics:', [...this.topics.keys()]);
  }

  getStatus() {
    if (this.client?.connected) {
      return 'CONNECTED';
    }

    return this.status || 'OFFLINE';
  }

  isConnected() {
    return Boolean(this.client?.connected);
  }
}

export const mqttService = new MqttService();
export default mqttService;