import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
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
  ExerciseRecord,
  PoolRecord,
  PRACTICE_PERIODS,
  PracticePeriod,
  STROKE_STYLES,
  SWIM_ACCESSORIES,
  StrokeStyle,
  SwimAccessory,
  SWIMMING_MODALITIES,
  WEEKLY_FREQUENCIES,
  WeeklyFrequency,
  WorkoutPlaceType,
  WorkoutRecord,
} from '../types';
import { formatDate } from '../utils/validators';

export interface HomeScreenProps {
  onLogout: () => void;
}

type AppTab = 'home' | 'workouts' | 'ranking' | 'profile';
type WorkoutView = 'new' | 'history';

const placeTypeOptions: { label: string; value: WorkoutPlaceType }[] = [
  { label: 'Piscina', value: 'pool' },
  { label: 'Aguas abertas', value: 'open-water' },
];

const formatDistance = (meters: number) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2).replace('.', ',')} km`;
  return `${meters} m`;
};

const getOptionLabel = <T extends string>(options: { value: T; label: string }[], value?: T) =>
  options.find((option) => option.value === value)?.label ?? 'Nao informado';

const normalizeWorkout = (workout: any): WorkoutRecord => {
  if (Array.isArray(workout.exercises)) {
    return {
      ...workout,
      durationMinutes: workout.durationMinutes ?? 0,
      totalDistance: workout.totalDistance ?? 0,
    };
  }

  const legacyDistance = workout.totalDistance ?? 0;
  const legacyDate = workout.trainedAt ?? workout.date ?? new Date().toISOString();

  return {
    id: workout.id ?? Date.now().toString(),
    userId: workout.userId ?? '',
    name: workout.placeName ? `Treino em ${workout.placeName}` : 'Treino registrado',
    date: legacyDate,
    placeType: workout.placeType ?? 'pool',
    poolName: workout.placeName,
    durationMinutes: 0,
    totalDistance: legacyDistance,
    exercises: [
      {
        id: `${workout.id ?? Date.now()}-exercise`,
        placeType: workout.placeType ?? 'pool',
        distance: legacyDistance,
        arrivals: workout.laps,
        poolLength: workout.poolLength,
        locationName: workout.placeName,
      },
    ],
    createdAt: workout.createdAt ?? legacyDate,
  };
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout }) => {
  const { user, logout, updateProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [workoutView, setWorkoutView] = useState<WorkoutView>('new');
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [pools, setPools] = useState<PoolRecord[]>([]);
  const [poolName, setPoolName] = useState('');
  const [poolLength, setPoolLength] = useState('');
  const [poolCity, setPoolCity] = useState('');
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutPlaceType, setWorkoutPlaceType] = useState<WorkoutPlaceType>('pool');
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [openWaterLocation, setOpenWaterLocation] = useState('');
  const [openWaterDistance, setOpenWaterDistance] = useState('');
  const [openWaterTime, setOpenWaterTime] = useState('');
  const [strokeStyle, setStrokeStyle] = useState<StrokeStyle>('crawl');
  const [accessory, setAccessory] = useState<SwimAccessory>('none');
  const [arrivals, setArrivals] = useState('');
  const [pendingExercises, setPendingExercises] = useState<ExerciseRecord[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    city: '',
    state: '',
    academyName: '',
    yearsPracticing: '',
    weeklyFrequency: '' as WeeklyFrequency | '',
    practicePeriod: '' as PracticePeriod | '',
    academyProfileName: '',
    academyCity: '',
    academyState: '',
    academyAddress: '',
    academySite: '',
    academyInstagram: '',
  });

  const workoutsStorageKey = user ? `workout_sessions_${user.id}` : '';
  const poolsStorageKey = user ? `pools_${user.id}` : '';
  const displayName =
    user?.accountType === 'academy'
      ? user.academyProfile?.name ?? 'Academia'
      : `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Aluno';

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const [storedWorkouts, storedPools] = await Promise.all([
          AsyncStorage.getItem(workoutsStorageKey),
          AsyncStorage.getItem(poolsStorageKey),
        ]);
        const parsedWorkouts = storedWorkouts ? JSON.parse(storedWorkouts) : [];
        setWorkouts(parsedWorkouts.map(normalizeWorkout));
        setPools(storedPools ? JSON.parse(storedPools) : []);
      } catch (error) {
        Alert.alert('Dados', 'Nao foi possivel carregar seus treinos.');
      }
    };

    loadData();
  }, [poolsStorageKey, user, workoutsStorageKey]);

  useEffect(() => {
    if (!user) return;

    setProfileForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      city: user.city ?? '',
      state: user.state ?? '',
      academyName: user.academyName ?? '',
      yearsPracticing: user.yearsPracticing ?? '',
      weeklyFrequency: user.weeklyFrequency ?? '',
      practicePeriod: user.practicePeriod ?? '',
      academyProfileName: user.academyProfile?.name ?? '',
      academyCity: user.academyProfile?.city ?? '',
      academyState: user.academyProfile?.state ?? '',
      academyAddress: user.academyProfile?.address ?? '',
      academySite: user.academyProfile?.site ?? '',
      academyInstagram: user.academyProfile?.instagram ?? '',
    });
  }, [user]);

  const stats = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyWorkouts = workouts.filter(
      (workout) => new Date(workout.date).getTime() >= sevenDaysAgo
    );
    return {
      weeklyDistance: weeklyWorkouts.reduce((total, workout) => total + workout.totalDistance, 0),
      weeklyWorkouts: weeklyWorkouts.length,
      totalTime: workouts.reduce((total, workout) => total + workout.durationMinutes, 0),
    };
  }, [workouts]);

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  const poolOptions = pools.map((pool) => ({
    label: `${pool.name} (${pool.length}m)`,
    value: pool.id,
  }));

  const resetPoolForm = () => {
    setPoolName('');
    setPoolLength('');
    setPoolCity('');
  };

  const handleSavePool = async () => {
    const length = Number(poolLength.replace(',', '.'));
    if (!poolName.trim() || !length) {
      Alert.alert('Piscina', 'Informe o nome e o comprimento da piscina.');
      return;
    }

    const newPool: PoolRecord = {
      id: Date.now().toString(),
      userId: user.id,
      name: poolName.trim(),
      length,
      city: poolCity.trim() || undefined,
      academyName: user.accountType === 'academy' ? user.academyProfile?.name : undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedPools = [newPool, ...pools];
    setPools(updatedPools);
    await AsyncStorage.setItem(poolsStorageKey, JSON.stringify(updatedPools));
    setSelectedPoolId(newPool.id);
    resetPoolForm();
    setIsPoolModalOpen(false);
    Alert.alert('Piscina cadastrada', `${newPool.name} foi salva com sucesso.`);
  };

  const handleAddExercise = () => {
    const selectedPool = pools.find((pool) => pool.id === selectedPoolId);

    if (workoutPlaceType === 'pool') {
      const arrivalsNumber = Number(arrivals.replace(',', '.'));
      if (!selectedPool || !arrivalsNumber) {
        Alert.alert('Exercicio', 'Selecione a piscina e informe as chegadas.');
        return;
      }

      const newExercise: ExerciseRecord = {
        id: Date.now().toString(),
        placeType: 'pool',
        strokeStyle,
        accessory,
        arrivals: arrivalsNumber,
        poolLength: selectedPool.length,
        distance: arrivalsNumber * selectedPool.length * 2,
        locationName: selectedPool.name,
      };

      setPendingExercises([...pendingExercises, newExercise]);
      setArrivals('');
      Alert.alert('Exercicio adicionado', `${formatDistance(newExercise.distance)} adicionados ao treino.`);
      return;
    }

    const distance = Number(openWaterDistance.replace(',', '.'));
    const duration = Number(openWaterTime.replace(',', '.'));
    if (!openWaterLocation.trim() || !distance || !duration) {
      Alert.alert('Exercicio', 'Informe local, distancia e tempo de aguas abertas.');
      return;
    }

    const newExercise: ExerciseRecord = {
      id: Date.now().toString(),
      placeType: 'open-water',
      distance,
      durationMinutes: duration,
      locationName: openWaterLocation.trim(),
    };

    setPendingExercises([...pendingExercises, newExercise]);
    setOpenWaterDistance('');
    setOpenWaterTime('');
    Alert.alert('Exercicio adicionado', `${formatDistance(distance)} em aguas abertas.`);
  };

  const handleOpenExerciseModal = () => {
    const duration = Number(workoutDuration.replace(',', '.'));

    if (!duration) {
      Alert.alert('Treino', 'Informe o tempo total do treino.');
      return;
    }

    if (workoutPlaceType === 'pool' && !selectedPoolId) {
      Alert.alert('Treino', 'Selecione a piscina utilizada.');
      return;
    }

    if (workoutPlaceType === 'open-water' && !openWaterLocation.trim()) {
      Alert.alert('Treino', 'Informe o local do treino em aguas abertas.');
      return;
    }

    setIsExerciseModalOpen(true);
  };

  const handleSaveWorkout = async () => {
    if (pendingExercises.length === 0) {
      Alert.alert('Treino', 'Adicione pelo menos um exercicio ao treino.');
      return;
    }

    const duration =
      Number(workoutDuration.replace(',', '.')) ||
      pendingExercises.reduce((total, exercise) => total + (exercise.durationMinutes ?? 0), 0);
    const selectedPool = pools.find((pool) => pool.id === selectedPoolId);
    const totalDistance = pendingExercises.reduce((total, exercise) => total + exercise.distance, 0);
    const date = new Date().toISOString();
    const workoutLocation = selectedPool?.name ?? openWaterLocation.trim() ?? 'Treino';

    const newWorkout: WorkoutRecord = {
      id: Date.now().toString(),
      userId: user.id,
      name: workoutName.trim() || `${workoutLocation} - ${formatDate(date)}`,
      date,
      placeType: workoutPlaceType,
      poolId: selectedPool?.id,
      poolName: workoutLocation,
      durationMinutes: duration,
      totalDistance,
      exercises: pendingExercises,
      createdAt: date,
    };

    const updatedWorkouts = [newWorkout, ...workouts];
    setWorkouts(updatedWorkouts);
    await AsyncStorage.setItem(workoutsStorageKey, JSON.stringify(updatedWorkouts));

    setWorkoutName('');
    setWorkoutDuration('');
    setOpenWaterLocation('');
    setOpenWaterDistance('');
    setOpenWaterTime('');
    setArrivals('');
    setPendingExercises([]);
    setIsExerciseModalOpen(false);
    setWorkoutView('history');
    Alert.alert('Treino salvo', `${newWorkout.name} foi registrado com sucesso.`);
  };

  const handleSaveProfile = async () => {
    if (user.accountType === 'academy') {
      await updateProfile({
        academyProfile: {
          id: user.academyProfile?.id ?? `academy-${user.id}`,
          name: profileForm.academyProfileName,
          city: profileForm.academyCity,
          state: profileForm.academyState,
          address: profileForm.academyAddress,
          site: profileForm.academySite,
          instagram: profileForm.academyInstagram,
          teachers: user.academyProfile?.teachers ?? [],
          studentIds: user.academyProfile?.studentIds ?? [],
          poolIds: user.academyProfile?.poolIds ?? [],
        },
      });
    } else {
      await updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        city: profileForm.city,
        state: profileForm.state,
        academyName: profileForm.academyName,
        yearsPracticing: profileForm.yearsPracticing,
        weeklyFrequency: profileForm.weeklyFrequency || undefined,
        practicePeriod: profileForm.practicePeriod || undefined,
      });
    }

    setIsEditingProfile(false);
    Alert.alert('Perfil atualizado', 'Suas informacoes foram salvas.');
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
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

  const renderHome = () => (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroOrbLarge} />
        <View style={styles.heroOrbSmall} />
        <View style={styles.waveOne} />
        <View style={styles.waveTwo} />
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>HP</Text>
        </View>
        <Text style={styles.heroTitle}>Hydro Pump</Text>
        <Text style={styles.heroSubtitle}>
          {user.accountType === 'academy'
            ? 'Gerencie piscinas, alunos e treinos da sua academia.'
            : 'Acompanhe sua semana e registre seus treinos de natacao.'}
        </Text>
        <View style={styles.heroMetric}>
          <Text style={styles.heroMetricValue}>{formatDistance(stats.weeklyDistance)}</Text>
          <Text style={styles.heroMetricLabel}>nadados na semana</Text>
        </View>
      </View>

      <View style={styles.scoreGrid}>
        <ScoreCard label="Semana" value={formatDistance(stats.weeklyDistance)} icon="~" />
        <ScoreCard label="Treinos" value={`${stats.weeklyWorkouts}`} icon="+" />
        <ScoreCard label="Tempo" value={`${stats.totalTime} min`} icon=":" />
      </View>

      <View style={styles.quickActionCard}>
        <View style={styles.quickActionText}>
          <Text style={styles.quickActionTitle}>Pronto para registrar?</Text>
          <Text style={styles.quickActionSubtitle}>Abra um novo treino e adicione os exercicios.</Text>
        </View>
        <Button
          title="Novo"
          onPress={() => {
            setActiveTab('workouts');
            setWorkoutView('new');
          }}
          size="small"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ultimo treino</Text>
        {workouts[0] ? <WorkoutItem workout={workouts[0]} /> : (
          <Text style={styles.emptyText}>Voce ainda nao registrou treinos.</Text>
        )}
      </View>
    </>
  );

  const renderPoolModal = () => (
    <Modal visible={isPoolModalOpen} animationType="slide" transparent onRequestClose={() => setIsPoolModalOpen(false)}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Cadastrar piscina</Text>
            <Button title="Fechar" onPress={() => setIsPoolModalOpen(false)} variant="secondary" size="small" />
          </View>
          <InputField label="Nome" placeholder="Ex: Piscina SESI" value={poolName} onChangeText={setPoolName} />
          <InputField
            label="Comprimento em metros"
            placeholder="25 ou 50"
            value={poolLength}
            onChangeText={setPoolLength}
            keyboardType="decimal-pad"
          />
          <InputField label="Cidade (opcional)" placeholder="Sao Paulo" value={poolCity} onChangeText={setPoolCity} />
          <Button title="Salvar piscina" onPress={handleSavePool} />
        </View>
      </View>
    </Modal>
  );

  const renderExerciseModal = () => (
    <Modal
      visible={isExerciseModalOpen}
      animationType="slide"
      transparent
      onRequestClose={() => setIsExerciseModalOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Exercicios</Text>
            <Button title="Fechar" onPress={() => setIsExerciseModalOpen(false)} variant="secondary" size="small" />
          </View>

          {workoutPlaceType === 'pool' ? (
            <>
              <Picker
                label="Estilo de nado"
                options={STROKE_STYLES}
                value={strokeStyle}
                onValueChange={(value) => setStrokeStyle(value as StrokeStyle)}
              />
              <Picker
                label="Acessorio"
                options={SWIM_ACCESSORIES}
                value={accessory}
                onValueChange={(value) => setAccessory(value as SwimAccessory)}
              />
              <InputField
                label="Numero de chegadas"
                placeholder="1 chegada = ida e volta"
                value={arrivals}
                onChangeText={setArrivals}
                keyboardType="numeric"
              />
            </>
          ) : (
            <>
              <InputField label="Distancia em metros" placeholder="Ex: 1500" value={openWaterDistance} onChangeText={setOpenWaterDistance} keyboardType="numeric" />
              <InputField label="Tempo em minutos" placeholder="Ex: 40" value={openWaterTime} onChangeText={setOpenWaterTime} keyboardType="numeric" />
            </>
          )}

          <View style={styles.buttonGroup}>
            <Button title="Adicionar exercicio" onPress={handleAddExercise} variant="secondary" />
            <Button title="Salvar treino" onPress={handleSaveWorkout} />
          </View>

          {pendingExercises.length > 0 && (
            <View style={styles.pendingBox}>
              <Text style={styles.pendingTitle}>Exercicios adicionados</Text>
              {pendingExercises.map((exercise, index) => (
                <Text key={exercise.id} style={styles.pendingText}>
                  {index + 1}. {exercise.locationName} - {formatDistance(exercise.distance)}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderWorkoutForm = () => (
    <>
      {renderExerciseModal()}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitle}>Novo treino</Text>
          <Button title="Cadastrar piscina" onPress={() => setIsPoolModalOpen(true)} variant="secondary" size="small" />
        </View>

        <InputField
          label="Nome do treino"
          placeholder="Opcional. Ex: Treino tecnico"
          value={workoutName}
          onChangeText={setWorkoutName}
        />
        <InputField
          label="Tempo total em minutos"
          placeholder="Ex: 75"
          value={workoutDuration}
          onChangeText={setWorkoutDuration}
          keyboardType="numeric"
        />

        <Text style={styles.fieldLabel}>Tipo do exercicio</Text>
        <View style={styles.segmentedControl}>
          {placeTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.segmentButton, workoutPlaceType === option.value && styles.segmentButtonActive]}
              onPress={() => setWorkoutPlaceType(option.value)}
            >
              <Text style={[styles.segmentText, workoutPlaceType === option.value && styles.segmentTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {workoutPlaceType === 'pool' ? (
          <Picker
            label="Piscina utilizada"
            options={poolOptions}
            value={selectedPoolId}
            onValueChange={setSelectedPoolId}
            placeholder="Cadastre ou selecione uma piscina"
          />
        ) : (
          <InputField
            label="Local"
            placeholder="Ex: Represa, mar, lago"
            value={openWaterLocation}
            onChangeText={setOpenWaterLocation}
          />
        )}

        <Button title="Salvar" onPress={handleOpenExerciseModal} />
      </View>
    </>
  );

  const renderWorkoutHistory = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Historico de treino</Text>
      {workouts.length === 0 ? (
        <Text style={styles.emptyText}>Os treinos registrados aparecerao aqui.</Text>
      ) : (
        workouts.map((workout) => <WorkoutItem key={workout.id} workout={workout} expanded />)
      )}
    </View>
  );

  const renderWorkouts = () => (
    <>
      {renderPoolModal()}
      <View style={styles.workoutTabs}>
        <TouchableOpacity
          style={[styles.workoutTabButton, workoutView === 'new' && styles.workoutTabButtonActive]}
          onPress={() => setWorkoutView('new')}
        >
          <Text style={[styles.workoutTabText, workoutView === 'new' && styles.workoutTabTextActive]}>Novo treino</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.workoutTabButton, workoutView === 'history' && styles.workoutTabButtonActive]}
          onPress={() => setWorkoutView('history')}
        >
          <Text style={[styles.workoutTabText, workoutView === 'history' && styles.workoutTabTextActive]}>Historico</Text>
        </TouchableOpacity>
      </View>
      {workoutView === 'new' ? renderWorkoutForm() : renderWorkoutHistory()}
    </>
  );

  const renderRanking = () => {
    const ranking = [
      { name: displayName, distance: stats.weeklyDistance },
      { name: 'Maria Costa', distance: 10000 },
      { name: 'Pedro Alves', distance: 8200 },
      { name: 'Ana Martins', distance: 6400 },
    ].sort((a, b) => b.distance - a.distance);

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ranking semanal</Text>
        {ranking.map((item, index) => (
          <View key={item.name} style={styles.rankingRow}>
            <Text style={styles.rankingPosition}>{index + 1}º</Text>
            <Text style={styles.rankingName}>{item.name}</Text>
            <Text style={styles.rankingDistance}>{formatDistance(item.distance)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderProfile = () => {
    if (user.accountType === 'academy') {
      return (
        <>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>Perfil da academia</Text>
              <Button title={isEditingProfile ? 'Cancelar' : 'Editar'} onPress={() => setIsEditingProfile(!isEditingProfile)} variant="secondary" size="small" />
            </View>

            {isEditingProfile ? (
              <>
                <InputField label="Nome" placeholder="Nome da academia" value={profileForm.academyProfileName} onChangeText={(value) => setProfileForm({ ...profileForm, academyProfileName: value })} />
                <InputField label="Cidade" placeholder="Cidade" value={profileForm.academyCity} onChangeText={(value) => setProfileForm({ ...profileForm, academyCity: value })} />
                <InputField label="Estado" placeholder="SP" value={profileForm.academyState} onChangeText={(value) => setProfileForm({ ...profileForm, academyState: value.toUpperCase() })} maxLength={2} />
                <InputField label="Endereco" placeholder="Opcional" value={profileForm.academyAddress} onChangeText={(value) => setProfileForm({ ...profileForm, academyAddress: value })} />
                <InputField label="Site" placeholder="Opcional" value={profileForm.academySite} onChangeText={(value) => setProfileForm({ ...profileForm, academySite: value })} />
                <InputField label="Instagram" placeholder="@suaacademia" value={profileForm.academyInstagram} onChangeText={(value) => setProfileForm({ ...profileForm, academyInstagram: value })} />
                <Button title={loading ? 'Salvando...' : 'Salvar perfil'} onPress={handleSaveProfile} loading={loading} disabled={loading} />
              </>
            ) : (
              <>
                <InfoRow label="Nome" value={user.academyProfile?.name ?? 'Nao informado'} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Cidade/Estado" value={`${user.academyProfile?.city ?? '-'} / ${user.academyProfile?.state ?? '-'}`} />
                <InfoRow label="Endereco" value={user.academyProfile?.address ?? 'Opcional'} />
                <InfoRow label="Site" value={user.academyProfile?.site ?? 'Opcional'} />
                <InfoRow label="Instagram" value={user.academyProfile?.instagram ?? 'Opcional'} />
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Afiliados</Text>
            <Text style={styles.emptyText}>Solicitacoes de vinculo e alunos afiliados vao aparecer aqui.</Text>
          </View>

          <Button title="Sair" onPress={handleLogout} variant="danger" size="large" />
        </>
      );
    }

    return (
      <>
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Perfil do aluno</Text>
            <Button title={isEditingProfile ? 'Cancelar' : 'Editar'} onPress={() => setIsEditingProfile(!isEditingProfile)} variant="secondary" size="small" />
          </View>

          {isEditingProfile ? (
            <>
              <InputField label="Nome" placeholder="Nome" value={profileForm.firstName} onChangeText={(value) => setProfileForm({ ...profileForm, firstName: value })} />
              <InputField label="Sobrenome" placeholder="Sobrenome" value={profileForm.lastName} onChangeText={(value) => setProfileForm({ ...profileForm, lastName: value })} />
              <InputField label="Cidade" placeholder="Opcional" value={profileForm.city} onChangeText={(value) => setProfileForm({ ...profileForm, city: value })} />
              <InputField label="Estado" placeholder="SP" value={profileForm.state} onChangeText={(value) => setProfileForm({ ...profileForm, state: value.toUpperCase() })} maxLength={2} />
              <InputField label="Academia/Clube" placeholder="Opcional" value={profileForm.academyName} onChangeText={(value) => setProfileForm({ ...profileForm, academyName: value })} />
              <InputField label="Tempo praticando" placeholder="Ex: 3 anos" value={profileForm.yearsPracticing} onChangeText={(value) => setProfileForm({ ...profileForm, yearsPracticing: value })} />
              <Picker label="Frequencia semanal" options={WEEKLY_FREQUENCIES} value={profileForm.weeklyFrequency} onValueChange={(value) => setProfileForm({ ...profileForm, weeklyFrequency: value as WeeklyFrequency })} placeholder="Opcional" />
              <Picker label="Periodo que pratica" options={PRACTICE_PERIODS} value={profileForm.practicePeriod} onValueChange={(value) => setProfileForm({ ...profileForm, practicePeriod: value as PracticePeriod })} placeholder="Opcional" />
              <Button title={loading ? 'Salvando...' : 'Salvar perfil'} onPress={handleSaveProfile} loading={loading} disabled={loading} />
            </>
          ) : (
            <>
              <InfoRow label="Nome" value={displayName} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Onde treina" value={user.trainingPlace ?? 'Nao informado'} />
              <InfoRow label="Modalidade principal" value={getOptionLabel(SWIMMING_MODALITIES, user.primaryModality)} />
              <InfoRow label="Cidade/Estado" value={user.city && user.state ? `${user.city}/${user.state}` : 'Opcional'} />
              <InfoRow label="Academia/Clube" value={user.academyName ?? 'Opcional'} />
              <InfoRow label="Tempo praticando" value={user.yearsPracticing ?? 'Opcional'} />
              <InfoRow label="Frequencia semanal" value={user.weeklyFrequency ? getOptionLabel(WEEKLY_FREQUENCIES, user.weeklyFrequency) : 'Opcional'} />
              <InfoRow label="Periodo" value={user.practicePeriod ? getOptionLabel(PRACTICE_PERIODS, user.practicePeriod) : 'Opcional'} />
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vinculo com academia</Text>
          <Text style={styles.emptyText}>Depois, esta area podera buscar academias no mapa ou no app e enviar solicitacao para aprovacao.</Text>
        </View>

        <Button title="Sair" onPress={handleLogout} variant="danger" size="large" />
      </>
    );
  };

  const renderContent = () => {
    if (activeTab === 'workouts') return renderWorkouts();
    if (activeTab === 'ranking') return renderRanking();
    if (activeTab === 'profile') return renderProfile();
    return renderHome();
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.goodMorning}>Ola,</Text>
            <Text style={styles.userName}>{displayName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName[0]?.toUpperCase()}</Text>
          </View>
        </View>

        {renderContent()}
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavItem icon="H" label="Home" active={activeTab === 'home'} onPress={() => setActiveTab('home')} />
        <NavItem icon="+" label="Treinos" active={activeTab === 'workouts'} onPress={() => setActiveTab('workouts')} />
        <NavItem icon="#" label="Ranking" active={activeTab === 'ranking'} onPress={() => setActiveTab('ranking')} />
        <NavItem icon="@" label="Perfil" active={activeTab === 'profile'} onPress={() => setActiveTab('profile')} />
      </View>
    </View>
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

const ScoreCard: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <View style={styles.scoreCard}>
    <View style={styles.scoreIcon}>
      <Text style={styles.scoreIconText}>{icon}</Text>
    </View>
    <Text style={styles.scoreValue}>{value}</Text>
    <Text style={styles.scoreLabel}>{label}</Text>
  </View>
);

const WorkoutItem: React.FC<{ workout: WorkoutRecord; expanded?: boolean }> = ({ workout, expanded = false }) => (
  <View style={styles.workoutItem}>
    <View style={styles.workoutRow}>
      <View style={styles.workoutInfo}>
        <Text style={styles.workoutTitle}>{workout.name}</Text>
        <Text style={styles.workoutMeta}>
          {workout.poolName || 'Local livre'} - {formatDate(workout.date)} - {workout.durationMinutes} min
        </Text>
      </View>
      <View style={styles.workoutBadge}>
        <Text style={styles.workoutBadgeText}>{formatDistance(workout.totalDistance)}</Text>
      </View>
    </View>
    {expanded && workout.exercises.map((exercise, index) => (
      <Text key={exercise.id} style={styles.exerciseDetail}>
        {index + 1}. {exercise.placeType === 'pool'
          ? `${getOptionLabel(STROKE_STYLES, exercise.strokeStyle)} com ${getOptionLabel(SWIM_ACCESSORIES, exercise.accessory)}`
          : `Aguas abertas - ${exercise.durationMinutes ?? 0} min`} - {formatDistance(exercise.distance)}
      </Text>
    ))}
  </View>
);

const NavItem: React.FC<{ icon: string; label: string; active: boolean; onPress: () => void }> = ({
  icon,
  label,
  active,
  onPress,
}) => (
  <TouchableOpacity style={[styles.navItem, active && styles.navItemActive]} onPress={onPress}>
    <Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text>
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7fbfe' },
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 104 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fbfe' },
  loadingText: { fontSize: 16, color: '#648196' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  goodMorning: { color: '#7b91a5', fontSize: 13, fontWeight: '700' },
  userName: { color: '#111827', fontSize: 23, fontWeight: '900', marginTop: 2 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#72cdeb',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 5,
  },
  avatarText: { color: '#35bdf2', fontSize: 20, fontWeight: '900' },
  heroCard: {
    minHeight: 236,
    borderRadius: 28,
    backgroundColor: '#dff5ff',
    padding: 20,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#7dbce0',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 28,
    elevation: 6,
  },
  heroOrbLarge: { position: 'absolute', right: -48, top: -28, width: 164, height: 164, borderRadius: 82, backgroundColor: '#bfeaf8' },
  heroOrbSmall: { position: 'absolute', right: 54, bottom: 54, width: 78, height: 78, borderRadius: 39, backgroundColor: '#ffffff', opacity: 0.55 },
  waveOne: { position: 'absolute', left: -20, right: -20, bottom: -34, height: 96, borderRadius: 48, backgroundColor: '#75d3f5', opacity: 0.8 },
  waveTwo: { position: 'absolute', left: 68, right: -48, bottom: -52, height: 108, borderRadius: 54, backgroundColor: '#4ec6ef', opacity: 0.65 },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  heroBadgeText: { color: '#35bdf2', fontSize: 18, fontWeight: '900' },
  heroTitle: { color: '#111827', fontSize: 25, fontWeight: '900', marginBottom: 8 },
  heroSubtitle: { color: '#617b91', fontSize: 13, lineHeight: 20, width: '74%' },
  heroMetric: {
    marginTop: 18,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  heroMetricValue: { color: '#111827', fontSize: 22, fontWeight: '900' },
  heroMetricLabel: { color: '#7b91a5', fontSize: 11, fontWeight: '800', marginTop: 2 },
  scoreGrid: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  scoreCard: {
    flex: 1,
    minHeight: 116,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 13,
    shadowColor: '#91c9e0',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 5,
  },
  scoreIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#eaf8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreIconText: { color: '#35bdf2', fontSize: 16, fontWeight: '900' },
  scoreValue: { color: '#111827', fontSize: 18, fontWeight: '900', marginBottom: 5 },
  scoreLabel: { color: '#7b91a5', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#102a43',
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
  },
  quickActionText: { flex: 1 },
  quickActionTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 4 },
  quickActionSubtitle: { color: '#b8d7ff', fontSize: 12, fontWeight: '700', lineHeight: 18 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 26,
    marginBottom: 18,
    padding: 18,
    shadowColor: '#91c9e0',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 24,
    elevation: 5,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 24, 39, 0.28)',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: '#243047', marginBottom: 8 },
  segmentedControl: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  segmentButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e3f2f8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fcff',
  },
  segmentButtonActive: { backgroundColor: '#43c7f4', borderColor: '#43c7f4' },
  segmentText: { color: '#243047', fontSize: 14, fontWeight: '800' },
  segmentTextActive: { color: '#fff' },
  workoutTabs: { flexDirection: 'row', backgroundColor: '#eaf8ff', borderRadius: 18, padding: 6, marginBottom: 18 },
  workoutTabButton: { flex: 1, minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  workoutTabButtonActive: { backgroundColor: '#43c7f4' },
  workoutTabText: { color: '#617b91', fontSize: 13, fontWeight: '900' },
  workoutTabTextActive: { color: '#fff' },
  buttonGroup: { flexDirection: 'row', gap: 10, marginTop: 2 },
  pendingBox: { marginTop: 16, borderRadius: 16, backgroundColor: '#eaf8ff', padding: 14 },
  pendingTitle: { color: '#111827', fontSize: 14, fontWeight: '900', marginBottom: 8 },
  pendingText: { color: '#617b91', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  emptyText: { color: '#687c95', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  workoutItem: { borderBottomWidth: 1, borderBottomColor: '#eef6fa', paddingBottom: 10, marginBottom: 10 },
  workoutRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  workoutInfo: { flex: 1, paddingRight: 10 },
  workoutTitle: { color: '#243047', fontSize: 15, fontWeight: '900', marginBottom: 4 },
  workoutMeta: { color: '#7b91a5', fontSize: 12, fontWeight: '600' },
  workoutBadge: { backgroundColor: '#eaf8ff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  workoutBadgeText: { color: '#1688c9', fontSize: 12, fontWeight: '900' },
  exerciseDetail: { color: '#617b91', fontSize: 12, fontWeight: '700', marginLeft: 8, marginTop: 4 },
  rankingRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eef6fa', paddingVertical: 14 },
  rankingPosition: { color: '#1688c9', fontSize: 16, fontWeight: '900', width: 38 },
  rankingName: { flex: 1, color: '#243047', fontSize: 15, fontWeight: '900' },
  rankingDistance: { color: '#617b91', fontSize: 13, fontWeight: '800' },
  infoRow: { marginBottom: 14 },
  infoLabel: { fontSize: 11, color: '#7b91a5', textTransform: 'uppercase', marginBottom: 6, fontWeight: '900' },
  infoValue: { fontSize: 15, color: '#243047', fontWeight: '800' },
  bottomNav: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    height: 66,
    borderRadius: 24,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#7dbce0',
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 24,
    elevation: 8,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 64, minHeight: 48 },
  navItemActive: { transform: [{ translateY: -2 }] },
  navIcon: { color: '#9cb1c2', fontSize: 21, fontWeight: '900', marginBottom: 3 },
  navIconActive: { color: '#35bdf2' },
  navLabel: { color: '#9cb1c2', fontSize: 11, fontWeight: '900' },
  navLabelActive: { color: '#1688c9' },
});
