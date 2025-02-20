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
  const { speaker } = route.params as { speaker: string }; // 선택한 화자 정보

  // 녹음 관련 상태
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const [loading, setLoading] = useState(false);

  // 대화 내역 및 단일 메시지 상태
  const [transcribedText, setTranscribedText] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [conversationHistory, setConversationHistory] = useState<{ sender: string, text: string }[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  // 모바일 재생용 상태
  const [sound, setSound] = useState<Audio.Sound | null>(null);


  const myIp = '192.168.124.100';
  const sessionId = 'session123';
  // 화면 언마운트(뒤로가기) 시 세션 삭제 API 호출
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      axios.delete(`http://${myIp}:3000/api/session/${sessionId}`)
        .then(() => console.log("Session cleared"))
        .catch((err) => console.error("Session clear error:", err));
    });
    return unsubscribe;
  }, [navigation, sessionId]);


  // 토글 버튼 핸들러: 대화 내역 보이기/숨기기
  const toggleHistory = () => {
    setShowHistory(prev => !prev);
  };

  // 공통 처리 함수: STT, Chat, TTS 및 대화 내역 업데이트
  const processAudioWithHistory = async (base64Audio: string) => {
    try {
      // 1. STT: 음성을 텍스트로 변환
      const sttResponse = await axios.post(
        'http://192.168.124.100:3000/api/speech/stt',
        { audio: base64Audio },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const userText = sttResponse.data.text;
      setTranscribedText(userText);
      setConversationHistory(prev => [...prev, { sender: 'User', text: userText }]);

      // 2. Chat: 사용자 텍스트를 이용해 AI 응답 생성
      const chatResponse = await axios.post(
        'http://192.168.124.100:3000/api/chat',
        { message: userText, strategy: 'default', sessionId: sessionId },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const aiText = chatResponse.data.response;
      setAiResponseText(aiText);
      setConversationHistory(prev => [...prev, { sender: 'AI', text: aiText }]);

      // 3. TTS: AI 응답 텍스트를 음성으로 변환
      const ttsResponse = await axios.post(
        'http://192.168.124.100:3000/api/speech/tts',
        { text: aiText, speaker},
        { headers: { 'Content-Type': 'application/json' }}
      );
      const audioBase64 = ttsResponse.data.audio;


      
      if (Platform.OS === 'web') {
        // 웹: base64 -> Blob -> Object URL -> 자동 재생
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
        // 모바일: 임시 파일에 저장 후 Expo Audio 재생
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
      console.log('생성된 Blob 크기:', blob.size);
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      console.log('생성된 base64 문자열 길이:', base64Audio.length);
      await processAudioHandler(base64Audio);
    } catch (error) {
      console.error('웹 녹음 처리 에러:', error);
    } finally {
      setLoading(false);
      setMediaRecorder(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>음성 대화하기</Text>
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
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
});

export default ChatVoiceScreen;

