import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function HomeScreen() {
  return (
    <WebView 
      source={{ uri: 'https://frdo1.github.io/calculatrice-salaison/' }}
      style={styles.webview}
      startInLoadingState={true}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});