import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { BluetoothContext } from '../contexts/BluetoothContext';
import { saveMatchStats } from '../services/FirebaseService';

export default function GameScreen({ onGoBack }) {
    const { lastParsedMessage } = useContext(BluetoothContext);
    
    const [gameState, setGameState] = useState('PREPARANDO'); // PREPARANDO, CONTANDO, JOGANDO, FIM
    const [displayInfo, setDisplayInfo] = useState('');
    const [score, setScore] = useState(0);
    const [lastReaction, setLastReaction] = useState(0);

    // O "Motor" da nossa animação do círculo
    const circleScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!lastParsedMessage) return;

        const { category, action, value1, matchMode, score: statScore, errors, avgTime, avgForce } = lastParsedMessage;

        // Contagem Regressiva
        if (category === 'SYS' && action === 'COUNT') {
            setGameState('CONTANDO');
            setDisplayInfo(value1.toString());
            // Animação de pulso no número
            circleScale.setValue(0);
        }

        // Novo Alvo: Ativa a animação de encolhimento local (Desacoplada do Bluetooth)
        if (category === 'GAME' && action === 'NEXT') {
            setGameState('JOGANDO');
            setDisplayInfo('VAI!');
            
            // value1 é o timeout (ex: 1500ms). A animação começa no tamanho máximo (1) e vai até sumir (0)
            circleScale.setValue(1);
            Animated.timing(circleScale, {
                toValue: 0,
                duration: value1,
                useNativeDriver: true, // Garante 60 FPS rodando em C++ fora da thread do JS
            }).start();
        }

        // Acerto
        if (category === 'GAME' && action === 'HIT') {
            circleScale.stopAnimation(); // Para o círculo na hora
            circleScale.setValue(0);     // Esconde o círculo
            setScore(prev => prev + 1);
            setLastReaction(value1);     // Tempo de reação
            setDisplayInfo(`+1`);
        }

        // Erro ou Estouro de Tempo
        if (category === 'GAME' && (action === 'MISS' || action === 'TIME')) {
            circleScale.stopAnimation();
            circleScale.setValue(0);
            setDisplayInfo(action === 'MISS' ? 'ERROU!' : 'TEMPO ESGOTADO!');
        }

        // Placar Final (Estatísticas recebidas)
        if (category === 'STAT') {
            setGameState('FIM');
            setDisplayInfo(`FINALIZADO`);
            
            // Invoca a camada de serviço passando os dados crus que a STM32 processou!
            // Assumimos 'TEMPO' como padrão aqui, mas você pode passar a variável do modo atual
            saveMatchStats(matchMode, statScore, errors, avgTime, avgForce);
        }

    }, [lastParsedMessage, circleScale]);

    return (
        <View style={styles.container}>
            {/* Header com os dados ao vivo */}
            <View style={styles.header}>
                <Text style={styles.scoreText}>ACERTOS: {score}</Text>
                <Text style={styles.reactionText}>ÚLTIMA REAÇÃO: {lastReaction}ms</Text>
            </View>

            {/* O Palco Central da Animação */}
            <View style={styles.stage}>
                {/* O Círculo Animado (Só aparece no modo Sobrevivência/Tempo durante o NEXT) */}
                <Animated.View style={[
                    styles.circle,
                    { transform: [{ scale: circleScale }] }
                ]} />
                
                <Text style={styles.centerDisplay}>{displayInfo}</Text>
            </View>

            {/* Rodapé Dinâmico */}
            {gameState === 'FIM' && (
                <View style={styles.footer}>
                    <Text style={styles.finishText} onPress={onGoBack}>VOLTAR AO MENU</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    scoreText: { color: '#FFF', fontSize: 24, fontWeight: '900' },
    reactionText: { color: '#0F0', fontSize: 24, fontWeight: '900' },
    stage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    circle: {
        position: 'absolute',
        width: 350,
        height: 350,
        borderRadius: 175,
        borderWidth: 10,
        borderColor: '#FFF',
    },
    centerDisplay: { color: '#FFF', fontSize: 96, fontWeight: '900', letterSpacing: -2 },
    footer: { marginBottom: 40, alignItems: 'center' },
    finishText: { color: '#000', backgroundColor: '#FFF', padding: 20, fontSize: 24, fontWeight: '900' },
});