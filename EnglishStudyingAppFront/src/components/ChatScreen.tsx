// src/components/ChatScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';
import axios from 'axios';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const ChatScreen = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [strategy, setStrategy] = useState<'default' | 'casual'>('default');

  const sendMessage = async () => {
    if (!input) return;
    const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await axios.post('http://localhost:3000/api/chat', {
        message: input,
        strategy,      // 발음 전략 선택값 전달
        sessionId: 'session123',  // 예시 세션 ID (실제 앱에서는 고유값 사용)
      });
      const botMessage: Message = {
        id: Date.now() + 1,
        text: response.data.pronouncedText,
        sender: 'bot',
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('메시지 전송 에러: ', error);
    }
    setInput('');
  };

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
          placeholder="메시지 입력"
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
      <View style={styles.strategyContainer}>
        <Button title="Default" onPress={() => setStrategy('default')} />
        <Button title="Casual" onPress={() => setStrategy('casual')} />
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
