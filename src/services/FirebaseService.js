// services/FirebaseService.js
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

// Instância única do Firestore
const db = getFirestore(getApp());

export const saveMatchStats = async (mode, score, errors, avgTime, avgForce, selectedTime = 0) => {
    try {
        console.log('[FIREBASE] Enviando métricas da partida...');

        await addDoc(collection(db, 'MatchHistory'), {
            modo_jogo:         mode,
            acertos:           score,
            erros:             errors,
            media_reacao_ms:   avgTime,
            media_forca:       avgForce,
            tempo_selecionado: selectedTime,
            data_partida:      serverTimestamp(),
        });

        console.log('[FIREBASE] Partida salva com sucesso!');
    } catch (error) {
        console.error('[FIREBASE] Erro ao salvar dados:', error);
    }
};

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

        // Dispara as 5 queries ao mesmo tempo (paralelo)
        const promises = modos.map(modo =>
            getDocs(
                query(
                    collection(db, 'MatchHistory'),
                    where('modo_jogo', '==', modo),
                    limit(10)
                )
            )
        );

        const snapshots = await Promise.all(promises);

        const history = [];
        snapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
                history.push({ id: doc.id, ...doc.data() });
            });
        });

        // Ordena do mais recente para o mais antigo
        history.sort((a, b) => {
            const tA = a.data_partida?.seconds ?? 0;
            const tB = b.data_partida?.seconds ?? 0;
            return tB - tA;
        });

        console.log(`[FIREBASE] ${history.length} partidas encontradas.`);
        return history;

    } catch (error) {
        console.error('[FIREBASE] Erro ao buscar histórico:', error.code, error.message);
        return [];
    }
};
