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
    publish(screenName, event) {
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
        };

        return mqttService.publish(TOPICS.screenActivity(cleanName), payload, {
            qos: 1,
            retain: false,
        });
    },

    enter(screenName) {
        return this.publish(screenName, 'ENTER');
    },

    leave(screenName) {
        return this.publish(screenName, 'LEAVE');
    },

    reset() {
        activeScreens.clear();
    },
};

export default screenActivityService;