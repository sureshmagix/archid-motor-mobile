import { TOPICS } from '../constants/topics';
import { mqttService } from './mqttService';

const cleanScreenName = screenName => {
    return String(screenName || 'unknown')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '');
};

export const screenActivityService = {
    publish(screenName, event) {
        const cleanName = cleanScreenName(screenName);

        const payload = {
            screen: cleanName,
            event,
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
};

export default screenActivityService;