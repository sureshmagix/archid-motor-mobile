import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
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
import { useTheme } from '../context/ThemeContext';

const DEFAULT_SERVER_URL = 'http://192.168.4.1/wifi';

const WifiSignalIndicator = ({ level, colors = COLORS, styles = {} }) => {
    const signal = Number(level ?? -999);
    let activeBars = 1;
    let color = colors.danger;

    if (signal >= -60) {
        activeBars = 3;
        color = colors.success;
    } else if (signal >= -70) {
        activeBars = 2;
        color = colors.warning;
    }

    const inactiveBarColor = colors.isDark ? '#475569' : '#cbd5e1';

    return (
        <View style={styles.wifiSignalContainer}>
            <View style={[styles.wifiBar, { height: 6, backgroundColor: activeBars >= 1 ? color : inactiveBarColor }]} />
            <View style={[styles.wifiBar, { height: 11, backgroundColor: activeBars >= 2 ? color : inactiveBarColor }]} />
            <View style={[styles.wifiBar, { height: 16, backgroundColor: activeBars >= 3 ? color : inactiveBarColor }]} />
        </View>
    );
};

const ScanningPulse = ({ colors = COLORS, styles = {} }) => {
    const pulseAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.4,
                    duration: 1000,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();

        return () => animation.stop();
    }, [pulseAnim]);

    return (
        <View style={styles.pulseContainer}>
            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }], opacity: Animated.subtract(1, pulseAnim) }]} />
            <View style={styles.pulseDot} />
            <Text style={styles.pulseText}>Scanning nearby networks...</Text>
        </View>
    );
};

const WifiProvisioningScreen = ({ navigation }) => {
    const auth = useAuth();
    const { logout } = auth;
    const { colors, isDark } = useTheme();
    const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

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

    const [isUrlFocused, setIsUrlFocused] = useState(false);
    const [isSsidFocused, setIsSsidFocused] = useState(false);
    const [isPassFocused, setIsPassFocused] = useState(false);

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

        const permissions = [
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        if (Number(Platform.Version) >= 33) {
            permissions.push(
                PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES ||
                'android.permission.NEARBY_WIFI_DEVICES',
            );
        }

        const results = await PermissionsAndroid.requestMultiple(permissions);

        console.log('WiFi permission results:', results);

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

    const isErrorMessage = message.toLowerCase().includes('fail') ||
                           message.toLowerCase().includes('error') ||
                           message.toLowerCase().includes('unable') ||
                           message.toLowerCase().includes('invalid');

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
                    
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.navigate('Home')}>
                        <Text style={styles.backText}>← Back to Home</Text>
                    </TouchableOpacity>

                    <View style={styles.card}>
                        <Text style={styles.title}>Motor WiFi Setup</Text>
                        <Text style={styles.subtitle}>
                            Select a WiFi network, enter password, and connect the motor to WiFi.
                        </Text>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, isUrlFocused && styles.labelFocused]}>Server URL</Text>
                            <TextInput
                                value={serverUrl}
                                onChangeText={setServerUrl}
                                placeholder="http://192.168.4.1/wifi"
                                placeholderTextColor={colors.muted}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                                style={[styles.input, isUrlFocused && styles.inputFocused]}
                                onFocus={() => setIsUrlFocused(true)}
                                onBlur={() => setIsUrlFocused(false)}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, isSsidFocused && styles.labelFocused]}>WiFi Network</Text>

                            <View style={[styles.searchInputWrap, isSsidFocused && styles.searchInputWrapFocused]}>
                                <TextInput
                                    value={ssid}
                                    onChangeText={value => {
                                        setSsid(value);
                                        setSelectedNetwork(null);
                                    }}
                                    placeholder="Select or type WiFi name"
                                    placeholderTextColor={colors.muted}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={styles.searchInput}
                                    onFocus={() => setIsSsidFocused(true)}
                                    onBlur={() => setIsSsidFocused(false)}
                                />

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={styles.searchButton}
                                    onPress={scanWifiNetworks}
                                    disabled={isScanning}>
                                    {isScanning ? (
                                        <ActivityIndicator size="small" color={colors.accent} />
                                    ) : (
                                        <Text style={styles.searchIcon}>⌕</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {isScanning && (
                                <ScanningPulse colors={colors} styles={styles} />
                            )}

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
                                                            <Text style={styles.networkBssid}>{network.BSSID || network.bssid || 'WPA2-PSK'}</Text>
                                                        </View>

                                                        <View style={styles.networkRight}>
                                                            <WifiSignalIndicator level={network.level} colors={colors} styles={styles} />
                                                            {isSelected && <Text style={styles.selectedTick}>✓</Text>}
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    )}
                                </View>
                            )}
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, isPassFocused && styles.labelFocused]}>WiFi Password</Text>
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter WiFi password"
                                placeholderTextColor={colors.muted}
                                secureTextEntry
                                style={[styles.input, isPassFocused && styles.inputFocused]}
                                onFocus={() => setIsPassFocused(true)}
                                onBlur={() => setIsPassFocused(false)}
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
                        <View style={[
                            styles.messageBox,
                            isErrorMessage ? { backgroundColor: colors.dangerLight, borderColor: isDark ? '#7f1d1d' : '#fecaca' } : null
                        ]}>
                        <Text style={[
                            styles.messageText,
                            isErrorMessage ? { color: colors.danger } : null
                        ]}>{message}</Text>
                    </View>
                    ) : null}
                </ScrollView>
            </KeyboardAvoidingView>

            <FloatingHomeButton navigation={navigation} />
        </View>
    );
};

