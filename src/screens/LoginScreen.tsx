import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { useAuth } from '../contexts/AuthContext';

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
      Alert.alert('Erro de login', error);
      clearError();
    }
  }, [error, clearError]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!email) errors.email = 'Email é obrigatório';
    if (!password) errors.password = 'Senha é obrigatória';

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
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>H</Text>
            </View>
            <Text style={styles.brandName}>Hydro Pump</Text>
          </View>

          <View style={styles.waterOrbLarge} />
          <View style={styles.waterOrbSmall} />
          <View style={styles.dropBadge}>
            <Text style={styles.dropIcon}>H</Text>
          </View>

          <Text style={styles.heroTitle}>Registre seus treinos de natação em um só lugar.</Text>
          <Text style={styles.heroSubtitle}>
            Um app de academia feito para natação, com histórico, placar e modalidades.
          </Text>

          <View style={styles.miniStats}>
            <View style={styles.miniStatCard}>
              <Text style={styles.miniStatValue}>2km</Text>
              <Text style={styles.miniStatLabel}>exemplo de treino</Text>
            </View>
            <View style={styles.miniStatCard}>
              <Text style={styles.miniStatValue}>3</Text>
              <Text style={styles.miniStatLabel}>modalidades</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entrar</Text>

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
          <Text style={styles.demoTitle}>Contas demo</Text>
          <Text style={styles.demoText}>Aluno: demo@hydropump.com • senha 123456</Text>
          <Text style={styles.demoText}>Academia: academia@hydropump.com • senha 123456</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fbfe',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },
  hero: {
    minHeight: 310,
    marginBottom: 18,
    padding: 22,
    borderRadius: 28,
    backgroundColor: '#e9f8ff',
    overflow: 'hidden',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 26,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  brandMarkText: {
    color: '#32b9ed',
    fontSize: 23,
    fontWeight: '900',
  },
  brandName: {
    color: '#243047',
    fontSize: 18,
    fontWeight: '900',
  },
  waterOrbLarge: {
    position: 'absolute',
    right: -44,
    top: 18,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#cceffc',
  },
  waterOrbSmall: {
    position: 'absolute',
    right: 42,
    bottom: 28,
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#bce8f8',
  },
  dropBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 20,
    shadowColor: '#47c7f2',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 6,
  },
  dropIcon: {
    color: '#35bdf2',
    fontSize: 44,
    fontWeight: '900',
  },
  heroTitle: {
    width: '74%',
    color: '#111827',
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 31,
    marginBottom: 10,
  },
  heroSubtitle: {
    width: '78%',
    color: '#648196',
    fontSize: 13,
    lineHeight: 20,
  },
  miniStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  miniStatCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 94,
  },
  miniStatValue: {
    color: '#35bdf2',
    fontSize: 18,
    fontWeight: '900',
  },
  miniStatLabel: {
    color: '#7b91a5',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 22,
    marginBottom: 16,
    shadowColor: '#7dbce0',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 26,
    elevation: 7,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
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
    fontSize: 13,
    color: '#7b91a5',
    fontWeight: '600',
  },
  demoInfo: {
    backgroundColor: '#eef9ff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d6effa',
  },
  demoTitle: {
    fontSize: 13,
    color: '#1688c9',
    fontWeight: '900',
    marginBottom: 6,
  },
  demoText: {
    fontSize: 13,
    color: '#627a8f',
    lineHeight: 20,
    fontWeight: '600',
  },
});
