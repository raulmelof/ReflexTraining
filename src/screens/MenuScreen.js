import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { BluetoothContext } from '../contexts/BluetoothContext';

// 1. O Componente agora vive FORA do MenuScreen (Resolve o unstable-nested-components)
const ArcadeButton = ({ title, onPress, disabled, variant = 'primary' }) => {
    return (
        <TouchableOpacity 
            activeOpacity={0.7}
            onPress={onPress}
            disabled={disabled}
            style={[
                styles.arcadeButton, 
                variant === 'primary' ? styles.bgPrimary : styles.bgSecondary,
                disabled && styles.bgDisabled
            ]}
        >
            <Text style={[styles.buttonText, disabled && styles.textDisabled]}>
                {title}
            </Text>
            <View style={[
                styles.buttonShadow, 
                variant === 'primary' ? styles.shadowPrimary : styles.shadowSecondary,
                disabled && styles.shadowDisabled
            ]} />
        </TouchableOpacity>
    );
};

export default function MenuScreen() {
    const { isConnected, connectToDevice, sendCommand } = useContext(BluetoothContext);
    
    // NOVO: Estado para memorizar o tempo selecionado (Padrão: 30s)
    const [timeLimit, setTimeLimit] = useState(30);

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#e6ddbc" barStyle="dark-content" />
            
            <View style={styles.headerPanel}>
                <Text style={styles.title}>REFLEX</Text>
                <Text style={styles.subtitle}>TRAINING</Text>
                
                <View style={styles.statusBox}>
                    <Text style={styles.statusLabel}>STATUS DO SISTEMA:</Text>
                    <Text style={[styles.statusValue, isConnected ? styles.textOnline : styles.textOffline]}>
                        {isConnected ? 'ONLINE / CONECTADO' : 'OFFLINE / AGUARDANDO'}
                    </Text>
                </View>
            </View>

            <View style={styles.controlsContainer}>
                {!isConnected ? (
                    <ArcadeButton 
                        title="[ CONECTAR HARDWARE ]" 
                        onPress={() => connectToDevice('00:21:13:01:D7:ED')} // Substitua pelo seu MAC
                        variant="secondary"
                    />
                ) : (
                    <View style={styles.modesContainer}>
                        
                        {/* NOVO: Painel Seletor de Tempo */}
                        <View style={styles.selectorPanel}>
                            <Text style={styles.instructionText}>TEMPO DE JOGO:</Text>
                            <View style={styles.timeOptionsRow}>
                                {[30, 60, 90, 120].map((time) => (
                                    <TouchableOpacity 
                                        key={time}
                                        activeOpacity={0.8}
                                        style={[
                                            styles.timeOptionBlock, 
                                            timeLimit === time && styles.timeOptionActive
                                        ]}
                                        onPress={() => setTimeLimit(time)}
                                    >
                                        <Text style={[
                                            styles.timeOptionText,
                                            timeLimit === time && styles.timeTextActive
                                        ]}>
                                            {time}s
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        
                        <ArcadeButton 
                            title={`MODO TEMPO (${timeLimit}s)`} 
                            // O payload agora injeta o tempo selecionado dinamicamente
                            onPress={() => sendCommand(`<CMD,START,TEMP,${timeLimit}>\n`)} 
                            variant="primary"
                        />
                        
                        <View style={styles.spacer} />
                        
                        <ArcadeButton 
                            title="SOBREVIVÊNCIA" 
                            onPress={() => sendCommand("<CMD,START,SURV,0>\n")} 
                            variant="primary"
                        />
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>INSIRA FICHAS PARA CONTINUAR</Text>
            </View>
        </View>
    );
}

// 2. Todos os estilos inline foram mapeados aqui (Resolve o no-inline-styles)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e6ddbc',
        padding: 20,
        justifyContent: 'space-between',
    },
    headerPanel: {
        marginTop: 40,
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#262525',
        padding: 20,
        backgroundColor: '#e6ddbc',
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#262525',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#690202',
        letterSpacing: 5,
        marginBottom: 20,
    },
    statusBox: {
        width: '100%',
        backgroundColor: '#262525',
        padding: 10,
        alignItems: 'center',
    },
    statusLabel: {
        color: '#e6ddbc',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    statusValue: {
        fontSize: 16,
        fontWeight: '900',
        marginTop: 5,
    },
    textOffline: {
        color: '#822626',
    },
    textOnline: {
        color: '#e6ddbc',
    },
    controlsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    modesContainer: {
        width: '100%',
    },
    // Estilos do Painel de Tempo
    selectorPanel: {
        marginBottom: 20,
        padding: 15,
        borderWidth: 4,
        borderColor: '#262525',
        backgroundColor: '#262525',
    },
    instructionText: {
        textAlign: 'center',
        color: '#e6ddbc',
        fontWeight: '900',
        fontSize: 14,
        marginBottom: 15,
        letterSpacing: 1,
    },
    timeOptionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeOptionBlock: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 2,
        borderColor: '#525252',
        backgroundColor: '#525252',
    },
    timeOptionActive: {
        borderColor: '#822626',
        backgroundColor: '#690202',
    },
    timeOptionText: {
        color: '#262525',
        fontWeight: '900',
        fontSize: 16,
    },
    timeTextActive: {
        color: '#e6ddbc',
    },
    // Fim dos Estilos do Painel de Tempo
    arcadeButton: {
        borderWidth: 4,
        borderColor: '#262525',
        paddingVertical: 18,
        paddingHorizontal: 20,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    bgPrimary: {
        backgroundColor: '#690202',
    },
    bgSecondary: {
        backgroundColor: '#262525',
    },
    bgDisabled: {
        backgroundColor: '#525252',
        opacity: 0.8,
    },
    buttonText: {
        color: '#e6ddbc',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 1.5,
        zIndex: 2,
    },
    textDisabled: {
        color: '#262525',
    },
    buttonShadow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 6,
        zIndex: 1,
    },
    shadowPrimary: {
        backgroundColor: '#822626',
    },
    shadowSecondary: {
        backgroundColor: '#525252',
    },
    shadowDisabled: {
        backgroundColor: '#262525',
    },
    spacer: {
        height: 20,
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 10,
    },
    footerText: {
        color: '#525252',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
    }
});