const getStyles = (colors, isDark) => StyleSheet.create({
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
    title: {
        color: colors.text,
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
    subtitle: {
        color: colors.muted,
        marginTop: 6,
        marginBottom: 24,
        fontSize: 13,
        lineHeight: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '900',
        marginBottom: 8,
        letterSpacing: 0.2,
    },
    labelFocused: {
        color: colors.accent,
    },
    input: {
        backgroundColor: colors.borderLight,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
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
    searchInputWrap: {
        backgroundColor: colors.borderLight,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    searchInputWrapFocused: {
        borderColor: colors.accent,
        backgroundColor: colors.card,
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 13,
        color: colors.text,
        fontSize: 15,
        fontWeight: '700',
    },
    searchButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
        backgroundColor: colors.borderLight,
    },
    searchIcon: {
        color: colors.accent,
        fontSize: 25,
        fontWeight: '900',
        lineHeight: 28,
    },
    dropdownList: {
        marginTop: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        overflow: 'hidden',
        maxHeight: 240,
        shadowColor: colors.shadow,
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    networkScroll: {
        maxHeight: 240,
    },
    networkScrollContent: {
        paddingBottom: 4,
    },
    networkItem: {
        minHeight: 52,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    networkItemSelected: {
        backgroundColor: colors.accentLight,
    },
    networkInfo: {
        flex: 1,
        paddingRight: 10,
    },
    networkName: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '900',
    },
    networkBssid: {
        color: colors.muted,
        fontSize: 11,
        marginTop: 2,
        fontWeight: '600',
    },
    networkRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    selectedTick: {
        color: colors.success,
        fontSize: 17,
        fontWeight: '900',
    },
    emptyText: {
        color: colors.muted,
        padding: 16,
        textAlign: 'center',
        fontSize: 13,
    },
    connectButton: {
        minHeight: 50,
        borderRadius: 14,
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginTop: 8,
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 3,
        borderBottomWidth: 3,
        borderBottomColor: isDark ? '#065f46' : '#059669', // Darker Emerald
        borderColor: isDark ? '#10b981' : '#34d399',      // Lighter Emerald
        borderWidth: 1,
    },
    connectIcon: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '900',
        marginRight: 8,
    },
    connectButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    disabledButton: {
        opacity: 0.6,
    },
    messageBox: {
        backgroundColor: colors.successLight,
        borderRadius: 14,
        padding: 14,
        marginTop: 14,
        borderWidth: 1,
        borderColor: isDark ? '#065f46' : '#a7f3d0', // Emerald-950 or Emerald-200
    },
    messageText: {
        color: colors.success,
        fontWeight: '800',
        lineHeight: 20,
    },
    pulseContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.accentLight,
        borderRadius: 14,
        marginTop: 10,
        gap: 12,
        borderWidth: 1,
        borderColor: isDark ? '#312e81' : '#c7d2fe', // Indigo-950 or Indigo-200
    },
    pulseCircle: {
        position: 'absolute',
        left: 14,
        top: 14,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.accent,
    },
    pulseDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.accent,
    },
    pulseText: {
        color: colors.accent,
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
    wifiSignalContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 2.5,
    },
    wifiBar: {
        width: 3.5,
        borderRadius: 1.5,
    },
});

export default WifiProvisioningScreen;