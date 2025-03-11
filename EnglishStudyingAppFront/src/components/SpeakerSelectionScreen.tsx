import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const models = [
  { id: '1', name: 'ai 모델 이름 1', description: '(p225)' },
  { id: '2', name: 'ai 모델 이름 2', description: '(p226)' },
  { id: '3', name: 'ai 모델 이름 3', description: '(p227)' },
  { id: '4', name: 'ai 모델 이름 4', description: '(p228)' },
  { id: '5', name: 'ai 모델 이름 5', description: '(p229)' },
  { id: '6', name: 'ai 모델 이름 6', description: '(p230)' },
  { id: '7', name: 'ai 모델 이름 7', description: '(p231)' },
  { id: '8', name: 'ai 모델 이름 8', description: '(p232)' },
  { id: '9', name: 'ai 모델 이름 9', description: '(p233)' },
  { id: '10', name: 'ai 모델 이름 10', description: '(p234)' },
];

const SpeakerSelectionScreen = () => {
  const navigation = useNavigation();

  const handleSpeakerSelect = (speakerId, speakerName) => {
    navigation.navigate('ChatVoice', { speakerId, speakerName });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>AI 선택 화면</Text>
      </View>
      <FlatList
        data={models}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.modelCard} 
            onPress={() => handleSpeakerSelect(item.id, item.name)}
          >
            <Text style={styles.modelName}>{item.name}</Text>
            <Text style={styles.modelDescription}>{item.description}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    right: 15,
    padding: 10, 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    position: 'absolute',
    top: 20,
    left: 50,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  modelCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  modelName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modelDescription: {
    fontSize: 14,
    color: 'gray',
  },
});

export default SpeakerSelectionScreen;
