import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const MainMenuScreen = () => {
  const conversationTopics = [
    {
      id: 1,
      title: 'Introducing Yourself',

      iconName: 'person',
    },
    {
      id: 2,
      title: 'Ordering at a Restaurant',

      iconName: 'restaurant',
    },
    {
      id: 3,
      title: 'Job Interview',

      iconName: 'briefcase',
    },
    {
      id: 4,
      title: 'Travel Conversation',

      iconName: 'airplane',
    },
    {
      id: 5,
      title: 'Business Meeting',

      iconName: 'business',
    },
    {
      id: 6,
      title: 'Shopping',

      iconName: 'cart',
    },
    {
      id: 7,
      title: 'Making Friends',

      iconName: 'people',
    },
    {
      id: 8,
      title: 'At the Doctor',

      iconName: 'medkit',
    },
  ];

  const usefulPhrases = [
    {
      phrase: 'Nice to meet you',
      translation: '만나서 반갑습니다',
      situation: 'When meeting someone new',
    },
    {
      phrase: 'How are you doing?',
      translation: '어떻게 지내세요?',
      situation: 'Casual greeting',
    },
  ];

  const dailyWords = [
    { word: 'Perspective', meaning: '관점, 시각' },
    { word: 'Ambiguous', meaning: '모호한' },
    { word: 'Diligent', meaning: '성실한' },
    { word: 'Eloquent', meaning: '유창한, 웅변적인' },
    { word: 'Meticulous', meaning: '꼼꼼한' },
    { word: 'Tenacious', meaning: '끈기 있는' },
    { word: 'Innovative', meaning: '혁신적인' },
    { word: 'Pragmatic', meaning: '실용적인' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* 배너 */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Improve Your English</Text>
            <Text style={styles.bannerSubtitle}>
              Practice conversations daily
            </Text>
          </View>
        </View>

        {/* 대화 주제 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Recomendation of topics today
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.topicsScroll}>
            {conversationTopics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={styles.topicCard}
                activeOpacity={1}>
                <View
                  style={[
                    styles.topicImage,
                    {
                      backgroundColor:
                        topic.id % 2 === 0 ? '#7DDBD5' : '#9EA5FA',
                    },
                  ]}>
                  <Icon name={topic.iconName} size={32} color="#FFFFFF" />
                </View>
                <View style={styles.topicInfo}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 오늘의 단어 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Words of the Day</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.wordsScroll}>
            {dailyWords.map((item, index) => (
              <View key={index} style={styles.wordCard}>
                <Text style={styles.word}>{item.word}</Text>
                <Text style={styles.meaning}>{item.meaning}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 유용한 표현 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Useful Phrases</Text>
          {usefulPhrases.map((item, index) => (
            <View key={index} style={styles.phraseCard}>
              <View style={styles.phraseHeader}>
                <Text style={styles.phrase}>{item.phrase}</Text>
              </View>
              <Text style={styles.translation}>{item.translation}</Text>
              <Text style={styles.situation}>{item.situation}</Text>
            </View>
          ))}
        </View>

        {/* 학습 팁 */}
        <View style={styles.tipContainer}>
          <View style={styles.tipHeader}>
            <Icon name="bulb" size={20} color="#FFD700" />
            <Text style={styles.tipTitle}>Learning Tip</Text>
          </View>
          <Text style={styles.tipText}>
            Listen to English podcasts while commuting to improve your listening
            skills and get used to natural speech patterns.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
  },
  profileButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },

  bannerContainer: {
    height: 180,
    backgroundColor: '#6B77F8',
    marginBottom: 15,
  },
  bannerContent: {
    padding: 20,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 5,
  },

  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#6B77F8',
    fontSize: 14,
  },
  // 대화 주제
  topicsScroll: {
    paddingBottom: 10,
  },
  topicCard: {
    width: 160,
    marginRight: 15,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  topicImage: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicInfo: {
    padding: 12,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: '#6B77F8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  // 단어 스타일
  wordsScroll: {
    paddingBottom: 10,
  },
  wordCard: {
    backgroundColor: '#F0F3FF',
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
  },
  word: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B77F8',
    marginBottom: 5,
  },
  meaning: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  // 유용한 표현
  phraseCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  phraseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phrase: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  speakButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  translation: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  situation: {
    fontSize: 12,
    color: '#999999',
    marginTop: 5,
    fontStyle: 'italic',
  },
  // 학습 팁
  tipContainer: {
    backgroundColor: '#FFFAED',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 30,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
  },
});

export default MainMenuScreen;
