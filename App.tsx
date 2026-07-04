import React, { useContext, useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { BluetoothProvider, BluetoothContext } from './src/contexts/BluetoothContext';
import MenuScreen from './src/screens/MenuScreen';
import GameScreen from './src/screens/GameScreen'; 
import StatsScreen from './src/screens/StatsScreen';

// Sub-componente separado para consumir BluetoothContext dentro do Provider
// (Context só é acessível por componentes filhos do seu Provider)
const AppNavigator = () => {
  const { lastParsedMessage } = useContext(BluetoothContext) as any;
  const [currentScreen, setCurrentScreen] = useState('MENU'); // 'MENU' | 'GAME' | 'STATS'

  // Navegação reativa: troca para GameScreen assim que a placa sinaliza início de jogo
  // COUNT = contagem regressiva iniciada; NEXT = primeiro alvo já sorteado (jogo em andamento)
  useEffect(() => {
    if (!lastParsedMessage) return;

    // Se a placa mandar o gatilho de Contagem Regressiva (COUNT) 
    // ou se já pular direto pro Início do Jogo (NEXT), nós forçamos a tela do jogo a abrir!
    if (lastParsedMessage.action === 'COUNT' || lastParsedMessage.action === 'NEXT') {
      setCurrentScreen('GAME');
    }
  }, [lastParsedMessage]);

  // Roteador simples baseado em string — sem biblioteca de navegação
  const renderScreen = () => {
    switch (currentScreen) {
      case 'GAME':
        return <GameScreen onGoBack={() => setCurrentScreen('MENU')} />;
      case 'STATS':
        return <StatsScreen onGoBack={() => setCurrentScreen('MENU')} />;
      case 'MENU':
      default:
        return <MenuScreen onOpenStats={() => setCurrentScreen('STATS')} />;
    }
  };

  return (
    <>
      {renderScreen()}
    </>
  );
};

function App(): React.JSX.Element {
  return (
    // BluetoothProvider envolve toda a árvore — contexto BT disponível em qualquer tela
    <BluetoothProvider>
      <SafeAreaView style={styles.backgroundStyle}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <AppNavigator />
      </SafeAreaView>
    </BluetoothProvider>
  );
}

const styles = StyleSheet.create({
  backgroundStyle: {
    flex: 1,
    backgroundColor: '#000000', // Fundo preto para SafeAreaView não vazar a cor creme das telas
  },
});

export default App;
