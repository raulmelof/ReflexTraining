import { getApp } from '@react-native-firebase/app';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    limit,
    serverTimestamp,
} from '@react-native-firebase/firestore';

// Instância única do Firestore — reutilizada em todas as funções deste módulo
const db = getFirestore(getApp());

// Grava uma partida na coleção 'MatchHistory' com serverTimestamp (timestamp do servidor, não do device)
export const saveMatchStats = async (mode, score, errors, avgTime, avgForce, selectedTime = 0) => {
    try {
        console.log('[FIREBASE] Enviando métricas da partida...');

        await addDoc(collection(db, 'MatchHistory'), {
            modo_jogo:         mode,           // Ex: "TEMPO (30s)" ou "SOBREVIVÊNCIA"
            acertos:           score,
            erros:             errors,
            media_reacao_ms:   avgTime,
            media_forca:       avgForce,
            tempo_selecionado: selectedTime,    // 0 para sobrevivência; segundos para modo tempo
            data_partida:      serverTimestamp(), // Timestamp Firestore — independente do relógio do device
        });

        console.log('[FIREBASE] Partida salva com sucesso!');
    } catch (error) {
        console.error('[FIREBASE] Erro ao salvar dados:', error);
    }
};

// Busca as últimas 10 partidas de cada um dos 5 modos em paralelo (Promise.all)
// e retorna um array único ordenado do mais recente ao mais antigo
export const getMatchHistory = async () => {
    try {
        console.log('[FIREBASE] Buscando histórico...');

        const modos = [
            'TEMPO (30s)',
            'TEMPO (60s)',
            'TEMPO (90s)',
            'TEMPO (120s)',
            'SOBREVIVÊNCIA',
        ];

        // Dispara as 5 queries ao mesmo tempo (paralelo) — reduz latência total vs. queries sequenciais
        const promises = modos.map(modo =>
            getDocs(
                query(
                    collection(db, 'MatchHistory'),
                    where('modo_jogo', '==', modo),  // Filtro por modo (índice recomendado no Firestore)
                    limit(10)                        // Cap de 10 docs por modo → máx 50 docs no total
                )
            )
        );

        const snapshots = await Promise.all(promises); // Aguarda todas as queries

        // Achata os 5 snapshots em um único array de objetos planos
        const history = [];
        snapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
                history.push({ id: doc.id, ...doc.data() });
            });
        });

        // Ordena do mais recente para o mais antigo
        // data_partida?.seconds: acessa os segundos do Timestamp Firestore; ?? 0 protege docs sem timestamp
        history.sort((a, b) => {
            const tA = a.data_partida?.seconds ?? 0;
            const tB = b.data_partida?.seconds ?? 0;
            return tB - tA; // Decrescente
        });

        console.log(`[FIREBASE] ${history.length} partidas encontradas.`);
        return history;

    } catch (error) {
        console.error('[FIREBASE] Erro ao buscar histórico:', error.code, error.message);
        return []; // Retorna array vazio em vez de rejeitar — a UI trata o caso de lista vazia
    }
};
