import { TOPICS } from '../constants/topics';
import { mqttService } from './mqttService';

const activeScreens = new Set();

const cleanScreenName = screenName => {
    return String(screenName || 'unknown')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '');
};

export const screenActivityService = {
    publish(screenName, event, extraPayload = {}) {
        const cleanName = cleanScreenName(screenName);
        const cleanEvent = String(event || '').toUpperCase();

        const screenKey = cleanName;

        if (cleanEvent === 'ENTER') {
            if (activeScreens.has(screenKey)) {
                console.log('Duplicate ENTER skipped:', cleanName);
                return false;
            }

            activeScreens.add(screenKey);
        }

        if (cleanEvent === 'LEAVE') {
            if (!activeScreens.has(screenKey)) {
                console.log('Duplicate LEAVE skipped:', cleanName);
                return false;
            }

            activeScreens.delete(screenKey);
        }

        const payload = {
            screen: cleanName,
            event: cleanEvent,
            timestamp: new Date().toISOString(),
            ...extraPayload,
        };

        return mqttService.publish(TOPICS.screenActivity(cleanName), payload, {
            qos: 1,
            retain: false,
        });
    },

    enter(screenName, extraPayload = {}) {
        return this.publish(screenName, 'ENTER', extraPayload);
    },

    leave(screenName, extraPayload = {}) {
        return this.publish(screenName, 'LEAVE', extraPayload);
    },

    refresh(screenName, extraPayload = {}) {
        return this.publish(screenName, 'REFRESH', extraPayload);
    },

    reset() {
        activeScreens.clear();
    },
};

export default screenActivityService;