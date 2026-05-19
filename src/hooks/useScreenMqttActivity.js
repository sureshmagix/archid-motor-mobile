import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { screenActivityService } from '../services/screenActivityService';

export const useScreenMqttActivity = screenName => {
    useFocusEffect(
        useCallback(() => {
            screenActivityService.enter(screenName);

            return () => {
                screenActivityService.leave(screenName);
            };
        }, [screenName]),
    );
};

export default useScreenMqttActivity;