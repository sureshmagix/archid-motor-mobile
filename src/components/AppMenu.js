import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '../constants/colors';

const AppMenu = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.menuRow}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.menuCard}
                    onPress={() => navigation.navigate('Home')}>
                    <Text style={styles.menuIcon}>🏠</Text>
                    <Text style={styles.menuTitle}>Home</Text>
                    <Text style={styles.menuSubtitle}>Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.menuCard}
                    onPress={() => navigation.navigate('MqttSettings')}>
                    <Text style={styles.menuIcon}>⚙️</Text>
                    <Text style={styles.menuTitle}>MQTT</Text>
                    <Text style={styles.menuSubtitle}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.menuCard}
                    onPress={() => navigation.navigate('WifiProvisioning')}>
                    <Text style={styles.menuIcon}>📶</Text>
                    <Text style={styles.menuTitle}>WiFi</Text>
                    <Text style={styles.menuSubtitle}>Provision</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 12,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.shadow,
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },

    menuRow: {
        flexDirection: 'row',
        gap: 10,
    },

    menuCard: {
        flex: 1,
        minHeight: 86,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },

    menuIcon: {
        fontSize: 22,
        marginBottom: 6,
    },

    menuTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: COLORS.text,
    },

    menuSubtitle: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.muted,
        marginTop: 2,
    },
});

export default AppMenu;