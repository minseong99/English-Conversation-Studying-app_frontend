// src/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MainMenuScreen from './components/MainMenuScreen';
import SpeakerSelectionScreen from './components/SpeakerSelectionScreen';
import ChatVoiceScreen from './components/ChatVoiceScreen';
import ChatScreen from './components/ChatScreen';
import WordChainScreen from './components/WordChainScreen';
import { SessionProvider } from './context/SessionContext';
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList, TabParamList } from './types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// 홈 탭 내의 스택 네비게이터
const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainMenu"
        component={MainMenuScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// 하단 탭 네비게이터
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          const iconSize = 20; // 사용자가 18로 설정한 값 유지

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Voice') {
            iconName = 'mic';
          } else if (route.name === 'Chat') {
            iconName = 'chatbubble';
          } else if (route.name === 'Games') {
            iconName = 'game-controller';
          }

          return <Icon name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: '#6B77F8',
        tabBarInactiveTintColor: '#9EA0A5',
        tabBarLabelStyle: {
          fontSize: 12,
          // paddingBottom: 2, // 텍스트와 탭 바 하단과의 간격을 위해 필요시 추가
        },
        tabBarStyle: {
          height: 65, // 탭 바의 높이를 65로 늘림
          paddingTop: 5, // 아이콘/텍스트와 탭 바 상단과의 간격을 위해 추가 (옵션)
          paddingBottom: 5, // 아이콘/텍스트와 탭 바 하단과의 간격을 위해 추가 (옵션)
        },
      })}>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          headerTitle: 'FRTalk',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 24,
          },
        }}
      />
      <Tab.Screen
        name="Voice"
        component={SpeakerSelectionScreen}
        options={{
          headerTitle: 'Select model',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 24,
          },
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerTitle: 'Text Chat',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 24,
          },
        }}
      />
      <Tab.Screen
        name="Games"
        component={WordChainScreen}
        options={{
          headerTitle: 'Word Chain Game',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 24,
          },
        }}
      />
    </Tab.Navigator>
  );
};

const App = () => {
  return (
    <SessionProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="ChatVoice"
            component={ChatVoiceScreen}
            options={{
              headerShown: true,
              title: 'Voice Chat',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 24,
              },
            }}
          />
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
});

export default App;
