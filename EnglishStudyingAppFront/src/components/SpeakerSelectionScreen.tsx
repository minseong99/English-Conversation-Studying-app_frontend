// src/screens/SpeakerSelectionScreen.tsx
import React from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const speakers = [
  { id: "p225", label: "화자 1 (p225)" },
  { id: "p226", label: "화자 2 (p226)" },
  { id: "p227", label: "화자 3 (p227)" },
  { id: "p228", label: "화자 4 (p228)" },
  { id: "p229", label: "화자 5 (p229)" },
  { id: "p230", label: "화자 6 (p230)" },
  { id: "p231", label: "화자 7 (p231)" },
  { id: "p232", label: "화자 8 (p232)" },
  { id: "p233", label: "화자 9 (p233)" },
  { id: "p234", label: "화자 10 (p234)" },
];

const SpeakerSelectionScreen = () => {
  const navigation = useNavigation();

  const handleSpeakerSelect = (speakerId: string) => {
    // 선택된 화자 정보를 파라미터로 ChatVoiceScreen으로 이동
    navigation.navigate('ChatVoice', { speaker: speakerId });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>사용할 화자를 선택하세요</Text>
      {speakers.map((spk) => (
        <View key={spk.id} style={styles.buttonContainer}>
          <Button title={spk.label} onPress={() => handleSpeakerSelect(spk.id)} />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  buttonContainer: { marginVertical: 10, width: '80%' },
});

export default SpeakerSelectionScreen;