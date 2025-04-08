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
import { StyleSheet } from 'react-native';

const Stack = createStackNavigator();

const App = () => {
  return (
    <SessionProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="MainMenu">
          <Stack.Screen name="MainMenu" component={MainMenuScreen} options={{ title: "FRTalk",
                                                                              headerTitleStyle: {
                                                                                  fontWeight: 'bold',
                                                                                  fontSize: 24,
                                                                                }}} />
          <Stack.Screen name="SpeakerSelection" component={SpeakerSelectionScreen} options={{ title: "Select model",
                                                                                              headerTitleStyle: {
                                                                                                  fontWeight: 'bold',
                                                                                                  fontSize: 24,
                                                                                                }}} />
          <Stack.Screen name="ChatVoice" component={ChatVoiceScreen} options={{ title: "Voice Chat",
                                                                                  headerTitleStyle: {
                                                                                      fontWeight: 'bold',
                                                                                      fontSize: 24,
                                                                                    }}} />
          <Stack.Screen name="ChatText" component={ChatScreen} options={{ title: "Text Chat",
                                                                          headerTitleStyle: {
                                                                              fontWeight: 'bold',
                                                                              fontSize: 24,
                                                                            }}} />
          <Stack.Screen name="WordChain" component={WordChainScreen} options={{ title: "Word Chain Game",
                                                                                headerTitleStyle: {
                                                                                    fontWeight: 'bold',
                                                                                    fontSize: 24,
                                                                                  }}} />
        </Stack.Navigator>
      </NavigationContainer>
    </SessionProvider>
  );
};
const styles = StyleSheet.create({
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
})

export default App;

