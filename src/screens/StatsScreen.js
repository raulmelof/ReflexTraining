import React, { useEffect, useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Dimensions, StatusBar
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getMatchHistory } from '../services/FirebaseService';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ── Botão idêntico ao MenuScreen ─────────────────────────────────────────────
const ArcadeButton = ({ title, onPress, variant = 'primary' }) => (
    <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[
            styles.arcadeButton,
            variant === 'primary' ? styles.bgPrimary : styles.bgSecondary,
        ]}
    >
        <Text style={styles.buttonText}>{title}</Text>
        <View style={[
            styles.buttonShadow,
            variant === 'primary' ? styles.shadowPrimary : styles.shadowSecondary,
        ]} />
    </TouchableOpacity>
);

// ── Linha de stat reutilizável ────────────────────────────────────────────────
const StatRow = ({ label, value }) => (
    <View style={styles.statRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
    </View>
);

// ── Bloco de cada tempo ───────────────────────────────────────────────────────
const TimeBlock = ({ time, matches }) => {
    if (matches.length === 0) {
        return (
            <View style={styles.block}>
                <Text style={styles.blockTitle}>{time}</Text>
                <Text style={styles.empty}>SEM PARTIDAS REGISTRADAS</Text>
            </View>
        );
    }

    const bestScore    = Math.max(...matches.map(h => h.acertos));
    const bestReaction = Math.min(...matches.map(h => h.media_reacao_ms));
    const avgScore     = (matches.reduce((a, b) => a + b.acertos,         0) / matches.length).toFixed(1);
    const avgErrors    = (matches.reduce((a, b) => a + b.erros,           0) / matches.length).toFixed(1);
    const avgReaction  = (matches.reduce((a, b) => a + b.media_reacao_ms, 0) / matches.length).toFixed(1);
    const avgForce     = (matches.reduce((a, b) => a + b.media_forca,     0) / matches.length).toFixed(1);

    return (
        <View style={styles.block}>
            <Text style={styles.blockTitle}>{time}</Text>
            <StatRow label="RECORDE DE ACERTOS"  value={bestScore} />
            <StatRow label="MENOR TEMPO DE REAÇÃO" value={`${bestReaction}ms`} />
            <View style={styles.divider} />
            <StatRow label="MÉDIA DE ACERTOS"    value={avgScore} />
            <StatRow label="MÉDIA DE ERROS"      value={avgErrors} />
            <StatRow label="MÉDIA DE REAÇÃO"     value={`${avgReaction}ms`} />
            <StatRow label="MÉDIA DE FORÇA"      value={avgForce} />
        </View>
    );
};

// ── Tela principal ────────────────────────────────────────────────────────────
export default function StatsScreen({ onGoBack }) {
    const [history, setHistory]       = useState([]);
    const [activeMode, setActiveMode] = useState('TEMPO');

    useEffect(() => {
        getMatchHistory().then(data => setHistory(data)); // Fetch do backend DB
    }, []);

    // Cacheia cálculo para prevenir re-renders pesados no JS Engine
    const timeStats = useMemo(() => {
        const groups = {
            'TEMPO (30s)':  [],
            'TEMPO (60s)':  [],
            'TEMPO (90s)':  [],
            'TEMPO (120s)': [],
        };
        history
            .filter(h => h.modo_jogo?.startsWith('TEMPO'))
            .forEach(h => { if (groups[h.modo_jogo]) groups[h.modo_jogo].push(h); });
        return groups;
    }, [history]);

    const survStats = useMemo(() => {
        const surv = history.filter(h => h.modo_jogo === 'SOBREVIVÊNCIA');
        if (surv.length === 0) return null;

        const best      = Math.max(...surv.map(h => h.acertos));
        const avgScore  = (surv.reduce((a, b) => a + b.acertos,         0) / surv.length).toFixed(1);
        const avgReact  = (surv.reduce((a, b) => a + b.media_reacao_ms, 0) / surv.length).toFixed(1);
        const avgForce  = (surv.reduce((a, b) => a + b.media_forca,     0) / surv.length).toFixed(1);

        const chartMatches = [...surv].slice(0, 8).reverse();
        return {
            best, avgScore, avgReact, avgForce,
            chartData:   chartMatches.map(h => h.acertos),
            chartLabels: chartMatches.map((_, i) => `#${i + 1}`),
        };
    }, [history]);

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#e6ddbc" barStyle="dark-content" />

            {/* Cabeçalho — mesmo padrão do MenuScreen */}
            <View style={styles.headerPanel}>
                <Text style={styles.title}>REFLEX</Text>
                <Text style={styles.subtitle}>ESTATÍSTICAS</Text>

                {/* Abas como seletor de tempo — mesmo padrão do timeOptionsRow */}
                <View style={styles.timeOptionsRow}>
                    {['TEMPO', 'SOBREVIVÊNCIA'].map(mode => (
                        <TouchableOpacity
                            key={mode}
                            activeOpacity={0.8}
                            onPress={() => setActiveMode(mode)}
                            style={[
                                styles.timeOptionBlock,
                                activeMode === mode && styles.timeOptionActive,
                            ]}
                        >
                            <Text style={[
                                styles.timeOptionText,
                                activeMode === mode && styles.timeTextActive,
                            ]}>
                                {mode}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Conteúdo */}
            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {activeMode === 'TEMPO' ? (
                    Object.entries(timeStats).map(([label, matches]) => (
                        <TimeBlock key={label} time={label} matches={matches} />
                    ))
                ) : survStats ? (
                    <>
                        <View style={styles.block}>
                            <Text style={styles.blockTitle}>SOBREVIVÊNCIA</Text>
                            <StatRow label="MELHOR PARTIDA"  value={`${survStats.best} ACERTOS`} />
                            <View style={styles.divider} />
                            <StatRow label="MÉDIA DE ACERTOS" value={survStats.avgScore} />
                            <StatRow label="MÉDIA DE REAÇÃO"  value={`${survStats.avgReact}ms`} />
                            <StatRow label="MÉDIA DE FORÇA"   value={survStats.avgForce} />
                        </View>

                        <View style={styles.block}>
                            <Text style={styles.blockTitle}>EVOLUÇÃO</Text>
                            <LineChart
                                data={{
                                    labels: survStats.chartLabels,
                                    datasets: [{ data: survStats.chartData }],
                                }}
                                width={SCREEN_WIDTH - 80}
                                height={200}
                                chartConfig={{
                                    backgroundGradientFrom: '#262525',
                                    backgroundGradientTo:   '#262525',
                                    color: (opacity = 1) => `rgba(130, 38, 38, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(230, 221, 188, ${opacity})`,
                                    propsForDots: { r: '5', strokeWidth: '2', stroke: '#e6ddbc' },
                                    propsForBackgroundLines: { stroke: '#525252' },
                                }}
                                bezier
                                style={styles.chart}
                            />
                        </View>
                    </>
                ) : (
                    <View style={styles.block}>
                        <Text style={styles.empty}>SEM PARTIDAS REGISTRADAS</Text>
                    </View>
                )}
            </ScrollView>

            {/* Rodapé — mesmo padrão do MenuScreen */}
            <View style={styles.footer}>
                <ArcadeButton title="[ VOLTAR AO MENU ]" onPress={onGoBack} variant="secondary" />
                <Text style={styles.footerText}>INSIRA FICHAS PARA CONTINUAR</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // ── Layout base ────────────────────────────────────────────────────────
    container: {
        flex: 1,
        backgroundColor: '#e6ddbc',
        padding: 20,
        justifyContent: 'space-between',
    },
    // ── Cabeçalho (espelho do MenuScreen) ──────────────────────────────────
    headerPanel: {
        marginTop: 40,
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#262525',
        padding: 20,
        backgroundColor: '#e6ddbc',
        marginBottom: 20,
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#262525',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#690202',
        letterSpacing: 5,
        marginBottom: 20,
    },
    // ── Seletor de abas (mesmo padrão do seletor de tempo) ─────────────────
    timeOptionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 8,
    },
    timeOptionBlock: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 2,
        borderColor: '#525252',
        backgroundColor: '#525252',
        alignItems: 'center',
    },
    timeOptionActive: {
        borderColor: '#822626',
        backgroundColor: '#690202',
    },
    timeOptionText: {
        color: '#aaa',
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 1,
    },
    timeTextActive: {
        color: '#e6ddbc',
    },
    // ── Scroll ─────────────────────────────────────────────────────────────
    scrollArea: { flex: 1 },
    scroll:     { paddingBottom: 10 },
    // ── Blocos de conteúdo ─────────────────────────────────────────────────
    block: {
        borderWidth: 4,
        borderColor: '#262525',
        padding: 15,
        marginBottom: 15,
        backgroundColor: '#262525',
    },
    blockTitle: {
        color: '#822626',
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 12,
        letterSpacing: 2,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statLabel: {
        color: '#525252',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1,
    },
    statValue: {
        color: '#e6ddbc',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1,
    },
    divider: {
        height: 2,
        backgroundColor: '#525252',
        marginVertical: 10,
    },
    empty: {
        color: '#525252',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1,
        textAlign: 'center',
        paddingVertical: 10,
    },
    chart: {
        marginTop: 10,
        borderRadius: 0, // sem arredondamento para manter o estilo quadrado do arcade
    },
    // ── Rodapé ─────────────────────────────────────────────────────────────
    footer: {
        paddingTop: 10,
        gap: 12,
        alignItems: 'center',
    },
    footerText: {
        color: '#525252',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    // ── Botão (idêntico ao MenuScreen) ─────────────────────────────────────
    arcadeButton: {
        borderWidth: 4,
        borderColor: '#262525',
        paddingVertical: 18,
        paddingHorizontal: 20,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
    },
    bgPrimary:      { backgroundColor: '#690202' },
    bgSecondary:    { backgroundColor: '#262525' },
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
        zIndex: 1,
    },
    shadowPrimary:  { backgroundColor: '#822626' },
    shadowSecondary:{ backgroundColor: '#525252' },
});