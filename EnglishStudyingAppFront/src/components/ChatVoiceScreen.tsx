// src/components/ChatVoiceScreen.tsx
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import axios from 'axios';

// 주의: Buffer를 사용하기 위해 'buffer' 패키지가 필요할 수 있습니다.
// expo에서는 global.Buffer가 정의되어 있지 않으면, import { Buffer } from 'buffer'; 하고 global.Buffer = Buffer; 해줄 수 있습니다.
import { Buffer } from 'buffer';
if (!global.Buffer) global.Buffer = Buffer;

const ChatVoiceScreen = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // 1. 사용자의 음성을 녹음 시작
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        alert('녹음 권한이 필요합니다.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
    } catch (error) {
      console.error('녹음 시작 에러:', error);
    }
  };

  // 2. 녹음 중지 및 녹음 파일을 처리하여 STT, Chat, TTS 순차 처리
  const stopAndProcessRecording = async () => {
    if (!recording) return;
    setLoading(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) {
        alert('녹음 파일을 찾을 수 없습니다.');
        return;
      }
      // 녹음 파일을 base64 문자열로 변환 (STT에 전송)
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // 2-1. STT: 녹음된 음성을 텍스트로 변환 (백엔드 STT 엔드포인트 호출)
      const sttResponse = await axios.post(
        'http://YOUR_PC_IP:3000/api/speech/stt',
        { audio: base64Audio },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const userText = sttResponse.data.text;
      setTranscribedText(userText);

      // 2-2. Chat: 변환된 텍스트를 이용하여 AI 응답(텍스트) 생성 (백엔드 Chat 엔드포인트 호출)
      const chatResponse = await axios.post(
        'http://YOUR_PC_IP:3000/api/chat',
        { message: userText, strategy: 'default', sessionId: 'session123' },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const aiText = chatResponse.data.response;
      setAiResponseText(aiText);

      // 2-3. TTS: AI 응답 텍스트를 음성으로 변환 (백엔드 TTS 엔드포인트 호출)
      const ttsResponse = await axios.post(
        'http://YOUR_PC_IP:3000/api/speech/tts',
        { text: aiText },
        {
          headers: { 'Content-Type': 'application/json' },
          responseType: 'arraybuffer', // 바이너리 데이터를 받기 위함
        }
      );
      // 받은 바이너리 데이터를 base64 문자열로 변환
      const audioBase64 = Buffer.from(ttsResponse.data, 'binary').toString('base64');

      // TTS 결과 오디오를 임시 파일로 저장 (예: .wav 파일, TTS 출력 포맷에 맞게 확장자 조정)
      const audioUri = FileSystem.cacheDirectory + 'ttsAudio.wav';
      await FileSystem.writeAsStringAsync(audioUri, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Expo Audio를 사용하여 오디오 파일을 로드하고 재생
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      setSound(sound);
      await sound.playAsync();

    } catch (error) {
      console.error('음성 대화 처리 에러:', error);
    } finally {
      setLoading(false);
      setRecording(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI와 자연스러운 음성 대화하기</Text>
      <Button title="녹음 시작" onPress={startRecording} />
      <Button title="녹음 중지 및 처리" onPress={stopAndProcessRecording} disabled={!recording || loading} />
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      <Text style={styles.label}>내 음성 (STT 결과):</Text>
      <Text style={styles.text}>{transcribedText}</Text>
      <Text style={styles.label}>AI 응답 (텍스트):</Text>
      <Text style={styles.text}>{aiResponseText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    alignItems: 'center', 
    padding: 16, 
    justifyContent: 'center'
  },
  title: {
    fontSize: 20, 
    marginBottom: 20
  },
  label: {
    marginTop: 20,
    fontWeight: 'bold'
  },
  text: {
    marginVertical: 10,
    fontSize: 16,
    textAlign: 'center'
  }
});

export default ChatVoiceScreen;
