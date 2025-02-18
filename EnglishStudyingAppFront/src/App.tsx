// src/App.tsx
import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import ChatVoiceScreen from './components/ChatVoiceScreen';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar />
      <ChatVoiceScreen />
    </SafeAreaView>
  );
};

export default App;

