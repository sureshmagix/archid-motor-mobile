import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '../constants/colors';

const AppMenu = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.menuItem}
                onPress={() => navigation.navigate('MqttSettings')}>
                <Text style={styles.menuIcon}>⚙️</Text>
                <Text style={styles.menuText}>MQTT</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.menuItem}
                onPress={() => navigation.navigate('WifiProvisioning')}>
                <Text style={styles.menuIcon}>📶</Text>
                <Text style={styles.menuText}>WiFi</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 4,
        backgroundColor: COLORS.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 8,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.shadow,
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },

    menuItem: {
        flex: 1,
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },

    menuIcon: {
        fontSize: 18,
    },

    menuText: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '900',
    },

    divider: {
        width: 1,
        height: 24,
        backgroundColor: COLORS.border,
    },
});

export default AppMenu;