// src/screens/SpeakerSelectionScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

// 타입 정의 추가
type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
};

const speakers = [
  { 
    id: "p225", 
    label: "ai 모델 이름", 
    description: "모델 설명",
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
  },
  { 
    id: "p226", 
    label: "ai 모델 이름", 
    description: "모델 설명",
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
  },
  { id: "p227", label: "ai 모델 이름" , 
    description: "모델 설명",
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
  },
  { id: "p228", label: "ai 모델 이름", 
    description: "모델 설명",
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
  },
  { id: "p229", label: "ai 모델 이름", 
    description: "모델 설명",
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
  },
];

const SpeakerSelectionScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleSpeakerSelect = (speakerId: string) => {
    navigation.navigate('ChatVoice', { speaker: speakerId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI 선택 화면</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {speakers.map((spk) => (
          <TouchableOpacity 
            key={spk.id} 
            style={styles.modelContainer}
            onPress={() => handleSpeakerSelect(spk.id)}
          >
            <View style={styles.modelContent}>
              <Text style={styles.modelName}>{spk.label}</Text>
              <Text style={styles.modelDesc}>모델 설명</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
  scrollView: {
    flex: 1,
    padding: 20,
  },
  modelContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  modelContent: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000000',
  },
  modelDesc: {
    fontSize: 14,
    color: '#666666',
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
});

export default SpeakerSelectionScreen;