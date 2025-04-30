// src/components/ChatVoiceScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Platform, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import { Buffer } from 'buffer';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/Ionicons';

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

  const { sessionId } = useSession(); // sessionId 가져오기
  // const myIp = Constants.manifest?.extra?.myIp || '192.168.124.100';
  const API_BASE_URL = process.env.API_BASE_URL!;
  
  const navigation = useNavigation();
  const [isRecording, setIsRecording] = useState(false);
  const [showText, setShowText] = useState(false);

  // 스피커 버튼 상태
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      axios.delete(`${API_BASE_URL}/api/session/${sessionId}`)
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
        `${API_BASE_URL}/api/speech/stt`,
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
          `${API_BASE_URL}/api/speech/stt`,
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
        `${API_BASE_URL}/api/speech/tts`,
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
          `${API_BASE_URL}/api/speech/tts`,
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
        `${API_BASE_URL}/api/chat`,
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

        // 재생 시작 시 스피커 활성화
        audioElem.onplay = () => {
          setIsSpeaking(true);
        };

        audioElem.play().then(() => {
          audioElem.onended = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            console.log('Audio playback ended and URL revoked.');
          };
        }).catch(error => {
          console.error("Auto audio play error:", error);
          setIsSpeaking(false);
        });
      } else {
        const audioUri = FileSystem.cacheDirectory + 'ttsAudio.wav';
        await FileSystem.writeAsStringAsync(audioUri, audioBase64, { encoding: FileSystem.EncodingType.Base64 });
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
        setSound(sound);

        // 재생 시작 시 스피커 활성화
        setIsSpeaking(true);

        // onPlaybackStatusUpdate 리스너 추가
        sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
            // 재생 종료 시 스피커 비활성화
            setIsSpeaking(false);
          }
        });
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


  // 마이크 버튼 클릭 핸들러 
  const handleMicPress = async () => {
    
    if(isRecording){ // 녹음중이면 
       // 녹음 중지
       setIsRecording(false);
       if (Platform.OS === 'web') {
        await stopRecordingWebHandler();
      } else {
        await stopRecordingMobileHandler();
      }
    }else { // 녹음중이 아니면
      // 녹음 시작
      setIsRecording(true);
      if (Platform.OS === 'web') {
        await startRecordingWeb();
      } else {
        await startRecordingMobile();
      }
    }
  };

  
  useEffect(() => {
    setIsRecording(isSpeaking);
  }, [isSpeaking]);

  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 sound 객체 정리
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  return (
    <SafeAreaView style={styles.container}>
  

      <View style={styles.content}>
        <View style={styles.speakerContainer}>
          <View 
            style={styles.speakerButton}>
            <Icon 
              name="volume-high" 
              size={120} 
              color={isSpeaking ? "#6B77F8" : "#9EA0A5"}
            />
          </View>
        </View>

        <View style={styles.microphoneContainer}>
          <TouchableOpacity 
            style={styles.micButton}
            onPress={handleMicPress}
          >
            <Icon 
              name={isRecording ? "mic" : "mic-off"} 
              size={80} 
              color={isRecording ? "#6B77F8" : "#666666"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.chatSection}>
          <View style={styles.chatHeader}>
            
            <TouchableOpacity 
              style={[styles.showButton, showText && styles.hideButton]}
              onPress={() => setShowText(!showText)}
            >
              <Text style={styles.showButtonText}>
                {showText ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          {showText && (
            <ScrollView style={styles.chatContainer}>
              {conversationHistory.map((msg, index) => (
                <Text key={index} style={styles.chatText}>
                  {msg.sender}: {msg.text}
                </Text>
              ))}
            </ScrollView>
          )}
        </View>
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
          <Icon name="mic" size={24} color="#6B77F8" />
          <Text style={styles.tabText}>Voice</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('ChatText')}
        >
          <Icon name="chatbubble" size={24} color="#9EA0A5" />
          <Text style={styles.tabTextInactive}>Chat</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>{loadingMessage || "Wait for loading model"}</Text>
        </View>
      )}
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  speakerContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  speakerButton: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    backgroundColor: '#F5F5F5',
  },
  microphoneContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  micButton: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 75,
    backgroundColor: '#F5F5F5',
  },
  chatSection: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chatLabel: {
    fontSize: 16,
    color: '#333333',
  },
  showButton: {
    backgroundColor: '#6B77F8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  hideButton: {
    backgroundColor: '#4CAF50', // Hide 상태일 때 초록색으로 변경
  },
  showButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  chatContainer: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 15,
  },
  chatText: {
    fontSize: 16,
    marginVertical: 5,
    color: '#333333',
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

