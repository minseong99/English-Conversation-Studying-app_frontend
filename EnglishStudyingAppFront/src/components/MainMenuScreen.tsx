// src/screens/MainMenuScreen.tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const MainMenuScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select the way u want</Text>
      <Button
        title="Voice chat"
        onPress={() => navigation.navigate('SpeakerSelection')}
      />
      <View style={styles.spacer} />
      <Button
        title="Text chat"
        onPress={() => navigation.navigate('ChatText')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 40 },
  spacer: { height: 20 },
});

export default MainMenuScreen;
