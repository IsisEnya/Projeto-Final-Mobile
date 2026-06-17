import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type ToastType = 'success' | 'warning' | 'error';

interface ToastMessageProps {
  message: string | null;
  type?: ToastType;
}

export const ToastMessage: React.FC<ToastMessageProps> = ({ message, type = 'error' }) => {
  if (!message) return null;

  return (
    <View style={[styles.toast, styles[`toast_${type}`]]}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 54,
    left: 18,
    right: 18,
    zIndex: 100,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#102a43',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 22,
    elevation: 30,
  },
  toast_success: {
    backgroundColor: '#c9f7e4',
    borderWidth: 2,
    borderColor: '#58d9a7',
  },
  toast_warning: {
    backgroundColor: '#fff1b8',
    borderWidth: 2,
    borderColor: '#e0b72f',
  },
  toast_error: {
    backgroundColor: '#ffd4dc',
    borderWidth: 2,
    borderColor: '#e7687d',
  },
  toastText: {
    color: '#102a43',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 20,
  },
});
