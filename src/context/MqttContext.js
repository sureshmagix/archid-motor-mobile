// src/context/MqttContext.js

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { INITIAL_MOTORS } from '../constants/motors';
import { TOPICS, getTopicPrefix } from '../constants/topics';
import { useAuth } from './AuthContext';
import { mqttService } from '../services/mqttService';

import {
  buildMotorCommandPayload,
  extractMotorIdFromTopic,
  mergeParameters,
  normalizeMotorStatus,
  parseMqttPayload,
} from '../utils/motorStatus';

const MqttContext = createContext(null);

const MQTT_DEBUG = true;

const debugLog = (...args) => {
  if (MQTT_DEBUG) {
    console.log(...args);
  }
};

const debugWarn = (...args) => {
  if (MQTT_DEBUG) {
    console.warn(...args);
  }
};

const debugError = (...args) => {
  if (MQTT_DEBUG) {
    console.error(...args);
  }
};

const getInitialConnectionStatus = () => {
  if (mqttService.isConnected()) {
    return 'CONNECTED';
  }

  if (typeof mqttService.getStatus === 'function') {
    return mqttService.getStatus();
  }

  return 'CONNECTING';
};

export const MqttProvider = ({ children }) => {
  const { user } = useAuth();

  /**
   * MQTT topic prefix is based on logged-in username.
   *
   * Example:
   * username: admin
   *
   * Final topics:
   * admin/motor/status
   * admin/motor/+/status
   * admin/motor/+/confirmation
   * admin/motor/+/telemetry
   * admin/motor/motor-1/command
   */
  const topicPrefix = useMemo(() => {
    return getTopicPrefix(user?.username);
  }, [user?.username]);

  const [connectionStatus, setConnectionStatus] = useState(
    getInitialConnectionStatus,
  );
  const [connectionError, setConnectionError] = useState('');
  const [lastMessage, setLastMessage] = useState(
    'No MQTT messages received yet',
  );
  const [motors, setMotors] = useState(INITIAL_MOTORS);
  const [selectedIcons, setSelectedIcons] = useState({});

  /**
   * Tracks which prefix is already subscribed.
   * If user changes from guest -> admin, this allows admin topics to subscribe.
   */
  const subscribedPrefixRef = useRef(null);

  /**
   * Logs user and topic prefix whenever login user changes.
   */
  useEffect(() => {
    debugLog('================ MQTT USER DEBUG ================');
    debugLog('[MQTT DEBUG] Logged-in user object:', user);
    debugLog('[MQTT DEBUG] Logged-in username:', user?.username);
    debugLog('[MQTT DEBUG] Final MQTT topic prefix:', topicPrefix);
    debugLog(
      '[MQTT DEBUG] Legacy motor status topic:',
      TOPICS.legacyMotorStatus(topicPrefix),
    );
    debugLog(
      '[MQTT DEBUG] Motor status wildcard:',
      TOPICS.motorStatusWildcard(topicPrefix),
    );
    debugLog(
      '[MQTT DEBUG] Motor confirmation wildcard:',
      TOPICS.motorConfirmationWildcard(topicPrefix),
    );
    debugLog(
      '[MQTT DEBUG] Motor telemetry wildcard:',
      TOPICS.motorTelemetryWildcard(topicPrefix),
    );
    debugLog('=================================================');
  }, [user, topicPrefix]);

  const registerSubscriptions = useCallback(() => {
    if (!topicPrefix) {
      debugWarn('[MQTT DEBUG] Subscription skipped. Empty topic prefix.');
      return;
    }

    if (subscribedPrefixRef.current === topicPrefix) {
      debugLog(
        '[MQTT DEBUG] Subscriptions already registered for prefix:',
        topicPrefix,
      );
      return;
    }

    const subscribeTopics = [
      TOPICS.legacyMotorStatus(topicPrefix),
      TOPICS.motorStatusWildcard(topicPrefix),
      TOPICS.motorConfirmationWildcard(topicPrefix),
      TOPICS.motorTelemetryWildcard(topicPrefix),
    ];

    debugLog('================ MQTT SUBSCRIBE DEBUG ================');
    debugLog('[MQTT DEBUG] Registering subscriptions for prefix:', topicPrefix);
    debugLog('[MQTT DEBUG] MQTT connected:', mqttService.isConnected());

    subscribeTopics.forEach(topic => {
      debugLog('[MQTT DEBUG] Subscribing to:', topic);
      mqttService.subscribe(topic);
    });

    subscribedPrefixRef.current = topicPrefix;

    debugLog('[MQTT DEBUG] Subscription registration completed.');
    debugLog('======================================================');
  }, [topicPrefix]);

  useEffect(() => {
    debugLog('================ MQTT EFFECT DEBUG ================');
    debugLog('[MQTT DEBUG] MqttProvider effect started.');
    debugLog('[MQTT DEBUG] Current topic prefix:', topicPrefix);
    debugLog('[MQTT DEBUG] MQTT connected:', mqttService.isConnected());
    debugLog('===================================================');

    const unsubscribeStatus = mqttService.onStatus((status, errorMessage) => {
      const finalStatus = mqttService.isConnected() ? 'CONNECTED' : status;

      debugLog('================ MQTT STATUS DEBUG ================');
      debugLog('[MQTT DEBUG] Raw status:', status);
      debugLog('[MQTT DEBUG] Final status:', finalStatus);
      debugLog('[MQTT DEBUG] Error message:', errorMessage || '');
      debugLog('[MQTT DEBUG] MQTT connected:', mqttService.isConnected());
      debugLog('===================================================');

      setConnectionStatus(finalStatus);
      setConnectionError(errorMessage || '');

      if (finalStatus === 'CONNECTED') {
        registerSubscriptions();
      }
    });

    const unsubscribeMessages = mqttService.onMessage((topic, rawMessage) => {
      debugLog('================ MQTT MESSAGE DEBUG ================');
      debugLog('[MQTT DEBUG] Incoming topic:', topic);
      debugLog('[MQTT DEBUG] Raw message:', rawMessage?.toString?.() || rawMessage);
      debugLog('[MQTT DEBUG] Current topic prefix:', topicPrefix);
      debugLog('====================================================');

      /**
       * Ignore messages that do not belong to the current login username.
       *
       * Example:
       * If logged-in user is admin, process only:
       * admin/...
       */
      if (!topic.startsWith(`${topicPrefix}/`)) {
        debugWarn('[MQTT DEBUG] Ignored topic because prefix does not match.');
        debugWarn('[MQTT DEBUG] Expected prefix:', `${topicPrefix}/`);
        debugWarn('[MQTT DEBUG] Received topic:', topic);
        return;
      }

      const payload = parseMqttPayload(rawMessage);

      debugLog('[MQTT DEBUG] Parsed payload:', payload);

      const motorIdFromTopic = extractMotorIdFromTopic(topic);
      const motorId = payload.motorId || payload.id || motorIdFromTopic;

      debugLog('[MQTT DEBUG] Motor ID from topic:', motorIdFromTopic);
      debugLog('[MQTT DEBUG] Final motor ID:', motorId);

      const rawStatus =
        payload.status ??
        payload.state ??
        payload.confirmation ??
        payload.runStatus;

      const normalizedStatus =
        rawStatus !== undefined && rawStatus !== null
          ? normalizeMotorStatus(rawStatus)
          : null;

      debugLog('[MQTT DEBUG] Raw status from payload:', rawStatus);
      debugLog('[MQTT DEBUG] Normalized status:', normalizedStatus);

      /**
       * If messages are arriving, MQTT is definitely connected.
       */
      if (mqttService.isConnected()) {
        setConnectionStatus('CONNECTED');
        setConnectionError('');
        registerSubscriptions();
      }

      setLastMessage(`${topic} → ${JSON.stringify(payload)}`);

      setMotors(currentMotors =>
        currentMotors.map(motor => {
          const shouldUpdate =
            motor.id === motorId ||
            String(motor.id).endsWith(
              String(motorId || '').replace('motor-', ''),
            ) ||
            (!motorId && topic === TOPICS.legacyMotorStatus(topicPrefix));

          debugLog('[MQTT DEBUG] Checking motor update:', {
            existingMotorId: motor.id,
            receivedMotorId: motorId,
            shouldUpdate,
          });

          if (!shouldUpdate) {
            return motor;
          }

          return {
            ...motor,
            status: normalizedStatus || motor.status,
            lastMessage:
              payload.message ||
              (normalizedStatus
                ? `MQTT confirmation: ${normalizedStatus}`
                : 'MQTT telemetry updated'),
            updatedAt: new Date().toISOString(),
            parameters: mergeParameters(
              motor.parameters,
              payload.parameters || payload,
            ),
          };
        }),
      );
    });

    mqttService.connect();

    debugLog('[MQTT DEBUG] mqttService.connect() called.');

    /**
     * If already connected before this component mounted,
     * update UI immediately.
     */
    if (mqttService.isConnected()) {
      debugLog('[MQTT DEBUG] MQTT already connected. Registering subscriptions.');
      setConnectionStatus('CONNECTED');
      setConnectionError('');
      registerSubscriptions();
    }

    return () => {
      debugLog('[MQTT DEBUG] Cleaning MQTT listeners for prefix:', topicPrefix);

      unsubscribeStatus();
      unsubscribeMessages();

      /**
       * Do not disconnect here.
       * Keep one MQTT client alive while the app is running.
       */
    };
  }, [registerSubscriptions, topicPrefix]);

  const selectMotor = useCallback(
    motor => {
      const payload = buildMotorCommandPayload(motor, 'SELECT');
      const topic = TOPICS.motorCommand(topicPrefix, motor.id);

      debugLog('================ MQTT PUBLISH DEBUG ================');
      debugLog('[MQTT DEBUG] Action: SELECT MOTOR');
      debugLog('[MQTT DEBUG] Logged-in username:', user?.username);
      debugLog('[MQTT DEBUG] Topic prefix:', topicPrefix);
      debugLog('[MQTT DEBUG] Motor ID:', motor.id);
      debugLog('[MQTT DEBUG] Publish topic:', topic);
      debugLog('[MQTT DEBUG] Payload:', payload);
      debugLog('[MQTT DEBUG] MQTT connected:', mqttService.isConnected());

      const published = mqttService.publish(topic, payload);

      debugLog('[MQTT DEBUG] Publish result:', published);
      debugLog('====================================================');

      setMotors(currentMotors =>
        currentMotors.map(item =>
          item.id === motor.id
            ? {
              ...item,
              status: published ? 'PENDING' : item.status,
              lastMessage: published
                ? 'Command sent. Waiting for MQTT confirmation...'
                : 'MQTT not connected. Command was not sent.',
            }
            : item,
        ),
      );
    },
    [topicPrefix, user?.username],
  );

  const controlMotor = useCallback(
    (motor, requestedState) => {
      const payload = {
        ...buildMotorCommandPayload(motor, 'SET_STATE'),
        requestedState,
      };

      const topic = TOPICS.motorCommand(topicPrefix, motor.id);

      debugLog('================ MQTT PUBLISH DEBUG ================');
      debugLog('[MQTT DEBUG] Action: CONTROL MOTOR');
      debugLog('[MQTT DEBUG] Requested state:', requestedState);
      debugLog('[MQTT DEBUG] Logged-in username:', user?.username);
      debugLog('[MQTT DEBUG] Topic prefix:', topicPrefix);
      debugLog('[MQTT DEBUG] Motor ID:', motor.id);
      debugLog('[MQTT DEBUG] Publish topic:', topic);
      debugLog('[MQTT DEBUG] Payload:', payload);
      debugLog('[MQTT DEBUG] MQTT connected:', mqttService.isConnected());

      const published = mqttService.publish(topic, payload);

      debugLog('[MQTT DEBUG] Publish result:', published);
      debugLog('====================================================');

      setMotors(currentMotors =>
        currentMotors.map(item =>
          item.id === motor.id
            ? {
              ...item,
              status: published ? 'PENDING' : item.status,
              lastMessage: published
                ? `Requested ${requestedState}. Waiting for confirmation...`
                : 'MQTT not connected. Command was not sent.',
            }
            : item,
        ),
      );
    },
    [topicPrefix, user?.username],
  );

  const setMotorIcon = useCallback((motorId, iconStyle) => {
    setSelectedIcons(prev => ({
      ...prev,
      [motorId]: iconStyle,
    }));
  }, []);

  const value = useMemo(
    () => ({
      connectionStatus,
      connectionError,
      lastMessage,
      motors,
      selectMotor,
      controlMotor,
      topicPrefix,
      selectedIcons,
      setMotorIcon,
    }),
    [
      connectionStatus,
      connectionError,
      lastMessage,
      motors,
      selectMotor,
      controlMotor,
      topicPrefix,
      selectedIcons,
      setMotorIcon,
    ],
  );

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
};

export const useMqtt = () => useContext(MqttContext);