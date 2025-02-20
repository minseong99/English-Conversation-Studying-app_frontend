// src/components/ChatVoiceScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { Buffer } from 'buffer';
if (!global.Buffer) global.Buffer = Buffer;

function base64ToBlob(base64: string, mime: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime });
}

const ChatVoiceScreen = () => {
  const route = useRoute();
  const { speaker } = route.params as { speaker: string };

  // 녹음 및 대화 관련 상태
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const [transcribedText, setTranscribedText] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [conversationHistory, setConversationHistory] = useState<{ sender: string, text: string }[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const myIp = '192.168.124.100';
  const sessionId = 'session123';
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      axios.delete(`http://${myIp}:3000/api/session/${sessionId}`)
        .then(() => console.log("Session cleared"))
        .catch((err) => console.error("Session clear error:", err));
    });
    return unsubscribe;
  }, [navigation, sessionId]);

  const toggleHistory = () => {
    setShowHistory(prev => !prev);
  };

  // STT 요청을 수행하는 헬퍼 함수 (에러 발생 시 모델 로딩 처리)
  const performSTT = async (base64Audio: string) => {
    try {
      const response = await axios.post(
        `http://${myIp}:3000/api/speech/stt`,
        { audio: base64Audio },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response;
    } catch (error: any) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.error &&
        error.response.data.error.includes('currently loading')
      ) {
        const estimatedTime = error.response.data.estimated_time || 20;
        setLoading(true);
        setLoadingMessage(`STT 모델이 로딩 중입니다. 약 ${estimatedTime}초 후에 재시도합니다.`);
        // estimatedTime 동안 대기 후 재시도
        await new Promise(resolve => setTimeout(resolve, estimatedTime * 1000));
        setLoading(false);
        setLoadingMessage('');
        // 재시도
        const retryResponse = await axios.post(
          `http://${myIp}:3000/api/speech/stt`,
          { audio: base64Audio },
          { headers: { 'Content-Type': 'application/json' } }
        );
        return retryResponse;
      } else {
        throw error;
      }
    }
  };

  // TTS 요청을 수행하는 헬퍼 함수 (에러 발생 시 모델 로딩 처리)
  const performTTS = async (text: string, speaker: string) => {
    try {
      const response = await axios.post(
        `http://${myIp}:3000/api/speech/tts`,
        { text, speaker },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response;
    } catch (error: any) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.error &&
        error.response.data.error.includes('currently loading')
      ) {
        const estimatedTime = error.response.data.estimated_time || 20;
        setLoading(true);
        setLoadingMessage(`TTS 모델이 로딩 중입니다. 약 ${estimatedTime}초 후에 재시도합니다.`);
        await new Promise(resolve => setTimeout(resolve, estimatedTime * 1000));
        setLoading(false);
        setLoadingMessage('');
        // 재시도
        const retryResponse = await axios.post(
          `http://${myIp}:3000/api/speech/tts`,
          { text, speaker },
          { headers: { 'Content-Type': 'application/json' } }
        );
        return retryResponse;
      } else {
        throw error;
      }
    }
  };

  // STT, Chat, TTS 순으로 요청을 처리하고 대화 내역을 업데이트
  const processAudioWithHistory = async (base64Audio: string) => {
    try {
      // 1. STT: 음성을 텍스트로 변환
      const sttResponse = await performSTT(base64Audio);
      const userText = sttResponse.data.text;
      setTranscribedText(userText);
      setConversationHistory(prev => [...prev, { sender: 'User', text: userText }]);

      // 2. Chat: 사용자 텍스트를 이용해 AI 응답 생성
      const chatResponse = await axios.post(
        `http://${myIp}:3000/api/chat`,
        { message: userText, strategy: 'default', sessionId },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const aiText = chatResponse.data.response;
      setAiResponseText(aiText);
      setConversationHistory(prev => [...prev, { sender: 'AI', text: aiText }]);

      // 3. TTS: AI 응답 텍스트를 음성으로 변환
      const ttsResponse = await performTTS(aiText, speaker);
      const audioBase64 = ttsResponse.data.audio;

      // 음성 재생 (웹/모바일 분기)
      if (Platform.OS === 'web') {
        const audioBlob = base64ToBlob(audioBase64, 'audio/wav');
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElem = new window.Audio(audioUrl);
        audioElem.play().then(() => {
          audioElem.onended = () => {
            URL.revokeObjectURL(audioUrl);
            console.log('Audio playback ended and URL revoked.');
          };
        }).catch(error => {
          console.error("Auto audio play error:", error);
        });
      } else {
        const audioUri = FileSystem.cacheDirectory + 'ttsAudio.wav';
        await FileSystem.writeAsStringAsync(audioUri, audioBase64, { encoding: FileSystem.EncodingType.Base64 });
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
        setSound(sound);
        await sound.playAsync();
      }
    } catch (error) {
      console.error('processAudioWithHistory 에러:', error);
    }
  };

  const processAudioHandler = async (base64Audio: string) => {
    await processAudioWithHistory(base64Audio);
  };

  // 모바일 녹음 시작
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

  // 모바일 녹음 중지 및 처리
  const stopRecordingMobileHandler = async () => {
    if (!recording) return;
    setLoading(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) {
        alert('녹음 파일을 찾을 수 없습니다.');
        return;
      }
      const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      await processAudioHandler(base64Audio);
    } catch (error) {
      console.error('모바일 녹음 처리 에러:', error);
    } finally {
      setLoading(false);
      setRecording(null);
    }
  };

  // 웹 녹음 시작 (MediaRecorder)
  const startRecordingWeb = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setAudioChunks([]); // 청크 초기화
      recorder.start(500); // 500ms 간격으로 청크 생성
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      recorder.onstop = () => {
        console.log('웹 녹음 종료됨, 청크 수:', audioChunks.length);
      };
      setMediaRecorder(recorder);
    } catch (error) {
      console.error('웹 녹음 시작 에러:', error);
    }
  };

  // 웹 녹음 중지 및 처리
  const stopRecordingWebHandler = async () => {
    if (!mediaRecorder) return;
    setLoading(true);
    try {
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => {
          console.log('MediaRecorder onstop 이벤트 발생');
          resolve();
        };
        mediaRecorder.stop();
      });
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      await processAudioHandler(base64Audio);
    } catch (error) {
      console.error('웹 녹음 처리 에러:', error);
    } finally {
      setLoading(false);
      setMediaRecorder(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>음성 대화하기</Text>
        {Platform.OS === 'web' ? (
          <View style={styles.buttonContainer}>
            <Button title="web voice start" onPress={startRecordingWeb} disabled={loading || mediaRecorder !== null} />
            <Button title="stop" onPress={stopRecordingWebHandler} disabled={loading || mediaRecorder === null} />
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            <Button title="mobile voice start" onPress={startRecordingMobile} disabled={loading || recording !== null} />
            <Button title="stop" onPress={stopRecordingMobileHandler} disabled={loading || recording === null} />
          </View>
        )}
        <Button title={showHistory ? "hide text" : "show text"} onPress={toggleHistory} />
        {showHistory && (
          <ScrollView style={styles.historyContainer}>
            {conversationHistory.map((msg, index) => (
              <Text key={index} style={styles.historyText}>
                {msg.sender}: {msg.text}
              </Text>
            ))}
          </ScrollView>
        )}
      </ScrollView>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>{loadingMessage || "모델 로딩 중입니다. 잠시만 기다려주세요..."}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', padding: 16, justifyContent: 'center' },
  title: { fontSize: 20, marginBottom: 20 },
  buttonContainer: { marginVertical: 20 },
  label: { marginTop: 20, fontWeight: 'bold' },
  text: { marginVertical: 10, fontSize: 16, textAlign: 'center' },
  historyContainer: { marginTop: 20, width: '100%', maxHeight: 200, borderWidth: 1, padding: 10 },
  historyText: { fontSize: 14, marginVertical: 2 },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
});

export default ChatVoiceScreen;

