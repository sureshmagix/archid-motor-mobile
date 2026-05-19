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
import { TOPICS } from '../constants/topics';
import { useAuth } from '../context/AuthContext';
import { useMqtt } from '../context/MqttContext';
import { mqttService } from '../services/mqttService';

const WifiProvisioningScreen = ({ navigation }) => {
    const { logout } = useAuth();
    const { connectionStatus } = useMqtt();

    const [deviceId, setDeviceId] = useState('motor-1');
    const [ssid, setSsid] = useState('');
    const [password, setPassword] = useState('');

    const handleProvision = () => {
        if (!deviceId.trim()) {
            Alert.alert('Validation', 'Please enter device ID.');
            return;
        }

        if (!ssid.trim()) {
            Alert.alert('Validation', 'Please enter WiFi SSID.');
            return;
        }

        const payload = {
            deviceId: deviceId.trim(),
            ssid: ssid.trim(),
            password,
            source: 'archid-motor-mobile',
            timestamp: new Date().toISOString(),
        };

        const published = mqttService.publish(
            TOPICS.wifiProvisioning(deviceId.trim()),
            payload,
            { qos: 1, retain: false },
        );

        if (!published) {
            Alert.alert(
                'MQTT Not Connected',
                'WiFi provisioning command was not sent because MQTT is not connected.',
            );
            return;
        }

        Alert.alert(
            'Provisioning Sent',
            `WiFi credentials sent to ${deviceId.trim()}.`,
        );
    };

    return (
        <View style={styles.root}>
            <HeaderBar
                title="ARCHIDTECH | Flow"
                subtitle="WiFi Provisioning"
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
                        <Text style={styles.title}>WiFi Provisioning</Text>
                        <Text style={styles.description}>
                            Send WiFi credentials to the selected device through MQTT. Your
                            ESP32 firmware should subscribe to the provisioning topic.
                        </Text>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Device ID</Text>
                            <TextInput
                                value={deviceId}
                                onChangeText={setDeviceId}
                                placeholder="motor-1"
                                placeholderTextColor={COLORS.muted}
                                autoCapitalize="none"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.topicBox}>
                            <Text style={styles.topicLabel}>Provisioning Topic</Text>
                            <Text style={styles.topicValue}>
                                {TOPICS.wifiProvisioning(deviceId.trim() || 'device-id')}
                            </Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>WiFi SSID</Text>
                            <TextInput
                                value={ssid}
                                onChangeText={setSsid}
                                placeholder="Enter WiFi name"
                                placeholderTextColor={COLORS.muted}
                                autoCapitalize="none"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>WiFi Password</Text>
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter WiFi password"
                                placeholderTextColor={COLORS.muted}
                                secureTextEntry
                                style={styles.input}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.provisionButton}
                            onPress={handleProvision}>
                            <Text style={styles.provisionText}>Send WiFi Config</Text>
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
    topicBox: {
        backgroundColor: '#eef6fb',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#d7edf9',
        marginBottom: 16,
    },
    topicLabel: {
        color: COLORS.muted,
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 4,
    },
    topicValue: {
        color: COLORS.text,
        fontWeight: '900',
        fontSize: 12,
    },
    provisionButton: {
        backgroundColor: COLORS.accent,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    provisionText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 15,
    },
});

export default WifiProvisioningScreen;