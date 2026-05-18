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
import { TOPICS } from '../constants/topics';
import { mqttService } from '../services/mqttService';

import {
  buildMotorCommandPayload,
  extractMotorIdFromTopic,
  mergeParameters,
  normalizeMotorStatus,
  parseMqttPayload,
} from '../utils/motorStatus';

const MqttContext = createContext(null);

export const MqttProvider = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [connectionError, setConnectionError] = useState('');
  const [lastMessage, setLastMessage] = useState(
    'No MQTT messages received yet',
  );
  const [motors, setMotors] = useState(INITIAL_MOTORS);

  const subscriptionsRegisteredRef = useRef(false);

  useEffect(() => {
    const unsubscribeStatus = mqttService.onStatus((status, errorMessage) => {
      setConnectionStatus(status);
      setConnectionError(errorMessage || '');

      if (status === 'CONNECTED' && !subscriptionsRegisteredRef.current) {
        mqttService.subscribe(TOPICS.legacyMotorStatus);
        mqttService.subscribe(TOPICS.motorStatusWildcard);
        mqttService.subscribe(TOPICS.motorConfirmationWildcard);
        mqttService.subscribe(TOPICS.motorTelemetryWildcard);

        subscriptionsRegisteredRef.current = true;
      }
    });

    const unsubscribeMessages = mqttService.onMessage((topic, rawMessage) => {
      const payload = parseMqttPayload(rawMessage);

      const motorIdFromTopic = extractMotorIdFromTopic(topic);
      const motorId = payload.motorId || payload.id || motorIdFromTopic;

      const rawStatus =
        payload.status ??
        payload.state ??
        payload.confirmation ??
        payload.runStatus;

      const normalizedStatus =
        rawStatus !== undefined && rawStatus !== null
          ? normalizeMotorStatus(rawStatus)
          : null;

      setLastMessage(`${topic} → ${JSON.stringify(payload)}`);

      setMotors(currentMotors =>
        currentMotors.map(motor => {
          const shouldUpdate =
            motor.id === motorId ||
            String(motor.id).endsWith(
              String(motorId || '').replace('motor-', ''),
            ) ||
            (!motorId && topic === TOPICS.legacyMotorStatus);

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

    return () => {
      unsubscribeStatus();
      unsubscribeMessages();

      // Important:
      // Do not disconnect here.
      // Keep one MQTT client alive while the app is running.
    };
  }, []);

  const selectMotor = useCallback(motor => {
    const payload = buildMotorCommandPayload(motor, 'SELECT');
    const published = mqttService.publish(TOPICS.motorCommand(motor.id), payload);

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
  }, []);

  const controlMotor = useCallback((motor, requestedState) => {
    const payload = {
      ...buildMotorCommandPayload(motor, 'SET_STATE'),
      requestedState,
    };

    const published = mqttService.publish(TOPICS.motorCommand(motor.id), payload);

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
  }, []);

  const value = useMemo(
    () => ({
      connectionStatus,
      connectionError,
      lastMessage,
      motors,
      selectMotor,
      controlMotor,
    }),
    [
      connectionStatus,
      connectionError,
      lastMessage,
      motors,
      selectMotor,
      controlMotor,
    ],
  );

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
};

export const useMqtt = () => useContext(MqttContext);