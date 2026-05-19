import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { screenActivityService } from '../services/screenActivityService';

const useScreenMqttActivity = screenName => {
    const isFocusedRef = useRef(false);

    useFocusEffect(
        useCallback(() => {
            if (!isFocusedRef.current) {
                isFocusedRef.current = true;
                screenActivityService.enter(screenName);
            }

            return () => {
                if (isFocusedRef.current) {
                    isFocusedRef.current = false;
                    screenActivityService.leave(screenName);
                }
            };
        }, [screenName]),
    );
};

export default useScreenMqttActivity;