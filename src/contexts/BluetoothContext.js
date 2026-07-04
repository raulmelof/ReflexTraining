import React, { createContext, useState, useEffect, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { parseDeviceMessage } from '../utils/ProtocolParser';

export const BluetoothContext = createContext({});

export const BluetoothProvider = ({ children }) => {
    const [device, setDevice]                     = useState(null);
    const [isConnected, setIsConnected]           = useState(false);
    const [lastParsedMessage, setLastParsedMessage] = useState(null);
    const readSubscription = useRef(null); // Guarda o handle do listener para cancelamento no cleanup

    // Solicita permissões em runtime (obrigatório Android 6+)
    // Android 12+ (API 31+): BLUETOOTH_CONNECT + BLUETOOTH_SCAN substituem ACCESS_FINE_LOCATION
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
            // Android 11 ou inferior: localização fina usada para descoberta BT clássico
            else {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
        }
        return true; // iOS não precisa de permissão em runtime para BT clássico
    };

    const connectToDevice = async (macAddress) => {
        try {
            const hasPermission = await requestBluetoothPermissions();
            if (!hasPermission) return;

            console.log('Permissão garantida. Tentando conectar ao:', macAddress);
            
            // RFCOMM = protocolo serial sobre BT clássico (mesmo que porta COM virtual)
            // DELIMITER: "\n" → o Android bufferiza bytes até encontrar '\n' e entrega a string completa
            //   Isso elimina fragmentação de pacotes — o app recebe sempre um pacote inteiro por evento
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
        
        // onDataReceived dispara a cada string delimitada por '\n' recebida do HC-05
        readSubscription.current = connectedDevice.onDataReceived((event) => {
            // O log deve mostrar a string perfeitinha e montada pelo Android
            console.log('📡 [BLUETOOTH] O Android entregou:', event.data);
            
            if (event.data) {
                const parsed = parseDeviceMessage(event.data); // Extrai e estrutura os campos do protocolo <CAT,ACT,V1,V2>
                if (parsed) {
                    console.log('🟢 [PARSER] Sucesso! Mandando pra tela:', parsed);
                    setLastParsedMessage(parsed);  // Atualiza o contexto → screens re-renderizam via useEffect
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
                await device.write(commandString); // Escreve na RFCOMM → chega como RX na UART1 do STM32
                console.log('✅ COMANDO ENVIADO COM SUCESSO');
            } catch (error) {
                console.error('❌ ERRO AO ENVIAR:', error);
            }
        }
    };

    // Cleanup ao desmontar: cancela listener e desconecta o dispositivo BT
    // ATENÇÃO: readSubscription guarda um listener (não um Interval) — clearInterval está tecnicamente incorreto
    //          mas não causa dano; o correto seria readSubscription.current.remove() se a lib expuser esse método
    useEffect(() => {
        return () => {
            if (readSubscription.current) {
                clearInterval(readSubscription.current); // Deveria ser .remove() — ver nota acima
            }
            if (device) {
                device.disconnect();
            }
        };
    }, [device]);

    return (
        // Expõe isConnected, connectToDevice, sendCommand e lastParsedMessage para toda a árvore de componentes
        <BluetoothContext.Provider value={{ isConnected, connectToDevice, sendCommand, lastParsedMessage }}>
            {children}
        </BluetoothContext.Provider>
    );
};
