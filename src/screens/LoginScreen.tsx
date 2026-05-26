import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';

export interface LoginScreenProps {
  onNavigateToSignUp: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToSignUp }) => {
  const { login, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (error) {
      Alert.alert('Erro de Login', error);
      clearError();
    }
  }, [error, clearError]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!email) {
      errors.email = 'Email é obrigatório';
    }
    if (!password) {
      errors.password = 'Senha é obrigatória';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login(email, password);
    } catch (err) {
      // Error is handled by useEffect
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Bem-vindo ao SwimApp</Text>
          <Text style={styles.heroSubtitle}>
            Entre para controlar sua carreira na natação e encontrar a melhor academia.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Login</Text>

          <InputField
            label="Email"
            placeholder="seu@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (validationErrors.email) {
                setValidationErrors({ ...validationErrors, email: '' });
              }
            }}
            keyboardType="email-address"
            error={validationErrors.email}
          />

          <InputField
            label="Senha"
            placeholder="Sua senha"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (validationErrors.password) {
                setValidationErrors({ ...validationErrors, password: '' });
              }
            }}
            secureTextEntry
            error={validationErrors.password}
          />

          <Button
            title={loading ? 'Entrando...' : 'Entrar'}
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          />

          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>Não tem uma conta?</Text>
            <Button
              title="Cadastre-se"
              onPress={onNavigateToSignUp}
              variant="secondary"
              size="small"
            />
          </View>
        </View>

        <View style={styles.demoInfo}>
          <Text style={styles.demoTitle}>Conta demo</Text>
          <Text style={styles.demoText}>Email: demo@swimapp.com</Text>
          <Text style={styles.demoText}>Senha: 123456</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9f2ff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  hero: {
    marginBottom: 28,
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 5,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0a4f9f',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#51667a',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#122a56',
    marginBottom: 18,
  },
  cardFooter: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#66738a',
  },
  demoInfo: {
    backgroundColor: '#f1f8ff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#d7e7ff',
  },
  demoTitle: {
    fontSize: 14,
    color: '#0b5eb8',
    fontWeight: '700',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 13,
    color: '#5e6d7a',
    lineHeight: 20,
  },
});
