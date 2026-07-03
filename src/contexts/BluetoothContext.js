import React, { createContext, useState, useEffect, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { parseDeviceMessage } from '../utils/ProtocolParser';

export const BluetoothContext = createContext({});

export const BluetoothProvider = ({ children }) => {
    const [device, setDevice] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastParsedMessage, setLastParsedMessage] = useState(null);
    const readSubscription = useRef(null);
    const dataBuffer = useRef('');

    // FUNÇÃO NOVA: Pede a permissão pro usuário na tela do celular
    const requestBluetoothPermissions = async () => {
        if (Platform.OS === 'android') {
            // Android 12 ou superior (API 31+)
            if (Platform.Version >= 31) {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                ]);
                return granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;
            } 
            // Android 11 ou inferior
            else {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
        }
        return true;
    };

    const connectToDevice = async (macAddress) => {
        try {
            const hasPermission = await requestBluetoothPermissions();
            if (!hasPermission) return;

            console.log('Permissão garantida. Tentando conectar ao:', macAddress);
            
            // O SEGREDO: Mandamos o Android fazer o buffer e só avisar o App quando achar o \n
            let connectedDevice = await RNBluetoothClassic.connectToDevice(macAddress, {
                CONNECTOR_TYPE: "rfcomm",
                DELIMITER: "\n", 
                CHARACTER_SET: "ascii"
            });
            
            if (connectedDevice) {
                setDevice(connectedDevice);
                setIsConnected(true);
                startReading(connectedDevice);
            }
        } catch (error) {
            console.error('Erro na conexão:', error);
            setIsConnected(false);
        }
    };

    const startReading = (connectedDevice) => {
        console.log('🎧 Escutando a porta serial (Modo Eventos Nativos)...');
        
        readSubscription.current = connectedDevice.onDataReceived((event) => {
            // O log deve mostrar a string perfeitinha e montada pelo Android
            console.log('📡 [BLUETOOTH] O Android entregou:', event.data);
            
            if (event.data) {
                const parsed = parseDeviceMessage(event.data);
                if (parsed) {
                    console.log('🟢 [PARSER] Sucesso! Mandando pra tela:', parsed);
                    setLastParsedMessage(parsed); 
                } else {
                    console.warn('🔴 [PARSER] Falhou em decifrar:', event.data);
                }
            }
        });
    };

    // Função para enviar comandos com confirmação no console
    const sendCommand = async (commandString) => {
        if (device && isConnected) {
            try {
                console.log('📤 ENVIANDO COMANDO:', commandString);
                await device.write(commandString);
                console.log('✅ COMANDO ENVIADO COM SUCESSO');
            } catch (error) {
                console.error('❌ ERRO AO ENVIAR:', error);
            }
        }
    };

    // O useEffect agora precisa limpar um Intervalo, e não um Evento
    useEffect(() => {
        return () => {
            if (readSubscription.current) {
                clearInterval(readSubscription.current);
            }
            if (device) {
                device.disconnect();
            }
        };
    }, [device]);

    return (
        <BluetoothContext.Provider value={{ isConnected, connectToDevice, sendCommand, lastParsedMessage }}>
            {children}
        </BluetoothContext.Provider>
    );
};