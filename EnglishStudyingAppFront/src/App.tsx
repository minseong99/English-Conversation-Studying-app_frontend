// src/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SpeakerSelectionScreen from './components/SpeakerSelectionScreen';
import ChatVoiceScreen from './components/ChatVoiceScreen';
import ChatScreen from './components/ChatScreen';

const Stack = createStackNavigator();

const App = () => {
  return (

    <NavigationContainer>
      <Stack.Navigator initialRouteName="SpeakerSelection">
        <Stack.Screen name="SpeakerSelection" component={SpeakerSelectionScreen} options={{ title: "화자 선택" }} />
        <Stack.Screen name="ChatVoice" component={ChatVoiceScreen} options={{ title: "음성 대화" }} />
      </Stack.Navigator>
    </NavigationContainer>

  );
};

export default App;

