// src/screens/MainMenuScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const MainMenuScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.contentContainer}>
        <View style={styles.menuGrid}>
          <View style={styles.row}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => navigation.navigate('SpeakerSelection')}
            >
              <Text style={styles.menuButtonText}>Voice</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => navigation.navigate('ChatText')}
            >
              <Text style={styles.menuButtonText}>Chat</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.menuButton, styles.gameButton]}
            onPress={() => navigation.navigate('WordChain')}
          >
            <Text style={styles.menuButtonText}>Word Chain</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomTab}>
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('MainMenu')}
        >
          <Icon name="home" size={24} color="#6B77F8" />
          <Text style={styles.tabText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('SpeakerSelection')}
        >
          <Icon name="mic" size={24} color="#9EA0A5" />
          <Text style={[styles.tabText, styles.tabTextInactive]}>Voice</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('ChatText')}
        >
          <Icon name="chatbubble" size={24} color="#9EA0A5" />
          <Text style={[styles.tabText, styles.tabTextInactive]}>Chat</Text>
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '5%',
  },
  menuGrid: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 500,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: '48%',
    marginBottom: '4%',
  },
  menuButton: {
    backgroundColor: '#6B77F8',
    borderRadius: 15,
    width: '48%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gameButton: {
    width: '100%',
    height: '48%',
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
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
  },
});

export default MainMenuScreen;