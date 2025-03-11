import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MainMenuScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.title}>Main</Text>
      
      <View style={styles.menuRow}>
        <TouchableOpacity 
          style={styles.smallMenuButton} 
          onPress={() => navigation.navigate('SpeakerSelection')}
        >
          <Text style={styles.menuText}>Voice</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.smallMenuButton} 
          onPress={() => navigation.navigate('ChatText')}
        >
          <Text style={styles.menuText}>Chat</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.mediumMenuButton} 
        onPress={() => navigation.navigate('WordChain')}
      >
        <Text style={styles.menuText}>Word Chain</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    right: 45,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    position: 'absolute',
    top: 40,
    left: 50,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    position: 'absolute',
    top: 200,
  },
  smallMenuButton: {
    width: 195,
    height: 152,
    backgroundColor: '#6B63FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  mediumMenuButton: {
    width: 406,
    height: 152, 
    backgroundColor: '#6B63FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    position: 'absolute',
    top: 370, 
  },
  menuText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MainMenuScreen;