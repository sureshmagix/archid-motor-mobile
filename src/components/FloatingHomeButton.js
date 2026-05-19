import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { COLORS } from '../constants/colors';

const FloatingHomeButton = ({ navigation }) => {
    const goHome = () => {
        navigation.navigate('Home');
    };

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            style={styles.button}
            onPress={goHome}>
            <Text style={styles.icon}>⌂</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        position: 'absolute',
        right: 18,
        bottom: 22,
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: COLORS.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.shadow,
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },

    icon: {
        color: COLORS.primary,
        fontSize: 25,
        fontWeight: '700',
        lineHeight: 28,
    },
});

export default FloatingHomeButton;