import firestore from '@react-native-firebase/firestore';

export const saveMatchStats = async (mode, score, errors, avgTime, avgForce, selectedTime = 0) => {
    try {
        console.log('☁️ [FIREBASE] Enviando métricas da partida...');
        
        // Cria um documento dentro da coleção "MatchHistory"
        await firestore().collection('MatchHistory').add({
            modo_jogo: mode,             // 'TEMPO' ou 'SOBREVIVÊNCIA'
            acertos: score,              // Quantas luzes apagou
            erros: errors,               // Quantas vezes errou o alvo
            media_reacao_ms: avgTime,    // Tempo médio de reação (Milissegundos)
            media_forca: avgForce,       // Força média aplicada no piezo
            tempo_selecionado: selectedTime,
            data_partida: firestore.FieldValue.serverTimestamp(), // Pega a hora exata do servidor do Google
        });

        console.log('✅ [FIREBASE] Partida salva com sucesso!');
    } catch (error) {
        console.error('❌ [FIREBASE] Erro ao salvar dados:', error);
    }
};

export const getMatchHistory = async () => {
    try {
        console.log('☁️ [FIREBASE] Buscando histórico...');
        // Sintaxe correta do @react-native-firebase encadeando os métodos!
        const querySnapshot = await firestore()
            .collection('MatchHistory')
            .orderBy('data_partida', 'desc')
            .limit(10)
            .get();
        
        const history = [];
        
        querySnapshot.forEach((doc) => {
            history.push({ id: doc.id, ...doc.data() });
        });
        
        return history;
    } catch (error) {
        console.error("Erro ao buscar estatísticas do Firebase: ", error);
        return [];
    }
};
