import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
}) => {
  const variantStyle =
    variant === 'secondary'
      ? styles.buttonSecondary
      : variant === 'danger'
      ? styles.buttonDanger
      : styles.buttonPrimary;

  const sizeStyle =
    size === 'small'
      ? styles.buttonSmall
      : size === 'large'
      ? styles.buttonLarge
      : styles.buttonMedium;

  const textStyle =
    variant === 'secondary'
      ? styles.buttonTextSecondary
      : variant === 'danger'
      ? styles.buttonTextDanger
      : styles.buttonTextPrimary;

  return (
    <TouchableOpacity
      style={[styles.button, variantStyle, sizeStyle, (disabled || loading) && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#35bdf2',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  buttonPrimary: {
    backgroundColor: '#43c7f4',
  },
  buttonSecondary: {
    backgroundColor: '#f4fbff',
    borderWidth: 1,
    borderColor: '#d9f0fb',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDanger: {
    backgroundColor: '#ff6b73',
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonMedium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonLarge: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  buttonTextPrimary: {
    color: '#fff',
  },
  buttonTextSecondary: {
    color: '#1688c9',
  },
  buttonTextDanger: {
    color: '#fff',
  },
});
