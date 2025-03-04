// src/components/ChatScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '../context/SessionContext';
import Constants from 'expo-constants';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const ChatScreen = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const navigation = useNavigation();

  
  const { sessionId } = useSession(); // sessionId 가져오기
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

  // 메시지 전송 함수: 사용자 메시지와 AI 응답을 모두 로컬 상태에 추가
  const sendMessage = async () => {
    if (!input) return;

    // 사용자가 입력한 메시지를 즉시 추가
    const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await axios.post('http://localhost:3000/api/chat', {
        message: input,
        sessionId,     // 세션 ID
      },  {
        headers: { 'Content-Type': 'application/json' },
      });
      // 백엔드가 반환한 발음 처리된 텍스트를 사용하여 AI 메시지 생성
      const botMessage: Message = {
        id: Date.now() + 1,
        text: response.data.pronouncedText,
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('메시지 전송 에러:', error);
    }
    setInput('');
  };

  // 컴포넌트 마운트 시, 기존 세션 내역을 불러옵니다.
  useEffect(() => {
    loadSessionHistory();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text style={item.sender === 'user' ? styles.userMessage : styles.botMessage}>
            {item.text}
          </Text>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="message"
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, marginRight: 8, padding: 8 },
  userMessage: { textAlign: 'right', marginVertical: 4, color: 'blue' },
  botMessage: { textAlign: 'left', marginVertical: 4, color: 'green' },
  strategyContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
});

export default ChatScreen;
