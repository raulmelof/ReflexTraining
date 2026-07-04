import React, { useContext, useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { BluetoothProvider, BluetoothContext } from './src/contexts/BluetoothContext';
import MenuScreen from './src/screens/MenuScreen';
import GameScreen from './src/screens/GameScreen'; 
import StatsScreen from './src/screens/StatsScreen'; // 1. IMPORTAMOS A NOVA TELA

// Criamos um sub-componente para consumir o Contexto corretamente dentro do Provider
const AppNavigator = () => {
  const { lastParsedMessage } = useContext(BluetoothContext) as any;
  const [currentScreen, setCurrentScreen] = useState('MENU');

  // Monitora as mensagens da placa para trocar a tela automaticamente
  useEffect(() => {
    if (!lastParsedMessage) return;

    // Se a placa mandar o gatilho de Contagem Regressiva (COUNT) 
    // ou se já pular direto pro Início do Jogo (NEXT), nós forçamos a tela do jogo a abrir!
    if (lastParsedMessage.action === 'COUNT' || lastParsedMessage.action === 'NEXT') {
      setCurrentScreen('GAME');
    }
  }, [lastParsedMessage]);

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
    backgroundColor: '#000000',
  },
});

export default App;