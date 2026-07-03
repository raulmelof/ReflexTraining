// src/services/FirebaseService.js
import firestore from '@react-native-firebase/firestore';

export const saveMatchStats = async (mode, score, errors, avgTime, avgForce) => {
    try {
        console.log('☁️ [FIREBASE] Enviando métricas da partida...');
        
        // Cria um documento dentro da coleção "MatchHistory"
        await firestore().collection('MatchHistory').add({
            modo_jogo: mode,             // 'TEMPO' ou 'SOBREVIVÊNCIA'
            acertos: score,              // Quantas luzes apagou
            erros: errors,               // Quantas vezes errou o alvo
            media_reacao_ms: avgTime,    // Tempo médio de reação (Milissegundos)
            media_forca: avgForce,       // Força média aplicada no piezo
            data_partida: firestore.FieldValue.serverTimestamp(), // Pega a hora exata do servidor do Google
        });

        console.log('✅ [FIREBASE] Partida salva com sucesso!');
    } catch (error) {
        console.error('❌ [FIREBASE] Erro ao salvar dados:', error);
    }
};