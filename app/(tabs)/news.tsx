import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function NewsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Haberler</ThemedText>
      <ThemedText>Haber akışı yakında eklenecek</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});