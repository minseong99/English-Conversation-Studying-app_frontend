// src/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MainMenuScreen from './components/MainMenuScreen';
import SpeakerSelectionScreen from './components/SpeakerSelectionScreen';
import ChatVoiceScreen from './components/ChatVoiceScreen';
import ChatScreen from './components/ChatScreen';
import WordChainScreen from './components/WordChainScreen';
import { SessionProvider } from './context/SessionContext';

const Stack = createStackNavigator();

const App = () => {
  return (
    <SessionProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="MainMenu">
          <Stack.Screen name="MainMenu" component={MainMenuScreen} options={{ title: "StudyingApp" }} />
          <Stack.Screen name="SpeakerSelection" component={SpeakerSelectionScreen} options={{ title: "Select model" }} />
          <Stack.Screen name="ChatVoice" component={ChatVoiceScreen} options={{ title: "Voice chat" }} />
          <Stack.Screen name="ChatText" component={ChatScreen} options={{ title: "Text chat" }} />
          <Stack.Screen name="WordChain" component={WordChainScreen} options={{ title: "Word Chain Game" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SessionProvider>
  );
};

export default App;

