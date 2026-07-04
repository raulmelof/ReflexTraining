import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { getMatchHistory } from '../services/FirebaseService';

// Reaproveitando o botão clássico
const ArcadeButton = ({ title, onPress }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.arcadeButton}>
        <Text style={styles.buttonText}>{title}</Text>
        <View style={styles.buttonShadow} />
    </TouchableOpacity>
);

export default function StatsScreen({ onGoBack }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        const data = await getMatchHistory();
        setHistory(data);
        setLoading(false);
    };

    // Função para formatar a data do Firebase para algo legível (DD/MM HH:MM)
    const formatDate = (timestamp) => {
        if (!timestamp) return 'DATA INVÁLIDA';
        // O Firebase pode retornar um objeto Timestamp com seconds e nanoseconds
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${day}/${month} ${hours}:${minutes}`;
    };

    const renderItem = ({ item, index }) => (
        <View style={styles.scoreCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.rankText}>#{index + 1}</Text>
                <Text style={styles.modeText}>{item.modo_jogo}</Text>
                <Text style={styles.dateText}>{formatDate(item.data_partida)}</Text>
            </View>
            
            <View style={styles.cardBody}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>ACERTOS</Text>
                    <Text style={[styles.statValue, styles.textSuccess]}>{item.acertos}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>ERROS</Text>
                    <Text style={[styles.statValue, styles.textDanger]}>{item.erros}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>REAÇÃO</Text>
                    <Text style={styles.statValue}>{item.media_reacao_ms}ms</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>FORÇA</Text>
                    <Text style={styles.statValue}>{item.media_forca}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#262525" barStyle="light-content" />
            
            <View style={styles.header}>
                <Text style={styles.title}>HALL DA FAMA</Text>
                <Text style={styles.subtitle}>REGISTROS DO SISTEMA</Text>
            </View>

            <View style={styles.listContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#822626" style={styles.loader} />
                ) : history.length === 0 ? (
                    <Text style={styles.emptyText}>NENHUMA PARTIDA REGISTRADA.</Text>
                ) : (
                    <FlatList
                        data={history}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>

            <View style={styles.footer}>
                <ArcadeButton title="[ VOLTAR AO MENU ]" onPress={onGoBack} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#262525', // Fundo cinza chumbo para diferenciar do menu
        padding: 20,
        justifyContent: 'space-between',
    },
    header: {
        marginTop: 20,
        marginBottom: 20,
        alignItems: 'center',
        borderBottomWidth: 4,
        borderBottomColor: '#525252',
        paddingBottom: 15,
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: '#e6ddbc',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#822626',
        letterSpacing: 3,
    },
    listContainer: {
        flex: 1,
    },
    emptyText: {
        color: '#525252',
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
        marginTop: 50,
        letterSpacing: 1,
    },
    scoreCard: {
        backgroundColor: '#e6ddbc', // Fundo creme para os cartões
        borderWidth: 4,
        borderColor: '#525252',
        marginBottom: 15,
        padding: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 2,
        borderBottomColor: '#262525',
        paddingBottom: 5,
        marginBottom: 10,
    },
    rankText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#822626',
    },
    modeText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#262525',
    },
    dateText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#525252',
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#262525', // Fundo escuro para destacar os dados
        padding: 10,
    },
    statBox: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#e6ddbc',
        marginBottom: 5,
        letterSpacing: 1,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#525252',
    },
    footer: {
        marginTop: 10,
    },
    arcadeButton: {
        borderWidth: 4,
        borderColor: '#525252',
        backgroundColor: '#262525',
        paddingVertical: 18,
        paddingHorizontal: 20,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
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
        backgroundColor: '#525252',
        zIndex: 1,
    },
    loader: {
        marginTop: 50,
    },
    listContent: {
        paddingBottom: 20,
    },
    textSuccess: {
        color: '#e6ddbc',
    },
    textDanger: {
        color: '#822626',
    },
});