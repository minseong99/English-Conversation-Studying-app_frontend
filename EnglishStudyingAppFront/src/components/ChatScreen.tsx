// src/components/ChatScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSession } from '../context/SessionContext';
import Constants from 'expo-constants';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
};

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const navigation = useNavigation();
  const { sessionId } = useSession();

  const myIp = Constants.manifest?.extra?.myIp || '192.168.124.100';

  // 화면 언마운트(뒤로가기) 시 세션 삭제 API 호출
  useEffect(() => {
      const unsubscribe = navigation.addListener('beforeRemove', () => {
        axios.delete(`http://${myIp}:3000/api/session/${sessionId}`)
          .then(() => console.log("Session cleared"))
          .catch((err) => console.error("Session clear error:", err));
      });
      return unsubscribe;
    }, [navigation, sessionId]);

  // 백엔드에서 해당 세션의 전체 대화 내역을 불러오는 함수
  const loadSessionHistory = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/session/${sessionId}`);
      // 백엔드에서 { messages: [...] } 형태로 반환한다고 가정합니다.
      if (response.data && Array.isArray(response.data.messages)) {
        setMessages(response.data.messages);
      } else {
        // 데이터 형식에 맞게 조정 (예: 직접 저장한 데이터라면 그대로 사용)
        setMessages(response.data ? [response.data] : []);
      }
    } catch (error) {
      console.error('세션 내역 불러오기 실패:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { 
      id: Date.now(), 
      text: input, 
      sender: 'user' 
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await axios.post('http://localhost:3000/api/chat', {
        message: input,
        sessionId,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const botMessage: Message = {
        id: Date.now() + 1,
        text: response.data.pronouncedText,
        sender: 'bot',
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('메시지 전송 에러:', error);
    }
  };

  // 컴포넌트 마운트 시, 기존 세션 내역을 불러옵니다.
  useEffect(() => {
    loadSessionHistory();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
      </View>

      <ScrollView style={styles.messageContainer}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageWrapper,
              message.sender === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper
            ]}
          >
            <View
              style={[
                styles.messageBox,
                message.sender === 'user' ? styles.userMessage : styles.botMessage
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.sender === 'user' ? styles.userMessageText : styles.botMessageText
                ]}
              >
                {message.text}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="메시지를 입력하세요"
          placeholderTextColor="#999"
        />
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={sendMessage}
        >
          <Text style={styles.sendButtonText}>SEND</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomTab}>
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('MainMenu')}
        >
          <Icon name="home" size={24} color="#9EA0A5" />
          <Text style={styles.tabTextInactive}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('SpeakerSelection')}
        >
          <Icon name="mic" size={24} color="#9EA0A5" />
          <Text style={styles.tabTextInactive}>Voice</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton}
        >
          <Icon name="chatbubble" size={24} color="#6B77F8" />
          <Text style={styles.tabText}>Chat</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  messageContainer: {
    flex: 1,
    padding: 20,
  },
  messageWrapper: {
    width: '100%',
    marginVertical: 5,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  botMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBox: {
    maxWidth: '80%',
    padding: 15,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: '#6B77F8',
    borderBottomRightRadius: 5,
  },
  botMessage: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#000000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 20,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#6B77F8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomTab: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingVertical: 10,
  },
  tabButton: {
    alignItems: 'center',
  },
  tabText: {
    color: '#6B77F8',
    marginTop: 5,
    fontSize: 12,
  },
  tabTextInactive: {
    color: '#9EA0A5',
    marginTop: 5,
    fontSize: 12,
  },
});

export default ChatScreen;
