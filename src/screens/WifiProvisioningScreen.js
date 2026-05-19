import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    PermissionsAndroid,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import WifiManager from 'react-native-wifi-reborn';

import HeaderBar from '../components/HeaderBar';
import FloatingHomeButton from '../components/FloatingHomeButton';

import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useMqtt } from '../context/MqttContext';

const DEFAULT_SERVER_URL = 'http://192.168.4.1/wifi';

const WifiProvisioningScreen = ({ navigation }) => {
    const auth = useAuth();
    const { logout } = auth;

    const { connectionStatus } = useMqtt();

    const loggedInUsername =
        auth?.user?.username ||
        auth?.currentUser?.username ||
        auth?.authUser?.username ||
        auth?.username ||
        'unknown';

    const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);

    const [networks, setNetworks] = useState([]);
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [ssid, setSsid] = useState('');
    const [password, setPassword] = useState('');

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [message, setMessage] = useState('');

    const canSubmit = useMemo(() => {
        return (
            serverUrl.trim().length > 0 &&
            ssid.trim().length > 0 &&
            password.length > 0 &&
            !isSubmitting
        );
    }, [serverUrl, ssid, password, isSubmitting]);

    const requestAndroidWifiPermissions = async () => {
        if (Platform.OS !== 'android') {
            return false;
        }

        const permissions = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

        if (
            Number(Platform.Version) >= 33 &&
            PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES
        ) {
            permissions.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
        }

        const results = await PermissionsAndroid.requestMultiple(permissions);

        return permissions.every(
            permission => results[permission] === PermissionsAndroid.RESULTS.GRANTED,
        );
    };

    const normalizeWifiList = list => {
        let parsedList = list;

        try {
            if (typeof list === 'string') {
                parsedList = JSON.parse(list);
            }
        } catch (error) {
            console.log('WiFi list parse error:', error?.message || error);
            return [];
        }

        if (!Array.isArray(parsedList)) {
            return [];
        }

        const uniqueNetworks = new Map();

        parsedList.forEach(item => {
            const networkName = item?.SSID || item?.ssid || item?.name;

            if (!networkName) {
                return;
            }

            const signalLevel = Number(
                item?.level ?? item?.signalLevel ?? item?.rssi ?? -999,
            );

            const existingNetwork = uniqueNetworks.get(networkName);

            if (!existingNetwork || signalLevel > existingNetwork.level) {
                uniqueNetworks.set(networkName, {
                    ...item,
                    SSID: networkName,
                    level: signalLevel,
                });
            }
        });

        return Array.from(uniqueNetworks.values()).sort(
            (a, b) => Number(b.level ?? -999) - Number(a.level ?? -999),
        );
    };

    const getSignalText = level => {
        const signal = Number(level ?? -999);

        if (signal >= -50) {
            return 'Excellent';
        }

        if (signal >= -60) {
            return 'Good';
        }

        if (signal >= -70) {
            return 'Fair';
        }

        return 'Weak';
    };

    const scanWifiNetworks = async () => {
        if (Platform.OS !== 'android') {
            Alert.alert(
                'Manual Entry Required',
                'This phone does not allow normal apps to scan nearby WiFi networks. Please enter the WiFi name manually.',
            );
            return;
        }

        try {
            setIsScanning(true);
            setMessage('');
            setIsDropdownOpen(false);

            const hasPermission = await requestAndroidWifiPermissions();

            if (!hasPermission) {
                Alert.alert(
                    'Permission Required',
                    'Please allow WiFi and location permission to scan nearby networks.',
                );
                return;
            }

            const isWifiEnabled = await WifiManager.isEnabled();

            if (!isWifiEnabled) {
                Alert.alert(
                    'WiFi Disabled',
                    'Please turn on WiFi on this phone and try again.',
                );
                return;
            }

            const wifiList = await WifiManager.loadWifiList();
            const cleanList = normalizeWifiList(wifiList);

            setNetworks(cleanList);

            if (cleanList.length === 0) {
                setMessage('No WiFi networks found. You can enter the SSID manually.');
                return;
            }

            setMessage(`${cleanList.length} WiFi network(s) found.`);
            setIsDropdownOpen(true);
        } catch (error) {
            console.log('WiFi scan failed:', error);

            Alert.alert(
                'Scan Failed',
                'Unable to scan WiFi networks. Make sure WiFi and location services are ON, then try again.',
            );
        } finally {
            setIsScanning(false);
        }
    };

    const selectNetwork = network => {
        setSelectedNetwork(network);
        setSsid(network.SSID);
        setIsDropdownOpen(false);
        setMessage(`Selected ${network.SSID}`);
    };

    const validateForm = () => {
        const cleanUrl = serverUrl.trim();
        const cleanSsid = ssid.trim();

        if (!cleanUrl) {
            Alert.alert('Missing Server URL', 'Please enter the server URL.');
            return false;
        }

        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            Alert.alert(
                'Invalid Server URL',
                'Please enter a full URL starting with http:// or https://',
            );
            return false;
        }

        if (!cleanSsid) {
            Alert.alert('Missing WiFi Name', 'Please select or type the WiFi name.');
            return false;
        }

        if (!password) {
            Alert.alert('Missing Password', 'Please enter the WiFi password.');
            return false;
        }

        return true;
    };

    const connectMotorToWifi = async () => {
        if (!validateForm()) {
            return;
        }

        const cleanUrl = serverUrl.trim();
        const cleanSsid = ssid.trim();

        const payload = {
            ssid: cleanSsid,
            wifiName: cleanSsid,
            password,
            loginUsername: loggedInUsername,
        };

        try {
            setIsSubmitting(true);
            setMessage('Sending WiFi details...');

            console.log('WiFi provisioning payload:', payload);

            const response = await fetch(cleanUrl, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const responseText = await response.text();

            let responseJson = null;

            try {
                responseJson = responseText ? JSON.parse(responseText) : null;
            } catch {
                responseJson = null;
            }

            if (!response.ok) {
                throw new Error(
                    responseJson?.message ||
                    responseText ||
                    `Connection failed. HTTP ${response.status}`,
                );
            }

            setMessage('WiFi details sent successfully.');

            Alert.alert(
                'Success',
                responseJson?.message || 'Motor WiFi connection request sent.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Home'),
                    },
                ],
            );
        } catch (error) {
            console.log('WiFi provision failed:', error);

            const errorMessage =
                error?.message || 'Unable to send WiFi details. Please try again.';

            setMessage(errorMessage);
            Alert.alert('Connection Failed', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
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
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <Text style={styles.title}>Motor WiFi Setup</Text>
                        <Text style={styles.subtitle}>
                            Select a WiFi network, enter password, and connect the motor to
                            WiFi.
                        </Text>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Server URL</Text>
                            <TextInput
                                value={serverUrl}
                                onChangeText={setServerUrl}
                                placeholder="http://192.168.4.1/wifi"
                                placeholderTextColor={COLORS.muted}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>WiFi Network</Text>

                            <View style={styles.searchInputWrap}>
                                <TextInput
                                    value={ssid}
                                    onChangeText={value => {
                                        setSsid(value);
                                        setSelectedNetwork(null);
                                    }}
                                    placeholder="Select or type WiFi name"
                                    placeholderTextColor={COLORS.muted}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={styles.searchInput}
                                />

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={styles.searchButton}
                                    onPress={scanWifiNetworks}
                                    disabled={isScanning}>
                                    {isScanning ? (
                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                    ) : (
                                        <Text style={styles.searchIcon}>⌕</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {isDropdownOpen && (
                                <View style={styles.dropdownList}>
                                    {networks.length === 0 ? (
                                        <Text style={styles.emptyText}>
                                            No networks found. Enter WiFi name manually.
                                        </Text>
                                    ) : (
                                        <ScrollView
                                            nestedScrollEnabled
                                            showsVerticalScrollIndicator
                                            style={styles.networkScroll}
                                            contentContainerStyle={styles.networkScrollContent}>
                                            {networks.map((network, index) => {
                                                const isSelected =
                                                    selectedNetwork?.SSID === network.SSID ||
                                                    ssid === network.SSID;

                                                return (
                                                    <TouchableOpacity
                                                        key={`${network.SSID}-${index}`}
                                                        activeOpacity={0.82}
                                                        style={[
                                                            styles.networkItem,
                                                            isSelected && styles.networkItemSelected,
                                                        ]}
                                                        onPress={() => selectNetwork(network)}>
                                                        <View style={styles.networkInfo}>
                                                            <Text style={styles.networkName} numberOfLines={1}>
                                                                {network.SSID}
                                                            </Text>
                                                            <Text style={styles.networkMeta}>
                                                                Signal: {getSignalText(network.level)}
                                                            </Text>
                                                        </View>

                                                        {isSelected && <Text style={styles.selectedTick}>✓</Text>}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    )}
                                </View>
                            )}
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
                            activeOpacity={0.9}
                            style={[
                                styles.connectButton,
                                !canSubmit && styles.disabledButton,
                            ]}
                            disabled={!canSubmit}
                            onPress={connectMotorToWifi}>
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <Text style={styles.connectIcon}>↗</Text>
                                    <Text style={styles.connectButtonText}>
                                        Connect Motor to Wifi
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {message ? (
                        <View style={styles.messageBox}>
                            <Text style={styles.messageText}>{message}</Text>
                        </View>
                    ) : null}
                </ScrollView>
            </KeyboardAvoidingView>

            <FloatingHomeButton navigation={navigation} />
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
        paddingBottom: 100,
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
        color: COLORS.text,
        fontSize: 20,
        fontWeight: '900',
    },

    subtitle: {
        color: COLORS.muted,
        marginTop: 6,
        marginBottom: 18,
        fontSize: 13,
        lineHeight: 20,
    },

    formGroup: {
        marginBottom: 16,
    },

    label: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '900',
        marginBottom: 7,
    },

    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        paddingVertical: 11,
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
    },

    searchInputWrap: {
        minHeight: 46,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },

    searchInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 11,
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
    },

    searchButton: {
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftWidth: 1,
        borderLeftColor: COLORS.border,
        backgroundColor: '#ffffff',
    },

    searchIcon: {
        color: COLORS.primary,
        fontSize: 25,
        fontWeight: '900',
        lineHeight: 28,
    },

    dropdownList: {
        marginTop: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        maxHeight: 240,
    },

    networkScroll: {
        maxHeight: 240,
    },

    networkScrollContent: {
        paddingBottom: 4,
    },

    networkItem: {
        minHeight: 46,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    networkItemSelected: {
        backgroundColor: '#eef6fb',
    },

    networkInfo: {
        flex: 1,
        paddingRight: 10,
    },

    networkName: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '900',
    },

    networkMeta: {
        color: COLORS.muted,
        fontSize: 11,
        marginTop: 2,
    },

    selectedTick: {
        color: COLORS.success,
        fontSize: 17,
        fontWeight: '900',
    },

    emptyText: {
        color: COLORS.muted,
        padding: 12,
        textAlign: 'center',
        fontSize: 12,
    },

    connectButton: {
        minHeight: 48,
        borderRadius: 14,
        backgroundColor: COLORS.success,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },

    connectIcon: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '900',
        marginRight: 8,
    },

    connectButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '900',
    },

    disabledButton: {
        opacity: 0.6,
    },

    messageBox: {
        backgroundColor: '#e8f8f1',
        borderRadius: 14,
        padding: 14,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#cdeede',
    },

    messageText: {
        color: COLORS.success,
        fontWeight: '800',
        lineHeight: 20,
    },
});

export default WifiProvisioningScreen;