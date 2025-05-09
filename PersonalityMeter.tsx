import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TraitProps {
  emoji: string;
  label: string;
  value: number;
  color: string;
}

const Trait: React.FC<TraitProps> = ({ emoji, label, value, color }) => {
  return (
    <View style={styles.traitContainer}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.traitLabel}>{label}</Text>
      <View style={styles.meterBackground}>
        <View
          style={[
            styles.meterFill,
            { width: `${value}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
};

interface PersonalityMeterProps {
  traits: {
    emoji: string;
    label: string;
    value: number;
  }[];
  color: string;
}

const PersonalityMeter: React.FC<PersonalityMeterProps> = ({
  traits,
  color,
}) => {
  return (
    <View style={styles.container}>
      {traits.map((trait, index) => (
        <Trait
          key={index}
          emoji={trait.emoji}
          label={trait.label}
          value={trait.value}
          color={color}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    width: '100%',
  },
  traitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 18,
    marginRight: 8,
  },
  traitLabel: {
    fontSize: 12,
    width: 70,
    color: '#555',
  },
  meterBackground: {
    flex: 1,
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 5,
  },
});

export default PersonalityMeter;
