import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { SWIMMING_STYLES } from '../types';
import { formatDate } from '../utils/validators';

export interface HomeScreenProps {
  onLogout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout }) => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  const swimmingStyleLabels = user.swimmingStyles
    .map((style) => SWIMMING_STYLES.find((s) => s.value === style)?.label)
    .filter(Boolean);

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Sair',
        onPress: () => {
          logout();
          onLogout();
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.firstName[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Olá, {user.firstName}!</Text>
          <Text style={styles.subtitle}>Aqui está seu perfil de nadador.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informações Pessoais</Text>
        <View style={styles.cardContent}>
          <InfoRow label="Nome" value={`${user.firstName} ${user.lastName}`} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="CPF" value={user.cpf} />
          <InfoRow label="Telefone" value={user.phone} />
          <InfoRow label="Nascimento" value={formatDate(user.dateOfBirth)} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Endereço</Text>
        <View style={styles.cardContent}>
          <InfoRow label="Rua" value={user.address} />
          <InfoRow label="Cidade" value={user.city} />
          <InfoRow label="Estado" value={user.state} />
          <InfoRow label="CEP" value={user.postalCode} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Natação</Text>
        <View style={styles.cardContent}>
          <InfoRow label="Academia" value={user.swimmingAcademy} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estilos</Text>
            <View style={styles.stylesContainer}>
              {swimmingStyleLabels.map((style, index) => (
                <View key={index} style={styles.styleTag}>
                  <Text style={styles.styleTagText}>{style}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Conta</Text>
        <View style={styles.cardContent}>
          <InfoRow label="Criada em" value={formatDate(user.createdAt)} />
        </View>
      </View>

      <Button
        title="Sair"
        onPress={handleLogout}
        variant="danger"
        size="large"
      />
    </ScrollView>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef5ff',
  },
  content: {
    padding: 18,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef5ff',
  },
  loadingText: {
    fontSize: 16,
    color: '#4a5f7f',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 6,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#132845',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#556680',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#007AFF',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  cardContent: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  infoRow: {
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7a8aa3',
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    color: '#24345a',
    fontWeight: '600',
  },
  stylesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  styleTag: {
    backgroundColor: '#e8f3ff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#c6ddff',
  },
  styleTagText: {
    color: '#1f4e9c',
    fontSize: 12,
    fontWeight: '700',
  },
});
