import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {INITIAL_MOTORS} from '../constants/motors';
import {TOPICS} from '../constants/topics';
import {mqttService} from '../services/mqttService';
import {
  buildMotorCommandPayload,
  extractMotorIdFromTopic,
  mergeParameters,
  normalizeMotorStatus,
  parseMqttPayload,
} from '../utils/motorStatus';

const MqttContext = createContext(null);

export const MqttProvider = ({children}) => {
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [connectionError, setConnectionError] = useState('');
  const [lastMessage, setLastMessage] = useState('No MQTT messages received yet');
  const [motors, setMotors] = useState(INITIAL_MOTORS);

  useEffect(() => {
    const unsubscribeStatus = mqttService.onStatus((status, errorMessage) => {
      setConnectionStatus(status);
      setConnectionError(errorMessage || '');

      if (status === 'CONNECTED') {
        mqttService.subscribe(TOPICS.legacyMotorStatus);
        mqttService.subscribe(TOPICS.motorStatusWildcard);
        mqttService.subscribe(TOPICS.motorConfirmationWildcard);
        mqttService.subscribe(TOPICS.motorTelemetryWildcard);
      }
    });

    const unsubscribeMessages = mqttService.onMessage((topic, rawMessage) => {
      const payload = parseMqttPayload(rawMessage);
      const motorIdFromTopic = extractMotorIdFromTopic(topic);
      const motorId = payload.motorId || payload.id || motorIdFromTopic;
      const status = normalizeMotorStatus(
        payload.status ?? payload.state ?? payload.confirmation ?? payload.runStatus,
      );

      setLastMessage(`${topic} → ${JSON.stringify(payload)}`);

      setMotors(currentMotors =>
        currentMotors.map(motor => {
          const shouldUpdate =
            motor.id === motorId ||
            String(motor.id).endsWith(String(motorId || '').replace('motor-', '')) ||
            (!motorId && topic === TOPICS.legacyMotorStatus);

          if (!shouldUpdate) return motor;

          return {
            ...motor,
            status,
            lastMessage: payload.message || `MQTT confirmation: ${status}`,
            updatedAt: new Date().toISOString(),
            parameters: mergeParameters(motor.parameters, payload.parameters || payload),
          };
        }),
      );
    });

    mqttService.connect();

    return () => {
      unsubscribeStatus();
      unsubscribeMessages();
    };
  }, []);

  const selectMotor = useCallback(motor => {
    setMotors(currentMotors =>
      currentMotors.map(item =>
        item.id === motor.id
          ? {...item, status: 'PENDING', lastMessage: 'Command sent. Waiting for MQTT confirmation...'}
          : item,
      ),
    );

    const payload = buildMotorCommandPayload(motor, 'SELECT');
    mqttService.publish(TOPICS.motorCommand(motor.id), payload);
  }, []);

  const controlMotor = useCallback((motor, requestedState) => {
    const payload = {
      ...buildMotorCommandPayload(motor, 'SET_STATE'),
      requestedState,
    };

    setMotors(currentMotors =>
      currentMotors.map(item =>
        item.id === motor.id
          ? {...item, status: 'PENDING', lastMessage: `Requested ${requestedState}. Waiting for confirmation...`}
          : item,
      ),
    );

    mqttService.publish(TOPICS.motorCommand(motor.id), payload);
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
    [connectionStatus, connectionError, lastMessage, motors, selectMotor, controlMotor],
  );

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
};

export const useMqtt = () => useContext(MqttContext);
