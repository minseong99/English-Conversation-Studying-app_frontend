// src/components/ChatVoiceScreen.tsx
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { Buffer } from 'buffer';
if (!global.Buffer) global.Buffer = Buffer;

const ChatVoiceScreen = () => {
  // 모바일용 녹음 (Expo Audio)
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  // 웹용 MediaRecorder와 녹음 데이터 저장
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // 공통: STT, Chat, TTS 처리 함수
  const processAudio = async (base64Audio: string) => {
    try {
      // 1. STT: 음성을 텍스트로 변환
      const sttResponse = await axios.post(
        'http://192.168.124.100:3000/api/speech/stt',
        { audio: base64Audio },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const userText = sttResponse.data.text;
      setTranscribedText(userText);

      // 2. Chat: 사용자 텍스트를 AI 응답 텍스트로 변환
      const chatResponse = await axios.post(
        'http://192.168.124.100:3000/api/chat',
        { message: userText, strategy: 'default', sessionId: 'session123' },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const aiText = chatResponse.data.response;
      setAiResponseText(aiText);

      // 3. TTS: AI 응답 텍스트를 음성으로 변환
      const ttsResponse = await axios.post(
        'http://192.168.124.100:3000/api/speech/tts',
        { text: aiText },
        {
          headers: { 'Content-Type': 'application/json' },
          responseType: 'arraybuffer',
        }
      );
      // 변환된 바이너리 데이터를 base64 문자열로 변환
      const audioBase64 = Buffer.from(ttsResponse.data, 'binary').toString('base64');
      // 임시 파일 경로 (TTS 모델 출력 형식에 따라 확장자 조정)
      const audioUri = FileSystem.cacheDirectory + 'ttsAudio.wav';
      await FileSystem.writeAsStringAsync(audioUri, audioBase64, { encoding: FileSystem.EncodingType.Base64 });
      
      // 오디오 재생
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('processAudio 에러:', error);
    }
  };

  // 모바일: 녹음 시작 (Expo Audio)
  const startRecordingMobile = async () => {
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
      const { recording } = await Audio.Recording.createAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      setRecording(recording);
    } catch (error) {
      console.error('모바일 녹음 시작 에러:', error);
    }
  };

  // 모바일: 녹음 중지 후 처리
  const stopRecordingMobile = async () => {
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
      console.error('모바일 녹음 처리 에러:', error);
    } finally {
      setLoading(false);
      setRecording(null);
    }
  };

// 웹: 녹음 시작 (MediaRecorder 사용)
const startRecordingWeb = async () => {
  try {
    // 마이크 사용 권한 요청
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    setAudioChunks([]); // 기존 청크 초기화
    
    // 일정 간격(예: 1000ms)마다 데이터 청크를 수집하도록 지정
    recorder.start(500);
    
    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        setAudioChunks((prev) => [...prev, event.data]);
      }
    };

    // 녹음이 종료되었을 때 처리할 onstop 이벤트 (추가로 확인용)
    recorder.onstop = () => {
      console.log('녹음이 종료되었습니다. 수집된 청크 수:', audioChunks.length);
    };

    setMediaRecorder(recorder);
  } catch (error) {
    console.error('웹 녹음 시작 에러:', error);
  }
};

// 웹: 녹음 중지 후 처리
const stopRecordingWeb = async () => {
  if (!mediaRecorder) return;
  setLoading(true);
  try {
    // 녹음 중지를 하고 onstop 이벤트가 발생할 때까지 대기
    await new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder onstop 이벤트 발생');
        resolve();
      };
      mediaRecorder.stop();
    });

    // 수집된 청크들을 Blob으로 합침
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    console.log('생성된 Blob 크기:', blob.size);
    
    // FileReader를 사용해 Blob을 data URL로 변환하고 base64 부분만 추출
    const base64Audio = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // data URL 형식에서 콤마 이후의 부분만 추출
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    console.log('생성된 base64 문자열 길이:', base64Audio.length);
    await processAudio(base64Audio);
  } catch (error) {
    console.error('웹 녹음 처리 에러:', error);
  } finally {
    setLoading(false);
    setMediaRecorder(null);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI와 자연스러운 음성 대화하기</Text>
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {Platform.OS === 'web' ? (
        <View style={styles.buttonContainer}>
          <Button title="웹 녹음 시작" onPress={startRecordingWeb} disabled={loading || mediaRecorder !== null} />
          <Button title="웹 녹음 중지 및 처리" onPress={stopRecordingWeb} disabled={loading || mediaRecorder === null} />
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <Button title="모바일 녹음 시작" onPress={startRecordingMobile} disabled={loading || recording !== null} />
          <Button title="모바일 녹음 중지 및 처리" onPress={stopRecordingMobile} disabled={loading || recording === null} />
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
  container: { flex: 1, alignItems: 'center', padding: 16, justifyContent: 'center' },
  title: { fontSize: 20, marginBottom: 20 },
  buttonContainer: { marginVertical: 20 },
  label: { marginTop: 20, fontWeight: 'bold' },
  text: { marginVertical: 10, fontSize: 16, textAlign: 'center' },
});

export default ChatVoiceScreen;
