// src/services/screenActivityService.js

import { TOPICS, getTopicPrefix } from '../constants/topics';
import { mqttService } from './mqttService';

const activeScreens = new Set();

const SCREEN_MQTT_DEBUG = true;

const debugLog = (...args) => {
    if (SCREEN_MQTT_DEBUG) {
        console.log(...args);
    }
};

const cleanScreenName = screenName => {
    return String(screenName || 'unknown')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '');
};

/**
 * This service now publishes screen activity using login username as topic prefix.
 *
 * Example:
 * username: admin
 * screenName: Home
 *
 * Topic:
 * admin/mobile/screen/Home/activity
 */
export const screenActivityService = {
    publish(screenName, event, username, extraPayload = {}) {
        const cleanName = cleanScreenName(screenName);
        const cleanEvent = String(event || '').toUpperCase();
        const topicPrefix = getTopicPrefix(username);

        /**
         * Important:
         * screenKey includes topicPrefix also.
         * This prevents duplicate ENTER / LEAVE issue when user changes.
         */
        const screenKey = `${topicPrefix}:${cleanName}`;

        if (cleanEvent === 'ENTER') {
            if (activeScreens.has(screenKey)) {
                debugLog('[SCREEN MQTT DEBUG] Duplicate ENTER skipped:', {
                    username,
                    topicPrefix,
                    screen: cleanName,
                });
                return false;
            }

            activeScreens.add(screenKey);
        }

        if (cleanEvent === 'LEAVE') {
            if (!activeScreens.has(screenKey)) {
                debugLog('[SCREEN MQTT DEBUG] Duplicate LEAVE skipped:', {
                    username,
                    topicPrefix,
                    screen: cleanName,
                });
                return false;
            }

            activeScreens.delete(screenKey);
        }

        const topic = TOPICS.screenActivity(topicPrefix, cleanName);

        const payload = {
            username: topicPrefix,
            screen: cleanName,
            event: cleanEvent,
            timestamp: new Date().toISOString(),
            ...extraPayload,
        };

        debugLog('================ SCREEN MQTT DEBUG ================');
        debugLog('[SCREEN MQTT DEBUG] Logged-in username:', username);
        debugLog('[SCREEN MQTT DEBUG] Final topic prefix:', topicPrefix);
        debugLog('[SCREEN MQTT DEBUG] Screen name:', cleanName);
        debugLog('[SCREEN MQTT DEBUG] Event:', cleanEvent);
        debugLog('[SCREEN MQTT DEBUG] Publish topic:', topic);
        debugLog('[SCREEN MQTT DEBUG] Payload:', payload);
        debugLog('[SCREEN MQTT DEBUG] MQTT connected:', mqttService.isConnected());

        const published = mqttService.publish(topic, payload, {
            qos: 1,
            retain: false,
        });

        debugLog('[SCREEN MQTT DEBUG] Publish result:', published);
        debugLog('===================================================');

        return published;
    },

    enter(screenName, username, extraPayload = {}) {
        return this.publish(screenName, 'ENTER', username, extraPayload);
    },

    leave(screenName, username, extraPayload = {}) {
        return this.publish(screenName, 'LEAVE', username, extraPayload);
    },

    refresh(screenName, username, extraPayload = {}) {
        return this.publish(screenName, 'REFRESH', username, extraPayload);
    },

    reset() {
        activeScreens.clear();
    },
};

export default screenActivityService;