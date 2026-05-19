import { useCallback, useMemo, useRef } from 'react';
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

    const publishRefresh = useCallback(
        (extraPayload = {}) => {
            return screenActivityService.refresh(screenName, {
                reason: 'pull_down_refresh',
                ...extraPayload,
            });
        },
        [screenName],
    );

    return useMemo(
        () => ({
            publishRefresh,
        }),
        [publishRefresh],
    );
};

export default useScreenMqttActivity;