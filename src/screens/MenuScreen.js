import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BluetoothContext } from '../contexts/BluetoothContext';

const HC05_MAC_ADDRESS = "00:21:13:01:D7:ED"; 

export default function MenuScreen() {
    const { isConnected, connectToDevice, sendCommand } = useContext(BluetoothContext);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>REAÇÃO</Text>
                <Text style={[styles.status, isConnected ? styles.statusConnected : styles.statusDisconnected]}>
                    {isConnected ? 'HC-05 CONECTADO' : 'DESCONECTADO'}
                </Text>
            </View>

            {!isConnected ? (
                <TouchableOpacity 
                    style={styles.connectButton} 
                    onPress={() => connectToDevice(HC05_MAC_ADDRESS)}
                >
                    <Text style={styles.connectText}>CONECTAR HARDWARE</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.modesContainer}>
                    <TouchableOpacity 
                        style={styles.modeButton} 
                        // Envia o payload exato que configuramos no firmware
                        onPress={() => sendCommand("<CMD,START,TEMP,30>\n")}
                    >
                        <Text style={styles.modeTitle}>TEMPO</Text>
                        <Text style={styles.modeSub}>30 SEGUNDOS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.modeButton} 
                        // Envia o payload do modo morte súbita
                        onPress={() => sendCommand("<CMD,START,SURV,0>\n")}
                    >
                        <Text style={styles.modeTitle}>SOBREVIVÊNCIA</Text>
                        <Text style={styles.modeSub}>MORTE SÚBITA</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#000000', 
        padding: 20, 
        justifyContent: 'space-between' 
    },
    header: { 
        marginTop: 40 
    },
    title: { 
        color: '#FFFFFF', 
        fontSize: 64, 
        fontWeight: '900', 
        letterSpacing: -2 
    },
    status: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        marginTop: -10, 
        letterSpacing: 2 
    },
    statusConnected: { color: '#00FF00' },
    statusDisconnected: { color: '#FF0000' },
    connectButton: { 
        backgroundColor: '#FFFFFF', 
        padding: 30, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 40 
    },
    connectText: { 
        color: '#000000', 
        fontSize: 24, 
        fontWeight: '900' 
    },
    modesContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        gap: 20 
    },
    modeButton: { 
        borderWidth: 4, 
        borderColor: '#FFFFFF', 
        padding: 30, 
        justifyContent: 'center', 
        alignItems: 'flex-start' 
    },
    modeTitle: { 
        color: '#FFFFFF', 
        fontSize: 42, 
        fontWeight: '900', 
        letterSpacing: -1 
    },
    modeSub: { 
        color: '#AAAAAA', 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginTop: 5 
    },
});