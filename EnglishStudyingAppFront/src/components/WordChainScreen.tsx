// src/components/WordChainScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Platform, TextInput } from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

interface WordChainData {
  word: string;
  hint: string;
}

const WordChainScreen = () => {
  const [currentWordData, setCurrentWordData] = useState<WordChainData | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [resultMessage, setResultMessage] = useState<string>('');
  const [hintMessage, setHintMessage] = useState<string>('');
  const [hintCount, setHintCount] = useState<number>(0);
  const [timer, setTimer] = useState<number>(30);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const myIp = Constants.manifest?.extra?.myIp || '192.168.124.100';

  // 무료 API를 활용해 단어와 정의(힌트)를 가져옵니다.
  // requiredLetter가 있으면 해당 글자로 시작하는 단어를, 없으면 아무 단어나 가져옵니다.
  const fetchRandomWordWithLetter = async (requiredLetter?: string): Promise<WordChainData> => {
    try {
      const url = `https://random-word-api.herokuapp.com/word?number=10`;
      const randomResponse = await axios.get<string[]>(url);
      let words = randomResponse.data;
      if (requiredLetter) {
        words = words.filter(word => word[0].toLowerCase() === requiredLetter.toLowerCase());
      }
      const word = words.length > 0 ? words[Math.floor(Math.random() * words.length)] : randomResponse.data[0];
      
      let hint = 'No hint available.';
      try {
        const defResponse = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (Array.isArray(defResponse.data) && defResponse.data.length > 0 && defResponse.data[0].meanings?.length > 0) {
          hint = defResponse.data[0].meanings[0].definitions[0].definition;
        }
      } catch (e) {
        console.error("Dictionary API error", e);
      }
      
      return { word, hint };
    } catch (error: any) {
      console.error('Error fetching word:', error.message);
      throw error;
    }
  };

  // 게임 시작: AI가 초기 단어를 제시합니다.
  const startGame = async () => {
    setGameOver(false);
    setResultMessage('');
    setHintMessage('');
    setHintCount(0);
    setTimer(30);
    try {
      setLoading(true);
      const wordData = await fetchRandomWordWithLetter();
      setCurrentWordData(wordData);
      playTTS(wordData.word, 'ai');
      setLoading(false);
      resetTimer();
    } catch (error) {
      console.error(error);
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
          setResultMessage('Time is up! You lose.');
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // TTS 재생 함수 (type: 'ai' 또는 'user')
// 수정된 playTTS 함수 예시
const playTTS = async (text: string, type: 'ai' | 'user') => {
  try {
    // 기본 speaker ID를 지정 (필요에 따라 변경 가능)
    const defaultSpeaker = 'p225';
    // 요청 시 text와 speaker를 모두 전달
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
          console.log('Audio playback ended and URL revoked.');
        };
      }).catch(error => {
        console.error("Auto audio play error:", error);
      });
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
      setLoadingMessage(`TTS 모델이 로딩 중입니다. 약 ${estimatedTime}초 후에 재시도합니다.`);
      await new Promise(resolve => setTimeout(resolve, estimatedTime * 1000));
      setLoading(false);
      setLoadingMessage('');
      const defaultSpeaker = 'p225';
      // 재시도
      const retryResponse = await axios.post(
        `http://${myIp}:3000/api/speech/tts`,
        { text, defaultSpeaker },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return retryResponse;
    } else {
      throw error;
    }
  }
};

  // base64 문자열을 Blob으로 변환 (웹용)
  function base64ToBlob(base64: string, mime: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  }

  // 사용자의 답변 제출 처리
// handleSubmit 함수 수정 예시
const handleSubmit = async () => {
  if (!currentWordData) return;
  if (userAnswer.trim() === '') {
    setResultMessage('Please enter a word.');
    return;
  }
  // 사용자가 입력한 단어의 첫 글자가 AI 단어의 마지막 글자와 일치하는지 확인
  const lastLetter = currentWordData.word.slice(-1).toLowerCase();
  const answerFirstLetter = userAnswer.trim()[0].toLowerCase();
  if (answerFirstLetter !== lastLetter) {
    // 타이머 중지
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setResultMessage(`Incorrect! Your word should start with "${lastLetter}". You lose.`);
    setGameOver(true);
    return;
  }
  // 올바른 답인 경우, 사용자의 단어 음성 재생 및 다음 라운드 진행
  playTTS(userAnswer, 'user');
  const requiredLetter = userAnswer.trim().slice(-1).toLowerCase();
  try {
    setLoading(true);
    const newWordData = await fetchRandomWordWithLetter(requiredLetter);
    setCurrentWordData(newWordData);
    playTTS(newWordData.word, 'ai');
    setUserAnswer('');
    setResultMessage('');
    setHintMessage('');
    setHintCount(0);
    setTimer(30);
    resetTimer();
    setLoading(false);
  } catch (error) {
    console.error(error);
    setLoading(false);
  }
};

  // 힌트 요청 처리: AI 단어의 마지막 글자에 맞는 후보 단어와 정의를 제시
  const handleHint = async () => {
    if (!currentWordData) return;
    if (hintCount >= 3) {
      setHintMessage('No more hints available.');
      return;
    }
    const requiredLetter = currentWordData.word.slice(-1).toLowerCase();
    try {
      const hintData = await fetchRandomWordWithLetter(requiredLetter);
      setHintMessage(`Hint: Try a word like "${hintData.word}" (${hintData.hint})`);
      setHintCount(prev => prev + 1);
    } catch (error) {
      console.error(error);
    }
  };

  // 게임 시작 시 초기 단어 로드
  useEffect(() => {
    startGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.timerText}>Time Left: {timer} seconds</Text>
      <Text style={styles.title}>Word Chain Game</Text>
      {loading && <ActivityIndicator size="large" />}
      {currentWordData && (
        <>
          <Text style={styles.wordText}>{currentWordData.word}</Text>
          <Button title="Play Word Audio" onPress={() => playTTS(currentWordData.word, 'ai')} />
        </>
      )}
      <TextInput
        style={styles.input}
        value={userAnswer}
        onChangeText={setUserAnswer}
        placeholder="Enter your word"
        editable={!gameOver}
      />
      <Button title="Play Your Word Audio" onPress={() => playTTS(userAnswer, 'user')} disabled={!userAnswer.trim()} />
      <Button title="Submit Answer" onPress={handleSubmit} disabled={gameOver} />
      <Button title={`Hint (${3 - hintCount} left)`} onPress={handleHint} disabled={gameOver} />
      {hintMessage !== '' && <Text style={styles.hintText}>{hintMessage}</Text>}
      {resultMessage !== '' && <Text style={styles.resultText}>{resultMessage}</Text>}
      {gameOver && <Button title="Restart Game" onPress={startGame} />}

      {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>{loadingMessage || "Wait for loading model"}</Text>
              </View>
            )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  timerText: { fontSize: 20, marginBottom: 10 },
  title: { fontSize: 24, marginBottom: 20 },
  wordText: { fontSize: 28, marginVertical: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', width: '80%', padding: 10, marginVertical: 10 },
  hintText: { fontSize: 18, color: 'gray', marginVertical: 10 },
  resultText: { fontSize: 20, color: 'red', marginVertical: 10 },
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

export default WordChainScreen;

