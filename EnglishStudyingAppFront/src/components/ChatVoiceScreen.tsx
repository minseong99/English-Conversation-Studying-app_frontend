// src/components/ChatVoiceScreen.tsx
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import axios from 'axios';
import { Buffer } from 'buffer';
if (!global.Buffer) global.Buffer = Buffer;

// 웹에서 파일 업로드를 위한 React import
import ReactDOM from 'react-dom';

const ChatVoiceScreen = () => {
  // 모바일용 녹음 상태
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  // 웹용 업로드한 오디오 파일의 base64 문자열 (녹음 기능 미지원 시 사용)
  const [webAudio, setWebAudio] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // 모바일: 녹음 시작
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

  // 모바일: 녹음 중지 후 처리 (STT → Chat → TTS)
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
      // 녹음 파일을 base64 문자열로 변환
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await processAudio(base64Audio);
    } catch (error) {
      console.error('모바일 음성 처리 에러:', error);
    } finally {
      setLoading(false);
      setRecording(null);
    }
  };

  // 웹: 파일 업로드 처리
  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        // FileReader 결과는 data URL 형식으로 반환되므로, 콤마 이후 부분을 추출
        const result = reader.result as string;
        const base64String = result.split(',')[1];
        setWebAudio(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // 웹: 업로드된 오디오를 처리 (STT → Chat → TTS)
  const processWebAudio = async () => {
    if (!webAudio) {
      alert('먼저 오디오 파일을 선택하세요.');
      return;
    }
    setLoading(true);
    try {
      await processAudio(webAudio);
    } catch (error) {
      console.error('웹 음성 처리 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  // 공통 처리 로직: STT → Chat → TTS 순으로 처리
  const processAudio = async (base64Audio: string) => {
    try {
      // 1. STT: 음성을 텍스트로 변환 (백엔드 STT 엔드포인트 호출)
      const sttResponse = await axios.post(
        'http://YOUR_PC_IP:3000/api/speech/stt',
        { audio: base64Audio },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const userText = sttResponse.data.text;
      setTranscribedText(userText);

      // 2. Chat: 변환된 텍스트를 이용하여 AI 응답 생성 (백엔드 Chat 엔드포인트 호출)
      const chatResponse = await axios.post(
        'http://YOUR_PC_IP:3000/api/chat',
        { message: userText, strategy: 'default', sessionId: 'session123' },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const aiText = chatResponse.data.response;
      setAiResponseText(aiText);

      // 3. TTS: AI 응답 텍스트를 음성으로 변환 (백엔드 TTS 엔드포인트 호출)
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
      // 임시 파일에 저장 (파일 형식은 TTS 모델 출력 포맷에 맞게 조정)
      const audioUri = FileSystem.cacheDirectory + 'ttsAudio.wav';
      await FileSystem.writeAsStringAsync(audioUri, audioBase64, { encoding: FileSystem.EncodingType.Base64 });

      // 오디오 파일을 로드 및 재생
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('processAudio 에러:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI와 자연스러운 음성 대화하기</Text>
      
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      
      {Platform.OS === 'web' ? (
        // 웹: 파일 업로드 UI
        <View style={styles.webContainer}>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileInput}
            style={styles.fileInput}
          />
          <Button title="선택된 오디오 처리" onPress={processWebAudio} disabled={loading || !webAudio} />
        </View>
      ) : (
        // 모바일: 녹음 UI
        <View style={styles.mobileContainer}>
          <Button title="녹음 시작" onPress={startRecording} disabled={loading || recording !== null} />
          <Button title="녹음 중지 및 처리" onPress={stopAndProcessRecording} disabled={loading || !recording} />
        </View>
      )}
      
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
  },
  mobileContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  webContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  fileInput: {
    marginVertical: 10,
  },
});

export default ChatVoiceScreen;
