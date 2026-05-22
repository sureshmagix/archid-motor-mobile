import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '../constants/colors';

const AppMenu = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.75}
                style={styles.menuItem}
                onPress={() => navigation.navigate('MqttSettings')}>
                <Text style={styles.menuIcon}>⚙️</Text>
                <Text style={styles.menuText}>MQTT Broker</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
                activeOpacity={0.75}
                style={styles.menuItem}
                onPress={() => navigation.navigate('WifiProvisioning')}>
                <Text style={styles.menuIcon}>📶</Text>
                <Text style={styles.menuText}>WiFi Provision</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        backgroundColor: COLORS.card,
        borderRadius: 99,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.shadow,
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },

    menuItem: {
        flex: 1,
        height: 38,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    menuIcon: {
        fontSize: 16,
    },

    menuText: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.2,
    },

    divider: {
        width: 1,
        height: 20,
        backgroundColor: COLORS.border,
    },
});

export default AppMenu;