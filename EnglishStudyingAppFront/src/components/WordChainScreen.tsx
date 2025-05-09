import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { useSession } from '../context/SessionContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

interface GameState {
  currentWord: string;
  hintCount: number;
  difficulty: string;
  score: number;
  streak: number;
}

interface VerifyResult {
  correct: boolean;
  newWord?: string;
  message: string;
  score?: number;
  streak?: number;
}

interface HintResult {
  hint: string;
  possibleWords?: string[];
  hintCount?: number;
}

const WordChainScreen = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [resultMessage, setResultMessage] = useState<string>('');
  const [hintMessage, setHintMessage] = useState<string>('');
  const [timer, setTimer] = useState<number>(30);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const API_BASE_URL = process.env.API_BASE_URL!;
  const { sessionId } = useSession();
  const navigation = useNavigation();

  const startGame = async () => {
    setGameOver(false);
    setResultMessage('');
    setHintMessage('');
    setTimer(30);
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/game/start`,
        { sessionId, difficulty: 'basic' },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const newState: GameState = response.data.gameState;
      console.log('게임 시작 응답:', newState);
      setGameState(newState);

      playTTS(newState.currentWord, 'ai');
      setLoading(false);
      resetTimer();
    } catch (error) {
      console.error('게임 시작 오류:', error);
      setLoading(false);
    }
  };


  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setResultMessage('시간 초과! 게임 종료.');
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };


  const playTTS = async (text: string, type: 'ai' | 'user') => {
    const defaultSpeaker = 'p225';
    try {
      const ttsResponse = await axios.post(
        `${API_BASE_URL}/api/speech/tts`,
        { text, speaker: defaultSpeaker },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const audioBase64 = ttsResponse.data.audio;
      if (Platform.OS === 'web') {
        const audioBlob = base64ToBlob(audioBase64, 'audio/wav');
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElem = new window.Audio(audioUrl);
        audioElem
          .play()
          .then(() => {
            audioElem.onended = () => {
              URL.revokeObjectURL(audioUrl);
              console.log('음성 재생 종료 및 URL 해제');
            };
          })
          .catch((error) => console.error('TTS 재생 오류:', error));
      } else {
        const audioUri = FileSystem.cacheDirectory + `${type}Audio.wav`;
        await FileSystem.writeAsStringAsync(audioUri, audioBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
        await sound.playAsync();
      }
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
          `TTS 모델 로딩 중입니다. 약 ${estimatedTime}초 후 재시도합니다.`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, estimatedTime * 1000)
        );
        setLoading(false);
        setLoadingMessage('');
        const retryResponse = await axios.post(
          `${API_BASE_URL}/api/speech/tts`,
          { text, speaker: defaultSpeaker },
          { headers: { 'Content-Type': 'application/json' } }
        );
        return retryResponse;
      } else {
        throw error;
      }
    }
  };


  function base64ToBlob(base64: string, mime: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  }


  const handleSubmit = async () => {
    if (!gameState) return;
    if (userAnswer.trim() === '') {
      setResultMessage('단어를 입력하세요.');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/game/verify`,
        { sessionId, answer: userAnswer },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const result: VerifyResult = response.data;
      console.log('답변 검증 결과:', result);
      if (!result.correct) {
        setResultMessage(result.message + `\n최종 점수: ${gameState.score}`);
        setGameOver(true);
      } else {
        if (result.newWord) {
          setGameState({
            ...gameState,
            currentWord: result.newWord,
            score: result.score || gameState.score,
            streak: result.streak || gameState.streak,
            hintCount: 0,
          });
          playTTS(result.newWord, 'ai');
        }
        setResultMessage(result.message);
        setUserAnswer('');
        setTimer(30);
        resetTimer();
      }
      setLoading(false);
    } catch (error) {
      console.error('답변 제출 오류:', error);
      setLoading(false);
    }
  };


  const handleHint = async () => {
    if (!gameState) return;
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/game/hint`,
        { sessionId },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const hintResult: HintResult = response.data;
      console.log('힌트 결과:', hintResult);
      setHintMessage(hintResult.hint);
      setLoading(false);
    } catch (error) {
      console.error('힌트 요청 오류:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    startGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pageContainer}>
        <View style={styles.card}>
          <Text style={styles.timerLabel}>
            남은 시간: <Text style={styles.timerValue}>{timer}초</Text>
          </Text>

          {gameState && (
            <View style={styles.wordContainer}>
              <Text style={styles.wordLabel}>현재 단어:</Text>
              <Text style={styles.wordText}>{gameState.currentWord}</Text>
            </View>
          )}

          <TextInput
            style={styles.input}
            value={userAnswer}
            onChangeText={setUserAnswer}
            placeholder="단어를 입력하세요"
            placeholderTextColor="#999"
            editable={!gameOver}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={gameOver || loading}>
              <Text style={styles.buttonText}>정답 제출</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.hintButton}
              onPress={handleHint}
              disabled={gameOver || loading}>
              <Text style={styles.buttonText}>
                힌트 ({3 - (gameState?.hintCount || 0)}회 남음)
              </Text>
            </TouchableOpacity>
          </View>

          {hintMessage !== '' && (
            <View style={styles.messageBox}>
              <Text style={styles.hintText}>{hintMessage}</Text>
            </View>
          )}

          {resultMessage !== '' && (
            <View style={styles.messageBox}>
              <Text style={styles.resultText}>{resultMessage}</Text>
            </View>
          )}

          {gameOver && (
            <View style={styles.finalScore}>
              <Text style={styles.finalScoreText}>
                최종 점수: {gameState?.score}
              </Text>
              <TouchableOpacity
                style={styles.restartButton}
                onPress={startGame}
                disabled={loading}>
                <Text style={styles.buttonText}>게임 재시작</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.bottomTab}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => navigation.navigate('MainMenu')}>
          <Icon name="home" size={24} color="#9EA0A5" />
          <Text style={styles.tabTextInactive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => navigation.navigate('SpeakerSelection')}>
          <Icon name="mic" size={24} color="#9EA0A5" />
          <Text style={styles.tabTextInactive}>Voice</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => navigation.navigate('ChatText')}>
          <Icon name="chatbubble" size={24} color="#9EA0A5" />
          <Text style={styles.tabTextInactive}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton}>
          <Icon name="game-controller" size={24} color="#6B77F8" />
          <Text style={styles.tabText}>Games</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>
            {loadingMessage || '로딩 중...'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B77F8',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginRight: 24, 
  },
  pageContainer: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500, 
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5, 
  },

  timerLabel: {
    fontSize: 18,
    marginBottom: 20,
    color: '#333',
    alignSelf: 'center',
    textAlign: 'center',
  },

  timerValue: {
    color: '#FF5252',
    fontWeight: 'bold',
  },

  wordContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },

  wordLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },

  wordText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6B77F8',
    letterSpacing: 1,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E9F0',
    width: '100%',
    padding: 16,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    fontSize: 16,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },

  submitButton: {
    backgroundColor: '#6B77F8',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },

  hintButton: {
    backgroundColor: '#6B77F8',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  messageBox: {
    backgroundColor: '#F7F9FC',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    marginTop: 10,
  },

  hintText: {
    fontSize: 16,
    color: '#555',
  },

  resultText: {
    fontSize: 16,
    color: '#E53935',
  },

  finalScore: {
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },

  finalScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },

  restartButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },

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

  bottomTab: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
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

export default WordChainScreen;
