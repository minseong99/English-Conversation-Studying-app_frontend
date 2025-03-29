
// src/screens/WordChainScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Button, ActivityIndicator, ScrollView, Platform  } from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { useSession } from '../context/SessionContext';

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
  const myIp = Constants.manifest?.extra?.myIp || '192.168.124.100';
  const { sessionId } = useSession();

  // 게임 시작: 백엔드 /api/game/start 호출
  const startGame = async () => {
    setGameOver(false);
    setResultMessage('');
    setHintMessage('');
    setTimer(30);
    try {
      setLoading(true);
      const response = await axios.post(
        `http://${myIp}:3000/api/game/start`,
        { sessionId, difficulty: 'basic' },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const newState: GameState = response.data.gameState;
      console.log("게임 시작 응답:", newState);
      setGameState(newState);
      // AI 단어 TTS 재생 (예: playTTS(newState.currentWord, 'ai')) – 여전히 동일한 함수 호출
      playTTS(newState.currentWord, 'ai');
      setLoading(false);
      resetTimer();
    } catch (error) {
      console.error("게임 시작 오류:", error);
      setLoading(false);
    }
  };

  // 타이머 초기화 및 시작
  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
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

  // TTS 재생 함수 (기존 구현 그대로)
  const playTTS = async (text: string, type: 'ai' | 'user') => {
    const defaultSpeaker = 'p225';
    try {
        const ttsResponse = await axios.post(
        `http://${myIp}:3000/api/speech/tts`,
        { text, speaker: defaultSpeaker },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const audioBase64 = ttsResponse.data.audio;
      if (Platform.OS === 'web') {
        const audioBlob = base64ToBlob(audioBase64, 'audio/wav');
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElem = new window.Audio(audioUrl);
        audioElem.play().then(() => {
          audioElem.onended = () => {
            URL.revokeObjectURL(audioUrl);
            console.log('음성 재생 종료 및 URL 해제');
          };
        }).catch(error => console.error("TTS 재생 오류:", error));
      } else {
        const audioUri = FileSystem.cacheDirectory + `${type}Audio.wav`;
        await FileSystem.writeAsStringAsync(audioUri, audioBase64, { encoding: FileSystem.EncodingType.Base64 });
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
        setLoadingMessage(`TTS 모델 로딩 중입니다. 약 ${estimatedTime}초 후 재시도합니다.`);
        await new Promise(resolve => setTimeout(resolve, estimatedTime * 1000));
        setLoading(false);
        setLoadingMessage('');
        const retryResponse = await axios.post(
          `http://${myIp}:3000/api/speech/tts`,
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

  // 사용자의 답변 제출: 백엔드 /api/game/verify 호출
  const handleSubmit = async () => {
    if (!gameState) return;
    if (userAnswer.trim() === '') {
      setResultMessage('단어를 입력하세요.');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(
        `http://${myIp}:3000/api/game/verify`,
        { sessionId, answer: userAnswer },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const result: VerifyResult = response.data;
      console.log("답변 검증 결과:", result);
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
            hintCount: 0 
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
      console.error("답변 제출 오류:", error);
      setLoading(false);
    }
  };

  // 힌트 요청: 백엔드 /api/game/hint 호출
  const handleHint = async () => {
    if (!gameState) return;
    try {
      setLoading(true);
      const response = await axios.post(
        `http://${myIp}:3000/api/game/hint`,
        { sessionId },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const hintResult: HintResult = response.data;
      console.log("힌트 결과:", hintResult);
      setHintMessage(hintResult.hint);
      setLoading(false);
    } catch (error) {
      console.error("힌트 요청 오류:", error);
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
    <View style={styles.container}>
      <Text style={styles.timerText}>남은 시간: {timer}초</Text>
      {gameState && (
        <Text style={styles.wordText}>현재 단어: {gameState.currentWord}</Text>
      )}
      <TextInput
        style={styles.input}
        value={userAnswer}
        onChangeText={setUserAnswer}
        placeholder="단어를 입력하세요"
        editable={!gameOver}
      />
      <View style={styles.buttonRow}>
        <Button title="정답 제출" onPress={handleSubmit} disabled={gameOver || loading} />
        <Button title={`힌트 (${3 - (gameState?.hintCount || 0)}회 남음)`} onPress={handleHint} disabled={gameOver || loading} />
      </View>
      {hintMessage !== '' && <Text style={styles.hintText}>{hintMessage}</Text>}
      {resultMessage !== '' && <Text style={styles.resultText}>{resultMessage}</Text>}
      {gameOver && (
        <View style={styles.finalScore}>
          <Text style={styles.finalScoreText}>최종 점수: {gameState?.score}</Text>
          <Button title="게임 재시작" onPress={startGame} disabled={loading} />
        </View>
      )}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>{loadingMessage || "로딩 중..."}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16, alignItems: 'center', justifyContent: 'center' },
  timerText: { fontSize: 20, marginBottom: 10, color: '#333' },
  wordText: { fontSize: 28, marginVertical: 10, color: '#4A90E2' },
  input: { borderWidth: 1, borderColor: '#ccc', width: '80%', padding: 10, marginVertical: 10, borderRadius: 8, backgroundColor: '#FFF' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '80%', marginVertical: 10 },
  hintText: { fontSize: 18, color: 'gray', marginVertical: 10 },
  resultText: { fontSize: 20, color: 'red', marginVertical: 10 },
  finalScore: { alignItems: 'center', marginVertical: 20 },
  finalScoreText: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: { marginTop: 10, color: '#fff', fontSize: 16 },
});

export default WordChainScreen;