import React, { useState } from 'react';
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
import { COLORS } from '../constants/colors';
import { MQTT_CONFIG, updateMqttConfig } from '../constants/mqttConfig';
import { useAuth } from '../context/AuthContext';
import { useMqtt } from '../context/MqttContext';
import { mqttService } from '../services/mqttService';

const MqttSettingsScreen = ({ navigation }) => {
    const { logout } = useAuth();
    const { connectionStatus } = useMqtt();

    const [brokerUrl, setBrokerUrl] = useState(MQTT_CONFIG.brokerUrl);
    const [username, setUsername] = useState(MQTT_CONFIG.username);
    const [password, setPassword] = useState(MQTT_CONFIG.password);
    const [clientIdPrefix, setClientIdPrefix] = useState(
        MQTT_CONFIG.clientIdPrefix,
    );

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
                <ScrollView contentContainerStyle={styles.content}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.navigate('Home')}>
                        <Text style={styles.backText}>← Home</Text>
                    </TouchableOpacity>

                    <View style={styles.card}>
                        <Text style={styles.title}>MQTT Configuration</Text>
                        <Text style={styles.description}>
                            Configure the MQTT WebSocket broker used by the motor control app.
                        </Text>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>MQTT Broker URL</Text>
                            <TextInput
                                value={brokerUrl}
                                onChangeText={setBrokerUrl}
                                placeholder="wss://mqtt.archidtech.in:443/mqtt"
                                placeholderTextColor={COLORS.muted}
                                autoCapitalize="none"
                                style={styles.input}
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
                            <Text style={styles.label}>Username</Text>
                            <TextInput
                                value={username}
                                onChangeText={setUsername}
                                placeholder="MQTT username"
                                placeholderTextColor={COLORS.muted}
                                autoCapitalize="none"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                placeholder="MQTT password"
                                placeholderTextColor={COLORS.muted}
                                secureTextEntry
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Client ID Prefix</Text>
                            <TextInput
                                value={clientIdPrefix}
                                onChangeText={setClientIdPrefix}
                                placeholder="archid_motor_mobile"
                                placeholderTextColor={COLORS.muted}
                                autoCapitalize="none"
                                style={styles.input}
                            />
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveText}>Save & Reconnect</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.page,
    },
    keyboard: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 30,
    },
    backButton: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.card,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 14,
    },
    backText: {
        color: COLORS.text,
        fontWeight: '800',
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.shadow,
        shadowOpacity: 0.07,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 2,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.text,
    },
    description: {
        color: COLORS.muted,
        marginTop: 6,
        marginBottom: 20,
        lineHeight: 20,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        color: COLORS.text,
        fontWeight: '900',
        marginBottom: 7,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 11,
        color: COLORS.text,
        fontSize: 14,
    },
    note: {
        color: COLORS.muted,
        fontSize: 11,
        marginTop: 6,
    },
    previewBox: {
        backgroundColor: '#eef6fb',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#d7edf9',
        marginBottom: 16,
    },
    previewLabel: {
        color: COLORS.muted,
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 4,
    },
    previewValue: {
        color: COLORS.text,
        fontWeight: '900',
        fontSize: 12,
    },
    saveButton: {
        backgroundColor: COLORS.success,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    saveText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 15,
    },
});

export default MqttSettingsScreen;