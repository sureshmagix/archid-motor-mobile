import { useCallback, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { screenActivityService } from '../services/screenActivityService';
import { useAuth } from '../context/AuthContext';

const useScreenMqttActivity = screenName => {
    const { user } = useAuth();
    const isFocusedRef = useRef(false);

    useFocusEffect(
        useCallback(() => {
            if (!isFocusedRef.current) {
                isFocusedRef.current = true;
                screenActivityService.enter(screenName, user?.username);
            }

            return () => {
                if (isFocusedRef.current) {
                    isFocusedRef.current = false;
                    screenActivityService.leave(screenName, user?.username);
                }
            };
        }, [screenName, user?.username]),
    );

    const publishRefresh = useCallback(
        (extraPayload = {}) => {
            return screenActivityService.refresh(screenName, user?.username, {
                reason: 'pull_down_refresh',
                ...extraPayload,
            });
        },
        [screenName, user?.username],
    );

    return useMemo(
        () => ({
            publishRefresh,
        }),
        [publishRefresh],
    );
};

export default useScreenMqttActivity;