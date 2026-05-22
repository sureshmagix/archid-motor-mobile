import React, { useState, useMemo } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import HeaderBar from '../components/HeaderBar';
import { useTheme } from '../context/ThemeContext';
import { MQTT_CONFIG, updateMqttConfig } from '../constants/mqttConfig';
import { useAuth } from '../context/AuthContext';
import { useMqtt } from '../context/MqttContext';
import { mqttService } from '../services/mqttService';
import FloatingHomeButton from '../components/FloatingHomeButton';

const MqttSettingsScreen = ({ navigation }) => {
    const { logout } = useAuth();
    const { connectionStatus } = useMqtt();
    const { theme, setThemeMode, colors } = useTheme();
    const styles = useMemo(() => getStyles(colors), [colors]);

    const [brokerUrl, setBrokerUrl] = useState(MQTT_CONFIG.brokerUrl);
    const [username, setUsername] = useState(MQTT_CONFIG.username);
    const [password, setPassword] = useState(MQTT_CONFIG.password);
    const [clientIdPrefix, setClientIdPrefix] = useState(
        MQTT_CONFIG.clientIdPrefix,
    );

    const [isUrlFocused, setIsUrlFocused] = useState(false);
    const [isUserFocused, setIsUserFocused] = useState(false);
    const [isPassFocused, setIsPassFocused] = useState(false);
    const [isClientFocused, setIsClientFocused] = useState(false);

    const finalUrl = brokerUrl.trim();

    const handleSave = () => {
        if (!brokerUrl.trim()) {
            Alert.alert('Validation', 'Please enter MQTT broker URL.');
            return;
        }

        if (
            !brokerUrl.trim().startsWith('wss://') &&
            !brokerUrl.trim().startsWith('ws://')
        ) {
            Alert.alert('Validation', 'Broker URL must start with ws:// or wss://');
            return;
        }

        updateMqttConfig({
            brokerUrl: brokerUrl.trim(),
            username: username.trim(),
            password,
            clientIdPrefix: clientIdPrefix.trim() || 'archid_motor_mobile',
        });

        mqttService.reconnectWithLatestConfig();

        Alert.alert(
            'MQTT Updated',
            'MQTT settings saved. The app is reconnecting with the new broker settings.',
        );
    };

    return (
        <View style={styles.root}>
            <HeaderBar
                title="ARCHIDTECH | Flow"
                subtitle="MQTT Settings"
                mqttStatus={connectionStatus}
                onLogout={logout}
            />

            <KeyboardAvoidingView
                style={styles.keyboard}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.navigate('Home')}>
                        <Text style={styles.backText}>← Back to Home</Text>
                    </TouchableOpacity>

                    {/* MQTT Configuration Card */}
                    <View style={styles.card}>
                        <Text style={styles.title}>MQTT Configuration</Text>
                        <Text style={styles.description}>
                            Configure the MQTT WebSocket broker used by the motor control app.
                        </Text>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, isUrlFocused && styles.labelFocused]}>MQTT Broker URL</Text>
                            <TextInput
                                value={brokerUrl}
                                onChangeText={setBrokerUrl}
                                placeholder="wss://mqtt.archidtech.in:443/mqtt"
                                placeholderTextColor={colors.muted}
                                autoCapitalize="none"
                                style={[styles.input, isUrlFocused && styles.inputFocused]}
                                onFocus={() => setIsUrlFocused(true)}
                                onBlur={() => setIsUrlFocused(false)}
                            />
                            <Text style={styles.note}>
                                Example: wss://mqtt.archidtech.in:443/mqtt
                            </Text>
                        </View>

                        <View style={styles.previewBox}>
                            <Text style={styles.previewLabel}>Final MQTT URL</Text>
                            <Text style={styles.previewValue}>{finalUrl}</Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, isUserFocused && styles.labelFocused]}>Username</Text>
                            <TextInput
                                value={username}
                                onChangeText={setUsername}
                                placeholder="MQTT username"
                                placeholderTextColor={colors.muted}
                                autoCapitalize="none"
                                style={[styles.input, isUserFocused && styles.inputFocused]}
                                onFocus={() => setIsUserFocused(true)}
                                onBlur={() => setIsUserFocused(false)}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, isPassFocused && styles.labelFocused]}>Password</Text>
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                placeholder="MQTT password"
                                placeholderTextColor={colors.muted}
                                secureTextEntry
                                style={[styles.input, isPassFocused && styles.inputFocused]}
                                onFocus={() => setIsPassFocused(true)}
                                onBlur={() => setIsPassFocused(false)}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, isClientFocused && styles.labelFocused]}>Client ID Prefix</Text>
                            <TextInput
                                value={clientIdPrefix}
                                onChangeText={setClientIdPrefix}
                                placeholder="archid_motor_mobile"
                                placeholderTextColor={colors.muted}
                                autoCapitalize="none"
                                style={[styles.input, isClientFocused && styles.inputFocused]}
                                onFocus={() => setIsClientFocused(true)}
                                onBlur={() => setIsClientFocused(false)}
                            />
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
                            <Text style={styles.saveText}>Save & Reconnect</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Theme Preference Settings Card */}
                    <View style={[styles.card, styles.themeCard]}>
                        <Text style={styles.title}>Theme Preference</Text>
                        <Text style={styles.description}>
                            Choose how Archid Motor Mobile looks on your device.
                        </Text>

                        <View style={styles.themeOptionsRow}>
                            {[
                                { mode: 'light', label: 'Light', icon: '☀️' },
                                { mode: 'dark', label: 'Dark', icon: '🌙' },
                                { mode: 'system', label: 'System', icon: '⚙️' },
                            ].map((option) => {
                                const isSelected = theme === option.mode;
                                return (
                                    <TouchableOpacity
                                        key={option.mode}
                                        style={[
                                            styles.themeOption,
                                            isSelected && styles.themeOptionActive,
                                        ]}
                                        onPress={() => setThemeMode(option.mode)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.themeOptionIcon, isSelected && styles.themeOptionIconActive]}>
                                            {option.icon}
                                        </Text>
                                        <Text style={[
                                            styles.themeOptionLabel,
                                            isSelected && styles.themeOptionLabelActive,
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <FloatingHomeButton navigation={navigation} />

        </View>
    );
};

const getStyles = (colors) => StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.page,
    },
    keyboard: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 96,
    },
    backButton: {
        marginBottom: 14,
    },
    backText: {
        color: colors.accent,
        fontWeight: '900',
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadow,
        shadowOpacity: 0.05,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
    },
    themeCard: {
        marginTop: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.text,
        letterSpacing: 0.3,
    },
    description: {
        color: colors.muted,
        marginTop: 6,
        marginBottom: 24,
        lineHeight: 20,
        fontSize: 13,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        color: colors.text,
        fontWeight: '900',
        marginBottom: 8,
        fontSize: 13,
        letterSpacing: 0.2,
    },
    labelFocused: {
        color: colors.accent,
    },
    input: {
        backgroundColor: colors.borderLight,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 13,
        color: colors.text,
        fontSize: 15,
        fontWeight: '700',
    },
    inputFocused: {
        borderColor: colors.accent,
        backgroundColor: colors.card,
    },
    note: {
        color: colors.muted,
        fontSize: 11,
        marginTop: 6,
        fontWeight: '700',
    },
    previewBox: {
        backgroundColor: colors.accentLight,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.isDark ? '#312e81' : '#c7d2fe', // Indigo-950 (Indigo-900 border) or Indigo-200
        marginBottom: 20,
    },
    previewLabel: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    previewValue: {
        color: colors.text,
        fontWeight: '900',
        fontSize: 13,
    },
    saveButton: {
        backgroundColor: colors.accent,
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 3,
        borderBottomWidth: 3,
        borderBottomColor: colors.isDark ? '#4338ca' : '#4f46e5', // Darker Indigo
        borderColor: colors.isDark ? '#6366f1' : '#818cf8',      // Lighter Indigo
        borderWidth: 1,
    },
    saveText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    themeOptionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    themeOption: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: colors.borderLight,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    themeOptionActive: {
        borderColor: colors.accent,
        backgroundColor: colors.isDark ? `${colors.accent}15` : `${colors.accent}08`,
    },
    themeOptionIcon: {
        fontSize: 20,
        marginBottom: 6,
    },
    themeOptionIconActive: {
        // We let the emoji icon itself speak, or add visual distinction
    },
    themeOptionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.muted,
    },
    themeOptionLabelActive: {
        color: colors.accent,
        fontWeight: '900',
    },
});

export default MqttSettingsScreen;