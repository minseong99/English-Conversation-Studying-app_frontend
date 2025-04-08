// src/screens/SpeakerSelectionScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

// 타입 정의 추가
type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
};

const speakers = [
  { 
    id: "p225", 
    label: "Alice", 
    description: "She is tough and quiet.",
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    image: require('../../assets/alice.png'),
  },
  { 
    id: "p226", 
    label: "Tomas", 
    description: "He is on the bright side and is very playful.",
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    image: require('../../assets/tomas.png'),
  },
  { id: "p228", label: "Robert" , 
    description: "He speaks in a gentlemanly and logical manner.",
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    image: require('../../assets/robert.png'),
  },
  { id: "p229", label: "Tom", 
    description: "He has an easygoing personality and is a bit lazy.",
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    image: require('../../assets/tom.png'),
  },
];

const SpeakerSelectionScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleSpeakerSelect = (speakerId: string) => {
    navigation.navigate('ChatVoice', { speaker: speakerId });
  };

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView style={styles.scrollView}>
        {speakers.map((spk) => (
          <TouchableOpacity 
            key={spk.id} 
            style={styles.modelContainer}
            onPress={() => handleSpeakerSelect(spk.id)}
          >
            <View style={styles.modelContent}>
              <Text style={styles.modelName}>{spk.label}</Text>
              <Text style={styles.modelDesc}>{spk.description}</Text>
            </View>
            <Image source={spk.image} style={styles.silhouetteImage} />
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
  textContent: {
    flex: 1, // 가능한 많은 공간 차지
  },
  silhouetteImage: {
    width: 60, // 이미지 너비 조정
    height: 60, // 이미지 높이 조정
    marginLeft: 10, // 텍스트와 이미지 사이 간격
  },
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
    flexDirection: 'row', // 텍스트와 이미지를 가로로 배치
    justifyContent: 'space-between', // 텍스트와 이미지 사이의 공간 분배
    alignItems: 'center', // 세로 중앙 정렬
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