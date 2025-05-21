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
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'; // 추가

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
  const insets = useSafeAreaInsets(); // 추가: 안전 영역 값 가져오기

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          const iconSize = 20;

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
        },
        tabBarStyle: {
          height: 55 + insets.bottom, // 수정: 기존 높이 + 하단 안전 영역
          paddingTop: 5,
          paddingBottom: insets.bottom + 5, // 수정: 하단 안전 영역 + 추가 패딩
          backgroundColor: 'white', // 필요에 따라 배경색 지정
          borderTopWidth: 1, // 필요에 따라 상단 경계선
          borderTopColor: '#EEEEEE', // 필요에 따라 상단 경계선 색상
        },
      })}>
      {/* ... Tab.Screen 설정들 ... */}
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
    <SafeAreaProvider> {/* 추가: SafeAreaProvider로 전체 앱 감싸기 */}
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
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default App;