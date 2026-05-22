import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const FloatingHomeButton = ({ navigation }) => {
    const { colors } = useTheme();
    const styles = useMemo(() => getStyles(colors), [colors]);

    const goHome = () => {
        navigation.navigate('Home');
    };

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            style={styles.button}
            onPress={goHome}>
            <Svg
                width={22}
                height={22}
                viewBox="0 0 24 24"
                fill="none"
                stroke={colors.accent}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <Path d="M9 22V12h6v10" />
            </Svg>
        </TouchableOpacity>
    );
};

const getStyles = (colors) => StyleSheet.create({
    button: {
        position: 'absolute',
        right: 18,
        bottom: 22,
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadow,
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
});

export default FloatingHomeButton;