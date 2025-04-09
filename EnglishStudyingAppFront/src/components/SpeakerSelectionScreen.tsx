// src/screens/SpeakerSelectionScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import PersonalityMeter from '../components/PersonalityMeter';


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
    traits: [
      { emoji: '🔥', label: 'lively', value: 30 },
      { emoji: '🧠', label: 'logical', value: 60 },
      { emoji: '💖', label: 'kindness', value: 40 },
      { emoji: '🧐', label: 'seriousness', value: 85 },
      { emoji: '✨', label: 'creativity', value: 50 }
    ],
    color: '#FF6B6B',
    mood: '😐'
  },
  { 
    id: "p226", 
    label: "Tomas", 
    description: "He is on the bright side and is very playful.",
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    image: require('../../assets/tomas.png'),
    traits: [
      { emoji: '🔥', label: 'lively', value: 90 },
      { emoji: '🧠', label: 'logical', value: 50 },
      { emoji: '💖', label: 'kindness', value: 75 },
      { emoji: '🧐', label: 'seriousness', value: 25 },
      { emoji: '✨', label: 'creativity', value: 85 }
    ],
    color: '#4ECDC4',
    mood: '😄'
  },
  { 
    id: "p228", 
    label: "Robert", 
    description: "He speaks in a gentlemanly and logical manner.",
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    image: require('../../assets/robert.png'),
    traits: [
      { emoji: '🔥', label: 'lively', value: 60 },
      { emoji: '🧠', label: 'logical', value: 90 },
      { emoji: '💖', label: 'kindness', value: 80 },
      { emoji: '🧐', label: 'seriousness', value: 75 },
      { emoji: '✨', label: 'creativity', value: 50 }
    ],
    color: '#FFD166',
    mood: '🤔'
  },
  { 
    id: "p229", 
    label: "Tom", 
    description: "He has an easygoing personality and is a bit lazy.",
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    image: require('../../assets/tom.png'),
    traits: [
      { emoji: '🔥', label: 'lively', value: 50 },
      { emoji: '🧠', label: 'logical', value: 30 },
      { emoji: '💖', label: 'kindness', value: 75 },
      { emoji: '🧐', label: 'seriousness', value: 20 },
      { emoji: '✨', label: 'creativity', value: 60 }
    ],
    color: '#6B77F8',
    mood: '😌'
  },
];

const SpeakerSelectionScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);

  // 항상 가로 2개씩 보여주도록 카드 너비 계산
  const { width } = useWindowDimensions();
  const cardMargin = 15;
  const cardWidth = (width - cardMargin * 3) / 2; // 좌우 + 가운데 마진 3개

// 같은 카드를 또 누르면 해제(toggle)
  const handleSpeakerSelect = (speakerId: string) => {
      setSelectedSpeaker(prev => (prev === speakerId ? null : speakerId));
  };

  const handleStartChat = () => {
    if (selectedSpeaker) {
      navigation.navigate('ChatVoice', { speaker: selectedSpeaker });
    }
  };

  const renderSpeakersGrid = () => (
    <View style={styles.gridContainer}>
      {speakers.map(speaker => (
        <TouchableOpacity
          key={speaker.id}
          style={[
            styles.speakerCard,
            { width: cardWidth, margin: cardMargin / 2 },
            selectedSpeaker === speaker.id && styles.selectedCard,
          ]}
          onPress={() => handleSpeakerSelect(speaker.id)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.speakerMood}>{speaker.mood}</Text>
            <Text style={styles.speakerName}>{speaker.label}</Text>
          </View>
          <Image source={speaker.image} style={styles.speakerImage} />
          <View style={styles.topTraitsContainer}>
            {speaker.traits.slice(0, 3).map((trait, i) => (
              <View key={i} style={styles.miniTrait}>
                <Text style={styles.traitEmoji}>{trait.emoji}</Text>
                <View style={styles.miniMeterBg}>
                  <View
                    style={[
                      styles.miniMeterFill,
                      { width: `${trait.value}%`, backgroundColor: speaker.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSelectedSpeakerDetails = () => {
    if (!selectedSpeaker) return null;
    const speaker = speakers.find(s => s.id === selectedSpeaker)!;
    return (
      <View style={styles.detailsContainer}>
        <View style={styles.detailsHeader}>
          <View>
            <Text style={styles.detailsName}>
              {speaker.label} <Text style={styles.detailsMood}>{speaker.mood}</Text>
            </Text>
            <Text style={styles.detailsDesc}>{speaker.description}</Text>
          </View>
          <Image source={speaker.image} style={styles.detailsImage} />
        </View>
        <PersonalityMeter traits={speaker.traits} color={speaker.color} />
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: speaker.color }]}
          onPress={handleStartChat}
        >
          <Text style={styles.startButtonText}>Start a conversation</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        <Text style={styles.headerTitle}>Select your friends!</Text>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}>
          {renderSpeakersGrid()}
          {renderSelectedSpeakerDetails()}
        </ScrollView>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 80, // 바텀탭 높이 + 여유
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -7.5, // 카드 margin 보정
  },
  speakerCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#6B77F8',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  speakerMood: {
    fontSize: 20,
    marginRight: 5,
  },
  speakerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  speakerImage: {
    width: 50,
    height: 50,
    alignSelf: 'center',
    marginBottom: 10,
  },
  topTraitsContainer: {
    marginTop: 5,
  },
  miniTrait: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  traitEmoji: {
    fontSize: 12,
    marginRight: 5,
    width: 15,
  },
  miniMeterBg: {
    flex: 1,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniMeterFill: {
    height: '100%',
    borderRadius: 3,
  },
  detailsContainer: {
    marginTop: 20,
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailsName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsMood: {
    fontSize: 20,
  },
  detailsDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  detailsImage: {
    width: 60,
    height: 60,
  },
  startButton: {
    marginTop: 15,
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomTab: {
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
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

export default SpeakerSelectionScreen;

