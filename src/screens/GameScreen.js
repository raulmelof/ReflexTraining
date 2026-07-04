import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, StatusBar } from 'react-native';
import { BluetoothContext } from '../contexts/BluetoothContext';
import { saveMatchStats } from '../services/FirebaseService';

// Componente do botão reaproveitado para o padrão Gabinete
const ArcadeButton = ({ title, onPress }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.arcadeButton}>
        <Text style={styles.buttonText}>{title}</Text>
        <View style={styles.buttonShadow} />
    </TouchableOpacity>
);

export default function GameScreen({ onGoBack }) {
    const { lastParsedMessage } = useContext(BluetoothContext);
    
    const [gameState, setGameState] = useState('PREPARANDO'); // PREPARANDO, CONTANDO, JOGANDO, FIM
    const [displayInfo, setDisplayInfo] = useState('');
    const [score, setScore] = useState(0);
    const [lastReaction, setLastReaction] = useState(0);
    
    // Novo estado: Memória local para imprimir o recibo de estatísticas no final
    const [finalStats, setFinalStats] = useState(null);

    // O "Motor" da nossa animação (agora usado para o quadrado de mira)
    const circleScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!lastParsedMessage) return;

        const { category, action, value1, matchMode, score: statScore, errors, avgTime, avgForce } = lastParsedMessage;

        // Contagem Regressiva
        if (category === 'SYS' && action === 'COUNT') {
            setGameState('CONTANDO');
            setDisplayInfo(value1.toString());
            circleScale.setValue(0);
        }

        // Novo Alvo: Ativa a caixa de mira retrô
        if (category === 'GAME' && action === 'NEXT') {
            setGameState('JOGANDO');
            setDisplayInfo('VAI!');
            
            circleScale.setValue(1);
            Animated.timing(circleScale, {
                toValue: 0,
                duration: value1,
                useNativeDriver: true,
            }).start();
        }

        // Acerto
        if (category === 'GAME' && action === 'HIT') {
            circleScale.stopAnimation(); 
            circleScale.setValue(0);     
            setScore(prev => prev + 1);
            setLastReaction(value1);     
            setDisplayInfo('+1');
        }

        // Erro ou Estouro de Tempo
        if (category === 'GAME' && (action === 'MISS' || action === 'TIME')) {
            circleScale.stopAnimation();
            circleScale.setValue(0);
            setDisplayInfo(action === 'MISS' ? 'ERROU!' : 'ESGOTADO!');
        }

        // Placar Final (Estatísticas recebidas)
        if (category === 'STAT') {
            setGameState('FIM');
            setDisplayInfo('FIM DE JOGO');
            
            // value1 é o tempo que a placa nos devolve no pacote <STAT...>
            // Se for sobrevivência, definimos como 0 para não ter erro de leitura
            const tempoDaPartida = matchMode === 'TEMP' ? value1 : 0;

            // Grava os dados para o Recibo da Interface
            setFinalStats({ matchMode, statScore, errors, avgTime, avgForce, tempoDaPartida });

            // Envia para as nuvens com o tempo agora sendo incluído!
            saveMatchStats(matchMode, statScore, errors, avgTime, avgForce, tempoDaPartida);
        }

    }, [lastParsedMessage, circleScale]);

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#e6ddbc" barStyle="dark-content" />

            {/* A Carcaça do Monitor */}
            <View style={styles.cabinetScreen}>
                
                {/* Header do Visor LCD */}
                <View style={styles.screenHeader}>
                    <Text style={styles.headerText}>PTS: {score}</Text>
                    <Text style={styles.headerText}>REAÇÃO: {lastReaction}MS</Text>
                </View>

                {/* Palco Central do Jogo */}
                <View style={styles.stage}>
                    {gameState !== 'FIM' ? (
                        <>
                            {/* O Alvo (quadrado de mira que fecha) */}
                            <Animated.View style={[
                                styles.targetVisual,
                                { transform: [{ scale: circleScale }] }
                            ]} />
                            
                            <Text style={styles.centerDisplay}>{displayInfo}</Text>
                        </>
                    ) : (
                        /* O Recibo Terminal no Fim do Jogo */
                        <View style={styles.receiptContainer}>
                            <Text style={styles.receiptTitle}>--- RELATÓRIO DO SISTEMA ---</Text>
                            <Text style={styles.receiptLine}>MODO DE JOGO: {finalStats?.matchMode}</Text>
                            <Text style={styles.receiptLine}>ALVOS DESTRUÍDOS: {finalStats?.statScore}</Text>
                            <Text style={styles.receiptLine}>FALHAS: {finalStats?.errors}</Text>
                            <Text style={styles.receiptLine}>TEMPO MÉDIO: {finalStats?.avgTime}ms</Text>
                            <Text style={styles.receiptLine}>FORÇA MÉDIA: {finalStats?.avgForce}</Text>
                            <Text style={styles.receiptTitle}>----------------------------</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Rodapé Físico (Fora do Monitor) */}
            <View style={styles.controlsArea}>
                {gameState === 'FIM' ? (
                    <ArcadeButton title="[ VOLTAR AO MENU ]" onPress={onGoBack} />
                ) : (
                    <Text style={styles.instructionText}>ATENÇÃO AOS ALVOS NA MESA</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#e6ddbc', // Creme da carcaça do fliperama
        padding: 20, 
        justifyContent: 'space-between' 
    },
    cabinetScreen: {
        flex: 1,
        backgroundColor: '#262525', // Tela Cinza Chumbo
        borderWidth: 8,
        borderColor: '#525252', // Borda da tela embutida
        marginTop: 20,
        padding: 15,
        overflow: 'hidden',
    },
    screenHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 4,
        borderBottomColor: '#525252',
        paddingBottom: 15,
    },
    headerText: { 
        color: '#e6ddbc', 
        fontSize: 22, 
        fontWeight: '900',
        letterSpacing: 1 
    },
    stage: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    targetVisual: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderWidth: 16,
        borderColor: '#822626', // Vermelho ferrugem como alvo
        borderRadius: 15, // Forma de caixa de mira ao invés de círculo
    },
    centerDisplay: { 
        color: '#e6ddbc', 
        fontSize: 80, 
        fontWeight: '900', 
        letterSpacing: -2,
        textAlign: 'center'
    },
    receiptContainer: {
        width: '100%',
        padding: 10,
    },
    receiptTitle: {
        color: '#822626',
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 20,
        marginTop: 10,
        letterSpacing: 1,
        textAlign: 'center',
    },
    receiptLine: {
        color: '#e6ddbc',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        letterSpacing: 1,
    },
    controlsArea: {
        marginTop: 20,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80,
    },
    instructionText: {
        color: '#262525',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    arcadeButton: {
        borderWidth: 4,
        borderColor: '#262525',
        backgroundColor: '#690202',
        paddingVertical: 18,
        paddingHorizontal: 20,
        alignItems: 'center',
        position: 'relative',
        width: '100%',
    },
    buttonText: {
        color: '#e6ddbc',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 1.5,
        zIndex: 2,
    },
    buttonShadow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 6,
        backgroundColor: '#822626',
        zIndex: 1,
    },
});