// src/App.tsx
import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import ChatScreen from './components/ChatScreen';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar />
      <ChatScreen />
    </SafeAreaView>
  );
};

export default App;

