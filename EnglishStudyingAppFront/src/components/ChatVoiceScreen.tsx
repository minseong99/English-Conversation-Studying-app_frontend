import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import { Buffer } from 'buffer';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { speaker } = route.params as { speaker: string };

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const [transcribedText, setTranscribedText] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [conversationHistory, setConversationHistory] = useState<
    { sender: string; text: string }[]
  >([]);
  const [showHistory, setShowHistory] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const { sessionId } = useSession(); // sessionId 가져오기
  // const myIp = Constants.manifest?.extra?.myIp || '192.168.219.103';
  const API_BASE_URL = process.env.API_BASE_URL!;

  const navigation = useNavigation();
  const [isRecording, setIsRecording] = useState(false);
  const [showText, setShowText] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      axios
        .delete(`${API_BASE_URL}/api/session/${sessionId}`)
        .then(() => console.log('Session cleared'))
        .catch((err) => console.error('Session clear error:', err));
    });
    return unsubscribe;
  }, [navigation, sessionId]);

  const toggleHistory = () => {
    setShowHistory((prev) => !prev);
  };

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
        setLoadingMessage(
          `STT 모델이 로딩 중입니다. 약 ${estimatedTime}초 후에 재시도합니다.`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, estimatedTime * 1000)
        );
        setLoading(false);
        setLoadingMessage('');
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
        setLoadingMessage(
          `TTS 모델이 로딩 중입니다. 약 ${estimatedTime}초 후에 재시도합니다.`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, estimatedTime * 1000)
        );
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

  const processAudioWithHistory = async (base64Audio: string) => {
    try {
      const sttResponse = await performSTT(base64Audio);
      const userText = sttResponse.data.text;
      setTranscribedText(userText);
      setConversationHistory((prev) => [
        ...prev,
        { sender: 'User', text: userText },
      ]);

      const chatResponse = await axios.post(
        `${API_BASE_URL}/api/chat`,
        { message: userText, strategy: 'default', sessionId },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const aiText = chatResponse.data.response;
      setAiResponseText(aiText);
      setConversationHistory((prev) => [
        ...prev,
        { sender: 'AI', text: aiText },
      ]);

      const ttsResponse = await performTTS(aiText, speaker);
      const audioBase64 = ttsResponse.data.audio;

      if (Platform.OS === 'web') {
        const audioBlob = base64ToBlob(audioBase64, 'audio/wav');
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElem = new window.Audio(audioUrl);

        audioElem.onplay = () => {
          setIsSpeaking(true);
        };

        audioElem
          .play()
          .then(() => {
            audioElem.onended = () => {
              setIsSpeaking(false);
              URL.revokeObjectURL(audioUrl);
              console.log('Audio playback ended and URL revoked.');
            };
          })
          .catch((error) => {
            console.error('Auto audio play error:', error);
            setIsSpeaking(false);
          });
      } else {
        const audioUri = FileSystem.cacheDirectory + 'ttsAudio.wav';
        await FileSystem.writeAsStringAsync(audioUri, audioBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
        setSound(sound);

        setIsSpeaking(true);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
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
  
      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
          sampleRate: 16000,
          numberOfChannels: 1,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
          sampleRate: 16000,
          numberOfChannels: 1,
          format: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      };
  
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
    } catch (error) {
      console.error('모바일 녹음 시작 에러:', error);
    }
  };
  
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
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await processAudioHandler(base64Audio);
    } catch (error) {
      console.error('모바일 녹음 처리 에러:', error);
    } finally {
      setLoading(false);
      setRecording(null);
    }
  };

  const startRecordingWeb = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setAudioChunks([]);
      recorder.start(500);
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
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

  const handleMicPress = async () => {
    if (isRecording) {
      setIsRecording(false);
      if (Platform.OS === 'web') {
        await stopRecordingWebHandler();
      } else {
        await stopRecordingMobileHandler();
      }
    } else {
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
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.messageContainer}>
        {conversationHistory.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageWrapper,
              msg.sender === 'User'
                ? styles.userMessageWrapper
                : styles.botMessageWrapper,
            ]}>
            {msg.sender === 'AI' && (
              <View style={styles.botAvatarContainer}>
                <Icon name="volume-high" size={20} color="#6B77F8" />
                <Text>{msg.text}</Text>
              </View>
            )}

            {showText && (
              <View
                style={[
                  styles.messageBox,
                  msg.sender === 'User'
                    ? styles.userMessage
                    : styles.botMessage,
                ]}>
                <Text
                  style={[
                    styles.messageText,
                    msg.sender === 'User'
                      ? styles.userMessageText
                      : styles.botMessageText,
                  ]}>
                  {msg.text}
                </Text>
              </View>
            )}

            {msg.sender === 'User' && (
              <View style={styles.userAvatarContainer}>
                <Icon name="mic" size={16} color="#FFFFFF" />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View
        style={[
          styles.inputContainer,
          { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 10 },
        ]}>
        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.micButtonActive]}
          onPress={handleMicPress}>
          <Icon
            name={isRecording ? 'stop-circle' : 'mic'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.micText}>
            {isRecording ? '녹음 중지' : '말하기'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.showToggleButton}
        onPress={() => setShowText(!showText)}>
        <Text style={styles.showToggleText}>
          {showText ? '대화 숨기기' : '대화 표시'}
        </Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>
            {loadingMessage || 'Wait for loading model'}
          </Text>
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
  // 메시지 컨테이너 스타일
  messageContainer: {
    flex: 1,
    padding: 20,
  },
  messageWrapper: {
    width: '100%',
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  botMessageWrapper: {
    justifyContent: 'flex-start',
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
  // 스피커 아이콘 컨테이너
  botAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 마이크 아이콘 컨테이너
  userAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 10,
    backgroundColor: '#6B77F8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 입력(마이크) 컨테이너
  inputContainer: {
    paddingTop: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  micButton: {
    flexDirection: 'row',
    backgroundColor: '#6B77F8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  micText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  micButtonActive: {
    backgroundColor: '#FF5252',
  },
  // 대화 표시/숨기기 버튼
  showToggleButton: {
    position: 'absolute',
    bottom: 170,
    right: 10,
    backgroundColor: '#6B77F8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    zIndex: 10,
  },
  // 대화 표시/숨기기 버튼 텍스트
  showToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  // 로딩 오버레이
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
