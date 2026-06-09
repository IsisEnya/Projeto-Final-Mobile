import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { Picker } from '../components/Picker';
import { useAuth } from '../contexts/AuthContext';
import {
  SWIMMING_STYLES,
  SwimmingStyle,
  WorkoutPlaceType,
  WorkoutRecord,
} from '../types';
import { formatDate } from '../utils/validators';

export interface HomeScreenProps {
  onLogout: () => void;
}

const placeTypeOptions: { label: string; value: WorkoutPlaceType }[] = [
  { label: 'Piscina', value: 'pool' },
  { label: 'Livre', value: 'open-water' },
];

const poolLengthOptions = [
  { label: '25 metros', value: '25' },
  { label: '50 metros', value: '50' },
];

const formatDistance = (meters: number) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2).replace('.', ',')} km`;
  }

  return `${meters} m`;
};

const getStyleLabel = (style: SwimmingStyle) =>
  SWIMMING_STYLES.find((item) => item.value === style)?.label ?? style;

export const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout }) => {
  const { user, logout } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [placeName, setPlaceName] = useState('');
  const [placeType, setPlaceType] = useState<WorkoutPlaceType>('pool');
  const [swimmingStyle, setSwimmingStyle] = useState<SwimmingStyle>('freestyle');
  const [laps, setLaps] = useState('');
  const [poolLength, setPoolLength] = useState('25');

  const workoutsStorageKey = user ? `workouts_${user.id}` : '';
  const lapsNumber = Number(laps.replace(',', '.')) || 0;
  const poolLengthNumber = Number(poolLength) || 0;
  const previewDistance = lapsNumber * poolLengthNumber;

  useEffect(() => {
    const loadWorkouts = async () => {
      if (!workoutsStorageKey) return;

      try {
        const storedWorkouts = await AsyncStorage.getItem(workoutsStorageKey);
        setWorkouts(storedWorkouts ? JSON.parse(storedWorkouts) : []);
      } catch (error) {
        Alert.alert('Treinos', 'Não foi possível carregar seus registros.');
      }
    };

    loadWorkouts();
  }, [workoutsStorageKey]);

  const swimmingStyleLabels = useMemo(() => {
    if (!user) return [];

    return user.swimmingStyles
      .map((style) => SWIMMING_STYLES.find((s) => s.value === style)?.label)
      .filter(Boolean);
  }, [user]);

  const scoreboard = useMemo(() => {
    const totalDistance = workouts.reduce((total, workout) => total + workout.totalDistance, 0);
    const totalLaps = workouts.reduce((total, workout) => total + workout.laps, 0);
    const styleDiversity = new Set(workouts.map((workout) => workout.swimmingStyle)).size;

    return {
      totalDistance,
      totalLaps,
      styleDiversity,
    };
  }, [workouts]);

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  const swimmingStyleOptions = SWIMMING_STYLES.map((style) => ({
    label: style.label,
    value: style.value,
  }));

  const handleSaveWorkout = async () => {
    if (!placeName.trim()) {
      Alert.alert('Registro de treino', 'Informe onde você treinou.');
      return;
    }

    if (lapsNumber <= 0 || poolLengthNumber <= 0) {
      Alert.alert('Registro de treino', 'Informe a quantidade de voltas e o tamanho da piscina.');
      return;
    }

    const newWorkout: WorkoutRecord = {
      id: Date.now().toString(),
      userId: user.id,
      trainedAt: new Date().toISOString(),
      placeName: placeName.trim(),
      placeType,
      swimmingStyle,
      laps: lapsNumber,
      poolLength: poolLengthNumber,
      totalDistance: previewDistance,
    };

    const updatedWorkouts = [newWorkout, ...workouts];
    setWorkouts(updatedWorkouts);
    await AsyncStorage.setItem(workoutsStorageKey, JSON.stringify(updatedWorkouts));

    setPlaceName('');
    setPlaceType('pool');
    setSwimmingStyle('freestyle');
    setLaps('');
    setPoolLength('25');
  };

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
          <Text style={styles.subtitle}>Registre seus treinos e acompanhe sua evolução.</Text>
        </View>
      </View>

      <View style={styles.scoreGrid}>
        <ScoreCard label="Distância" value={formatDistance(scoreboard.totalDistance)} />
        <ScoreCard label="Voltas" value={`${scoreboard.totalLaps}`} />
        <ScoreCard label="Nados" value={`${scoreboard.styleDiversity}`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Registrar treino</Text>
        <View style={styles.cardContent}>
          <InputField
            label="Onde foi treinado"
            placeholder="Ex: Academia Splash"
            value={placeName}
            onChangeText={setPlaceName}
          />

          <Text style={styles.fieldLabel}>Ambiente</Text>
          <View style={styles.segmentedControl}>
            {placeTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.segmentButton,
                  placeType === option.value && styles.segmentButtonActive,
                ]}
                onPress={() => setPlaceType(option.value)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    placeType === option.value && styles.segmentTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Picker
            label="Tipo de nado"
            options={swimmingStyleOptions}
            value={swimmingStyle}
            onValueChange={(value) => setSwimmingStyle(value as SwimmingStyle)}
          />

          <InputField
            label="Quantidade de voltas/chegadas"
            placeholder="Ex: 20"
            value={laps}
            onChangeText={setLaps}
            keyboardType="numeric"
          />

          <Picker
            label="Tamanho da piscina"
            options={poolLengthOptions}
            value={poolLength}
            onValueChange={setPoolLength}
          />

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total do treino</Text>
            <Text style={styles.totalValue}>{formatDistance(previewDistance)}</Text>
          </View>

          <Button title="Salvar treino" onPress={handleSaveWorkout} size="large" />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Últimos treinos</Text>
        <View style={styles.cardContent}>
          {workouts.length === 0 ? (
            <Text style={styles.emptyText}>Seus registros aparecerão aqui após o primeiro treino.</Text>
          ) : (
            workouts.slice(0, 5).map((workout) => (
              <View key={workout.id} style={styles.workoutRow}>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutTitle}>{getStyleLabel(workout.swimmingStyle)}</Text>
                  <Text style={styles.workoutMeta}>
                    {workout.placeName} • {formatDate(workout.trainedAt)}
                  </Text>
                </View>
                <View style={styles.workoutBadge}>
                  <Text style={styles.workoutBadgeText}>{formatDistance(workout.totalDistance)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Conta</Text>
        <View style={styles.cardContent}>
          <InfoRow label="Nome" value={`${user.firstName} ${user.lastName}`} />
          <InfoRow label="Email" value={user.email} />
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

      <Button title="Sair" onPress={handleLogout} variant="danger" size="large" />
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

interface ScoreCardProps {
  label: string;
  value: string;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ label, value }) => (
  <View style={styles.scoreCard}>
    <Text style={styles.scoreValue}>{value}</Text>
    <Text style={styles.scoreLabel}>{label}</Text>
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
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 6,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 26,
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
  scoreGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  scoreCard: {
    flex: 1,
    minHeight: 88,
    backgroundColor: '#102a43',
    borderRadius: 14,
    padding: 12,
    justifyContent: 'center',
  },
  scoreValue: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
  },
  scoreLabel: {
    color: '#b8d7ff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1dbe8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fbff',
  },
  segmentButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  segmentText: {
    color: '#24365c',
    fontSize: 14,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#fff',
  },
  totalBox: {
    backgroundColor: '#f1f8ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cce3ff',
  },
  totalLabel: {
    color: '#4d6988',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  totalValue: {
    color: '#123f73',
    fontSize: 24,
    fontWeight: '800',
  },
  emptyText: {
    color: '#687c95',
    fontSize: 14,
    lineHeight: 20,
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  workoutInfo: {
    flex: 1,
    paddingRight: 10,
  },
  workoutTitle: {
    color: '#24345a',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  workoutMeta: {
    color: '#6a7b91',
    fontSize: 12,
  },
  workoutBadge: {
    backgroundColor: '#e8f3ff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  workoutBadgeText: {
    color: '#1f4e9c',
    fontSize: 12,
    fontWeight: '800',
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
    borderRadius: 14,
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
