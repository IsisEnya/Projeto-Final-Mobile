import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { Picker } from '../components/Picker';
import { useAuth } from '../contexts/AuthContext';
import {
  Academy,
  AcademyMembership,
  AppNotification,
  ExerciseRecord,
  PoolRecord,
  PRACTICE_PERIODS,
  PracticePeriod,
  PublicUserProfile,
  RankingEntry,
  RankingFilters,
  RankingSortBy,
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
import { academyService } from '../services/academyService';
import { rankingService } from '../services/rankingService';
import { formatDate } from '../utils/validators';

export interface HomeScreenProps {
  onLogout: () => void;
}

type AppTab = 'home' | 'workouts' | 'ranking' | 'profile';
type WorkoutView = 'new' | 'history';
type ToastType = 'success' | 'warning' | 'error';
type NavIconName = React.ComponentProps<typeof SymbolView>['name'];

const placeTypeOptions: { label: string; value: WorkoutPlaceType }[] = [
  { label: 'Piscina', value: 'pool' },
  { label: 'Aguas abertas', value: 'open-water' },
];

const navItems: { tab: AppTab; label: string; icon: NavIconName }[] = [
  { tab: 'home', label: 'Home', icon: { ios: 'house.fill', android: 'home', web: 'home' } },
  { tab: 'workouts', label: 'Treinos', icon: { ios: 'plus.circle.fill', android: 'pool', web: 'pool' } },
  { tab: 'ranking', label: 'Ranking', icon: { ios: 'trophy.fill', android: 'leaderboard', web: 'leaderboard' } },
  { tab: 'profile', label: 'Perfil', icon: { ios: 'person.crop.circle.fill', android: 'person', web: 'person' } },
];

const rankingPeriodOptions: { label: string; value: RankingFilters['period'] }[] = [
  { label: 'Semana atual', value: 'week' },
  { label: 'Mes atual', value: 'month' },
  { label: 'Ano atual', value: 'year' },
  { label: 'Geral', value: 'all' },
];

const rankingSortOptions: { label: string; value: RankingSortBy }[] = [
  { label: 'Distancia total', value: 'distance' },
  { label: 'Chegadas totais', value: 'arrivals' },
  { label: 'Tempo treinado', value: 'time' },
  { label: 'Treinos realizados', value: 'workouts' },
  { label: 'Diversidade de nados', value: 'stroke-diversity' },
];

const rankingModalityOptions: { label: string; value: RankingFilters['modality'] }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Piscina', value: 'pool' },
  { label: 'Aguas abertas', value: 'open-water' },
];

const rankingStrokeOptions: { label: string; value: RankingFilters['stroke'] }[] = [
  { label: 'Todos', value: 'all' },
  ...STROKE_STYLES,
];

const rankingAcademyOptions: { label: string; value: RankingFilters['academy'] }[] = [
  { label: 'Todas as academias', value: 'all' },
  { label: 'Minha academia', value: 'my-academy' },
];

const rankingLocationOptions: { label: string; value: RankingFilters['location'] }[] = [
  { label: 'Geral', value: 'all' },
  { label: 'Minha cidade', value: 'my-city' },
  { label: 'Meu estado', value: 'my-state' },
];

const formatDistance = (meters: number) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2).replace('.', ',')} km`;
  return `${meters} m`;
};

const formatDuration = (minutes: number) => {
  const safeMinutes = Math.max(Math.round(minutes), 0);
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  if (hours === 0) return `${remainingMinutes} min`;
  return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
};

const getRankingPeriodStart = (period: RankingFilters['period']) => {
  const now = new Date();
  if (period === 'all') return null;
  if (period === 'year') return new Date(now.getFullYear(), 0, 1);
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);

  const weekStart = new Date(now);
  const day = weekStart.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

const getRankingMetric = (entry: RankingEntry, sortBy: RankingSortBy) => {
  if (sortBy === 'arrivals') return entry.arrivals;
  if (sortBy === 'time') return entry.timeMinutes;
  if (sortBy === 'workouts') return entry.workoutCount;
  if (sortBy === 'stroke-diversity') return entry.strokeDiversity;
  return entry.distance;
};

const sortRankingEntries = (entries: RankingEntry[], sortBy: RankingSortBy) =>
  [...entries]
    .sort((a, b) => {
      const metricDifference = getRankingMetric(b, sortBy) - getRankingMetric(a, sortBy);
      if (metricDifference !== 0) return metricDifference;
      if (b.distance !== a.distance) return b.distance - a.distance;
      if (b.workoutCount !== a.workoutCount) return b.workoutCount - a.workoutCount;
      if (b.timeMinutes !== a.timeMinutes) return b.timeMinutes - a.timeMinutes;
      return a.name.localeCompare(b.name);
    })
    .map((entry, index) => ({ ...entry, position: index + 1 }));

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
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const [academySearch, setAcademySearch] = useState('');
  const [academyResults, setAcademyResults] = useState<Array<{
    id: string;
    name: string;
    logo?: string;
    city: string;
    state: string;
    membershipStatus: string;
  }>>([]);
  const [ownedAcademy, setOwnedAcademy] = useState<Academy | null>(null);
  const [approvedMembership, setApprovedMembership] = useState<AcademyMembership | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Array<{ membership: AcademyMembership; user?: any }>>([]);
  const [linkedStudents, setLinkedStudents] = useState<Array<{ membership: AcademyMembership; user?: any }>>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [rankingFilters, setRankingFilters] = useState<RankingFilters>({
    period: 'week',
    modality: 'all',
    stroke: 'all',
    academy: 'all',
    location: 'all',
    sortBy: 'distance',
  });
  const [rankingEntries, setRankingEntries] = useState<RankingEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<RankingEntry | null>(null);
  const [selectedPublicProfile, setSelectedPublicProfile] = useState<PublicUserProfile | null>(null);
  const [isPublicProfileOpen, setIsPublicProfileOpen] = useState(false);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [isRankingFiltersOpen, setIsRankingFiltersOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    city: '',
    state: '',
    profilePhoto: '',
    academyName: '',
    yearsPracticing: '',
    weeklyFrequency: '' as WeeklyFrequency | '',
    practicePeriod: '' as PracticePeriod | '',
    academyProfileName: '',
    academyCity: '',
    academyState: '',
    academyLogo: '',
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
  const profileImageUri = user?.accountType === 'academy' ? user.academyProfile?.logo : user?.profilePhoto;

  const showToast = (message: string, type: ToastType = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const loadAcademyState = async () => {
    if (!user) return;

    const userNotifications = await academyService.listNotifications(user.id);
    setNotifications(userNotifications);

    if (user.accountType === 'academy') {
      const academy = await academyService.getAcademyByOwner(user.id);
      setOwnedAcademy(academy);

      if (academy) {
        const [requests, students] = await Promise.all([
          academyService.listPendingRequests(user.id, academy.id),
          academyService.listApprovedStudents(user.id, academy.id),
        ]);
        setPendingRequests(requests);
        setLinkedStudents(students);
      }
    } else {
      const membership = await academyService.getApprovedMembershipForUser(user.id);
      setApprovedMembership(membership);
    }
  };

  const buildCurrentUserRankingEntry = (): RankingEntry | null => {
    if (!user || user.accountType !== 'student') return null;

    const periodStart = getRankingPeriodStart(rankingFilters.period);
    const strokeSet = new Set<StrokeStyle>();
    let distance = 0;
    let arrivalsTotal = 0;
    let timeMinutes = 0;
    let workoutCount = 0;

    workouts.forEach((workout) => {
      if (periodStart && new Date(workout.date).getTime() < periodStart.getTime()) return;

      const exercises = workout.exercises.length > 0
        ? workout.exercises
        : [{
            id: `${workout.id}-fallback`,
            placeType: workout.placeType,
            distance: workout.totalDistance,
          }];

      const matchingExercises = exercises.filter((exercise) => {
        if (rankingFilters.modality !== 'all' && exercise.placeType !== rankingFilters.modality) return false;
        if (rankingFilters.stroke !== 'all' && exercise.strokeStyle !== rankingFilters.stroke) return false;
        return true;
      });

      if (matchingExercises.length === 0) return;

      workoutCount += 1;
      timeMinutes += workout.durationMinutes ?? 0;
      matchingExercises.forEach((exercise) => {
        distance += exercise.distance ?? 0;
        arrivalsTotal += exercise.arrivals ?? 0;
        if (exercise.strokeStyle) strokeSet.add(exercise.strokeStyle);
      });
    });

    if (distance <= 0 && arrivalsTotal <= 0 && timeMinutes <= 0 && workoutCount <= 0) return null;

    return {
      userId: user.id,
      position: 0,
      name: displayName,
      profilePhoto: user.profilePhoto,
      city: user.city,
      state: user.state,
      academyName: user.academyName,
      academyId: user.academyId,
      distance,
      arrivals: arrivalsTotal,
      timeMinutes,
      workoutCount,
      strokeDiversity: strokeSet.size,
    };
  };

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
        showToast('Nao foi possivel carregar seus treinos.', 'error');
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
      profilePhoto: user.profilePhoto ?? '',
      academyName: user.academyName ?? '',
      yearsPracticing: user.yearsPracticing ?? '',
      weeklyFrequency: user.weeklyFrequency ?? '',
      practicePeriod: user.practicePeriod ?? '',
      academyProfileName: user.academyProfile?.name ?? '',
      academyCity: user.academyProfile?.city ?? '',
      academyState: user.academyProfile?.state ?? '',
      academyLogo: user.academyProfile?.logo ?? '',
      academyAddress: user.academyProfile?.address ?? '',
      academySite: user.academyProfile?.site ?? '',
      academyInstagram: user.academyProfile?.instagram ?? '',
    });
  }, [user]);

  useEffect(() => {
    loadAcademyState();
  }, [user?.id]);

  const loadRanking = async () => {
    if (!user) return;

    try {
      setIsRankingLoading(true);
      const result = await rankingService.listRanking(rankingFilters, user, { page: 1, pageSize: 50 });
      const localCurrentUserEntry = buildCurrentUserRankingEntry();
      const mergedEntries = localCurrentUserEntry
        ? [
            localCurrentUserEntry,
            ...result.entries.filter((entry) => entry.userId !== localCurrentUserEntry.userId),
          ]
        : result.entries;
      const sortedEntries = sortRankingEntries(mergedEntries, rankingFilters.sortBy);
      const currentEntry = sortedEntries.find((entry) => entry.userId === user.id) ?? null;

      setRankingEntries(sortedEntries);
      setCurrentUserRank(currentEntry);
    } catch (error) {
      showToast('Nao foi possivel carregar o ranking.', 'error');
    } finally {
      setIsRankingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ranking') {
      loadRanking();
    }
  }, [activeTab, rankingFilters, user?.id, workouts.length]);

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
      showToast('Informe o nome e o comprimento da piscina.', 'warning');
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
    showToast(`${newPool.name} foi salva com sucesso.`, 'success');
  };

  const handleAddExercise = () => {
    const selectedPool = pools.find((pool) => pool.id === selectedPoolId);

    if (workoutPlaceType === 'pool') {
      const arrivalsNumber = Number(arrivals.replace(',', '.'));
      if (!selectedPool || !arrivalsNumber) {
        showToast('Selecione a piscina e informe as chegadas.', 'warning');
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
      showToast(`${formatDistance(newExercise.distance)} adicionados ao treino.`, 'success');
      return;
    }

    const distance = Number(openWaterDistance.replace(',', '.'));
    const duration = Number(openWaterTime.replace(',', '.'));
    if (!openWaterLocation.trim() || !distance || !duration) {
      showToast('Informe local, distancia e tempo de aguas abertas.', 'warning');
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
    showToast(`${formatDistance(distance)} em aguas abertas.`, 'success');
  };

  const handleOpenExerciseModal = () => {
    const duration = Number(workoutDuration.replace(',', '.'));

    if (!duration) {
      showToast('Informe o tempo total do treino.', 'warning');
      return;
    }

    if (workoutPlaceType === 'pool' && !selectedPoolId) {
      showToast('Selecione a piscina utilizada.', 'warning');
      return;
    }

    if (workoutPlaceType === 'open-water' && !openWaterLocation.trim()) {
      showToast('Informe o local do treino em aguas abertas.', 'warning');
      return;
    }

    setIsExerciseModalOpen(true);
  };

  const handleSaveWorkout = async () => {
    if (pendingExercises.length === 0) {
      showToast('Adicione pelo menos um exercicio ao treino.', 'warning');
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
    showToast(`${newWorkout.name} foi registrado com sucesso.`, 'success');
  };

  const handleSaveProfile = async () => {
    if (user.accountType === 'academy') {
      await updateProfile({
        academyProfile: {
          id: user.academyProfile?.id ?? `academy-${user.id}`,
          name: profileForm.academyProfileName,
          logo: profileForm.academyLogo.trim() || undefined,
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
        profilePhoto: profileForm.profilePhoto.trim() || undefined,
        academyName: profileForm.academyName,
        yearsPracticing: profileForm.yearsPracticing,
        weeklyFrequency: profileForm.weeklyFrequency || undefined,
        practicePeriod: profileForm.practicePeriod || undefined,
      });
    }

    setIsEditingProfile(false);
    showToast('Suas informacoes foram salvas.', 'success');
    await loadAcademyState();
  };

  const handleSearchAcademies = async () => {
    if (!academySearch.trim()) {
      showToast('Digite o nome da academia para pesquisar.', 'warning');
      return;
    }

    const results = await academyService.searchAcademiesByName(academySearch, user.id);
    setAcademyResults(results);

    if (results.length === 0) {
      showToast('Nenhuma academia encontrada.', 'warning');
    }
  };

  const handleRequestMembership = async (academyId: string) => {
    try {
      await academyService.requestMembership(user.id, academyId);
      showToast('Solicitacao enviada para a academia.', 'success');
      const results = await academyService.searchAcademiesByName(academySearch, user.id);
      setAcademyResults(results);
      await loadAcademyState();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Nao foi possivel solicitar vinculo.', 'warning');
    }
  };

  const handleApproveMembership = async (membershipId: string) => {
    try {
      await academyService.approveMembership(user.id, membershipId);
      showToast('Solicitacao aprovada.', 'success');
      await loadAcademyState();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Nao foi possivel aprovar.', 'error');
    }
  };

  const handleRejectMembership = async (membershipId: string) => {
    try {
      await academyService.rejectMembership(user.id, membershipId);
      showToast('Solicitacao recusada.', 'success');
      await loadAcademyState();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Nao foi possivel recusar.', 'error');
    }
  };

  const handleLeaveAcademy = async () => {
    if (!approvedMembership) {
      showToast('Voce nao possui vinculo aprovado.', 'warning');
      return;
    }

    try {
      await academyService.leaveAcademy(user.id, approvedMembership.academyId);
      showToast('Voce saiu da academia.', 'success');
      await updateProfile({ academyId: undefined, academyName: undefined });
      await loadAcademyState();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Nao foi possivel sair da academia.', 'error');
    }
  };

  const handleRemoveStudent = async (membershipId: string) => {
    try {
      await academyService.removeStudent(user.id, membershipId);
      showToast('Aluno removido da academia.', 'success');
      await loadAcademyState();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Nao foi possivel remover aluno.', 'error');
    }
  };

  const handleReadNotification = async (notificationId: string) => {
    try {
      await academyService.markNotificationAsRead(user.id, notificationId);
      await loadAcademyState();
    } catch (error) {
      showToast('Nao foi possivel marcar notificacao como lida.', 'error');
    }
  };

  const updateRankingFilter = <K extends keyof RankingFilters>(key: K, value: RankingFilters[K]) => {
    setRankingFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  };

  const handleOpenPublicProfile = async (userId: string) => {
    try {
      const profile = await rankingService.getPublicUserProfile(userId);
      if (!profile) {
        showToast('Perfil publico nao encontrado.', 'warning');
        return;
      }

      setSelectedPublicProfile(profile);
      setIsPublicProfileOpen(true);
    } catch (error) {
      showToast('Nao foi possivel abrir o perfil.', 'error');
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
    onLogout();
  };

  const renderHome = () => (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroOrbLarge} />
        <View style={styles.heroOrbSmall} />
        <View style={styles.waveOne} />
        <View style={styles.waveTwo} />
        <View style={styles.heroBadge}>
          <Image source={require('../../assets/images/hydro-pump-logo.png')} style={styles.heroLogoImage} />
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

  const renderPublicProfileModal = () => (
    <Modal
      visible={isPublicProfileOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setIsPublicProfileOpen(false)}
    >
      <View style={styles.confirmBackdrop}>
        <View style={styles.publicProfileCard}>
          {selectedPublicProfile && (
            <>
              <View style={styles.publicProfileAvatarWrap}>
                <AvatarCircle
                  name={selectedPublicProfile.name}
                  uri={selectedPublicProfile.profilePhoto}
                  size={68}
                />
              </View>
              <Text style={styles.publicProfileName}>{selectedPublicProfile.name}</Text>
              <Text style={styles.publicProfileMeta}>
                {[selectedPublicProfile.city && selectedPublicProfile.state
                  ? `${selectedPublicProfile.city}/${selectedPublicProfile.state}`
                  : '', selectedPublicProfile.academyName]
                  .filter(Boolean)
                  .join(' - ') || 'Atleta Hydro Pump'}
              </Text>

              <View style={styles.publicProfileStats}>
                <View style={styles.publicProfileStat}>
                  <Text style={styles.publicProfileStatValue}>{formatDistance(selectedPublicProfile.distance)}</Text>
                  <Text style={styles.publicProfileStatLabel}>Distancia</Text>
                </View>
                <View style={styles.publicProfileStat}>
                  <Text style={styles.publicProfileStatValue}>{selectedPublicProfile.workoutCount}</Text>
                  <Text style={styles.publicProfileStatLabel}>Treinos</Text>
                </View>
              </View>

              <InfoRow
                label="Modalidade principal"
                value={getOptionLabel(SWIMMING_MODALITIES, selectedPublicProfile.primaryModality)}
              />
              <InfoRow
                label="Tempo praticando"
                value={selectedPublicProfile.yearsPracticing ?? 'Nao informado'}
              />
              <InfoRow
                label="Estilos favoritos"
                value={
                  selectedPublicProfile.favoriteStrokes.length > 0
                    ? selectedPublicProfile.favoriteStrokes
                        .map((stroke) => getOptionLabel(STROKE_STYLES, stroke))
                        .join(', ')
                    : 'Nao informado'
                }
              />
              <InfoRow
                label="Conquistas"
                value={
                  selectedPublicProfile.achievements.length > 0
                    ? selectedPublicProfile.achievements.join(', ')
                    : 'Ainda sem conquistas publicas'
                }
              />
            </>
          )}
          <Button title="Fechar" onPress={() => setIsPublicProfileOpen(false)} />
        </View>
      </View>
    </Modal>
  );

  const renderRankingFiltersModal = () => (
    <Modal
      visible={isRankingFiltersOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setIsRankingFiltersOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={styles.modalBackdropTouch} activeOpacity={1} onPress={() => setIsRankingFiltersOpen(false)} />
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.modalEyebrow}>Ranking</Text>
              <Text style={styles.cardTitle}>Filtros</Text>
            </View>
            <Button title="Fechar" onPress={() => setIsRankingFiltersOpen(false)} variant="secondary" size="small" />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Picker
              label="Periodo"
              options={rankingPeriodOptions}
              value={rankingFilters.period}
              onValueChange={(value) => updateRankingFilter('period', value as RankingFilters['period'])}
            />
            <Picker
              label="Ordenar por"
              options={rankingSortOptions}
              value={rankingFilters.sortBy}
              onValueChange={(value) => updateRankingFilter('sortBy', value as RankingSortBy)}
            />
            <Picker
              label="Modalidade"
              options={rankingModalityOptions}
              value={rankingFilters.modality}
              onValueChange={(value) => updateRankingFilter('modality', value as RankingFilters['modality'])}
            />
            <Picker
              label="Estilo de nado"
              options={rankingStrokeOptions}
              value={rankingFilters.stroke}
              onValueChange={(value) => updateRankingFilter('stroke', value as RankingFilters['stroke'])}
            />
            <Picker
              label="Academia"
              options={rankingAcademyOptions}
              value={rankingFilters.academy}
              onValueChange={(value) => updateRankingFilter('academy', value as RankingFilters['academy'])}
            />
            <Picker
              label="Localizacao"
              options={rankingLocationOptions}
              value={rankingFilters.location}
              onValueChange={(value) => updateRankingFilter('location', value as RankingFilters['location'])}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderRankingScreen = () => (
    <>
      {renderPublicProfileModal()}
      {renderRankingFiltersModal()}
      <View style={styles.rankingHero}>
        <View>
          <Text style={styles.rankingHeroLabel}>Seu placar</Text>
          <Text style={styles.rankingHeroTitle}>
            {currentUserRank ? `${currentUserRank.position}o lugar` : 'Sem posicao'}
          </Text>
          <Text style={styles.rankingHeroMeta}>
            {currentUserRank
              ? `${formatDistance(currentUserRank.distance)} - ${currentUserRank.workoutCount} treinos`
              : 'Registre treinos para entrar no ranking.'}
          </Text>
        </View>
        <View style={styles.rankingHeroBadge}>
          <Text style={styles.rankingHeroBadgeText}>#</Text>
        </View>
      </View>

      <View style={styles.rankingFilterBar}>
        <View style={styles.rankingFilterSummary}>
          <Text style={styles.rankingFilterLabel}>Filtros ativos</Text>
          <Text style={styles.rankingFilterText}>
            {getOptionLabel(rankingPeriodOptions, rankingFilters.period)} - {getOptionLabel(rankingSortOptions, rankingFilters.sortBy)}
          </Text>
        </View>
        <Button title="Filtros" onPress={() => setIsRankingFiltersOpen(true)} variant="secondary" size="small" />
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitle}>Ranking</Text>
          <Text style={styles.rankingCount}>{rankingEntries.length} atletas</Text>
        </View>

        {isRankingLoading ? (
          <Text style={styles.emptyText}>Carregando ranking...</Text>
        ) : rankingEntries.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum treino encontrado para esses filtros.</Text>
        ) : (
          rankingEntries.map((entry) => (
            <TouchableOpacity
              key={entry.userId}
              style={styles.rankingCard}
              onPress={() => handleOpenPublicProfile(entry.userId)}
            >
              <Text style={styles.rankingPosition}>{entry.position}o</Text>
              <AvatarCircle name={entry.name} uri={entry.profilePhoto} size={42} />
              <View style={styles.rankingInfo}>
                <Text style={styles.rankingName}>{entry.name}</Text>
                <Text style={styles.rankingMeta}>
                  {[entry.city && entry.state ? `${entry.city}/${entry.state}` : '', entry.academyName]
                    .filter(Boolean)
                    .join(' - ') || 'Sem local informado'}
                </Text>
                <View style={styles.rankingStatsRow}>
                  <Text style={styles.rankingStat}>{formatDistance(entry.distance)}</Text>
                  <Text style={styles.rankingStat}>{entry.arrivals} chegadas</Text>
                  <Text style={styles.rankingStat}>{formatDuration(entry.timeMinutes)}</Text>
                </View>
                <Text style={styles.rankingDetail}>
                  {entry.workoutCount} treinos - {entry.strokeDiversity} estilos diferentes
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </>
  );

  const renderRanking = () => {
    const ranking: Array<{ name: string; distance: number }> = [];

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
                <InputField label="Logo/foto" placeholder="Cole uma URL de imagem" value={profileForm.academyLogo} onChangeText={(value) => setProfileForm({ ...profileForm, academyLogo: value })} />
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
                <InfoRow label="Logo/foto" value={user.academyProfile?.logo ? 'Imagem cadastrada' : 'Opcional'} />
                <InfoRow label="Cidade/Estado" value={`${user.academyProfile?.city ?? '-'} / ${user.academyProfile?.state ?? '-'}`} />
                <InfoRow label="Endereco" value={user.academyProfile?.address ?? 'Opcional'} />
                <InfoRow label="Site" value={user.academyProfile?.site ?? 'Opcional'} />
                <InfoRow label="Instagram" value={user.academyProfile?.instagram ?? 'Opcional'} />
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Afiliados</Text>
            <Text style={styles.subTitle}>Solicitacoes pendentes</Text>
            {pendingRequests.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma solicitacao pendente.</Text>
            ) : (
              pendingRequests.map((request) => (
                <View key={request.membership.id} style={styles.membershipRow}>
                  <View style={styles.membershipInfo}>
                    <Text style={styles.membershipName}>
                      {request.user?.firstName} {request.user?.lastName}
                    </Text>
                    <Text style={styles.membershipMeta}>{request.user?.email}</Text>
                  </View>
                  <View style={styles.membershipActions}>
                    <Button title="Aprovar" onPress={() => handleApproveMembership(request.membership.id)} size="small" />
                    <Button title="Recusar" onPress={() => handleRejectMembership(request.membership.id)} variant="secondary" size="small" />
                  </View>
                </View>
              ))
            )}

            <Text style={styles.subTitle}>Alunos vinculados</Text>
            {linkedStudents.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum aluno vinculado ainda.</Text>
            ) : (
              linkedStudents.map((student) => (
                <View key={student.membership.id} style={styles.membershipRow}>
                  <View style={styles.membershipInfo}>
                    <Text style={styles.membershipName}>
                      {student.user?.firstName} {student.user?.lastName}
                    </Text>
                    <Text style={styles.membershipMeta}>{student.user?.email}</Text>
                  </View>
                  <Button title="Remover" onPress={() => handleRemoveStudent(student.membership.id)} variant="danger" size="small" />
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notificacoes</Text>
            {notifications.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma notificacao por enquanto.</Text>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[styles.notificationRow, !notification.read && styles.notificationUnread]}
                  onPress={() => handleReadNotification(notification.id)}
                >
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                </TouchableOpacity>
              ))
            )}
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
              <InputField label="Foto de perfil" placeholder="Cole uma URL de imagem" value={profileForm.profilePhoto} onChangeText={(value) => setProfileForm({ ...profileForm, profilePhoto: value })} />
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
              <InfoRow label="Foto de perfil" value={user.profilePhoto ? 'Imagem cadastrada' : 'Opcional'} />
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
          {user.academyName ? (
            <>
              <InfoRow label="Academia atual" value={user.academyName} />
              <Button title="Sair da academia" onPress={handleLeaveAcademy} variant="secondary" />
            </>
          ) : (
            <>
              <InputField
                label="Pesquisar academia"
                placeholder="Digite o nome da academia"
                value={academySearch}
                onChangeText={setAcademySearch}
              />
              <Button title="Buscar academia" onPress={handleSearchAcademies} variant="secondary" />

              {academyResults.map((academy) => (
                <View key={academy.id} style={styles.academyResultRow}>
                  <View style={styles.academyAvatar}>
                    <Text style={styles.academyAvatarText}>{academy.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.membershipInfo}>
                    <Text style={styles.membershipName}>{academy.name}</Text>
                    <Text style={styles.membershipMeta}>
                      {academy.city}/{academy.state} - {academy.membershipStatus}
                    </Text>
                  </View>
                  {academy.membershipStatus === 'none' || academy.membershipStatus === 'rejected' ? (
                    <Button title="Solicitar" onPress={() => handleRequestMembership(academy.id)} size="small" />
                  ) : (
                    <Text style={styles.statusPill}>{academy.membershipStatus}</Text>
                  )}
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notificacoes</Text>
          {notifications.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma notificacao por enquanto.</Text>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[styles.notificationRow, !notification.read && styles.notificationUnread]}
                onPress={() => handleReadNotification(notification.id)}
              >
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <Button title="Sair" onPress={handleLogout} variant="danger" size="large" />
      </>
    );
  };

  const renderContent = () => {
    if (activeTab === 'workouts') return renderWorkouts();
    if (activeTab === 'ranking') return renderRankingScreen();
    if (activeTab === 'profile') return renderProfile();
    return renderHome();
  };

  return (
    <View style={styles.screen}>
      <Modal
        visible={isLogoutModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsLogoutModalOpen(false)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Text style={styles.confirmIconText}>!</Text>
            </View>
            <Text style={styles.confirmTitle}>Sair da conta?</Text>
            <Text style={styles.confirmText}>
              Voce vai voltar para a tela de login, mas seus dados locais continuam salvos.
            </Text>
            <View style={styles.confirmActions}>
              <View style={styles.confirmActionButton}>
                <Button title="Cancelar" onPress={() => setIsLogoutModalOpen(false)} variant="secondary" />
              </View>
              <View style={styles.confirmActionButton}>
                <Button title="Sair" onPress={confirmLogout} variant="danger" />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {toast && (
        <View style={[styles.toast, styles[`toast_${toast.type}`]]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.goodMorning}>Ola,</Text>
            <Text style={styles.userName}>{displayName}</Text>
          </View>
          <AvatarCircle name={displayName} uri={profileImageUri} size={48} />
        </View>

        {renderContent()}
      </ScrollView>

      <View style={styles.bottomNav}>
        {navItems.map((item) => (
          <NavItem
            key={item.tab}
            icon={item.icon}
            label={item.label}
            active={activeTab === item.tab}
            onPress={() => setActiveTab(item.tab)}
          />
        ))}
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

const AvatarCircle: React.FC<{ name: string; uri?: string; size: number }> = ({ name, uri, size }) => {
  const radius = Math.round(size * 0.36);

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: radius }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius }} />
      ) : (
        <Text style={[styles.avatarText, { fontSize: Math.max(16, Math.round(size * 0.42)) }]}>
          {name[0]?.toUpperCase()}
        </Text>
      )}
    </View>
  );
};

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

const NavItem: React.FC<{ icon: NavIconName; label: string; active: boolean; onPress: () => void }> = ({
  icon,
  label,
  active,
  onPress,
}) => (
  <TouchableOpacity style={[styles.navItem, active && styles.navItemActive]} onPress={onPress}>
    <View style={[styles.navIconShell, active && styles.navIconShellActive]}>
      <SymbolView
        name={icon}
        size={22}
        tintColor={active ? '#fff' : '#9cb1c2'}
        fallback={<Text style={[styles.navIcon, active && styles.navIconActive]}>{label[0]}</Text>}
      />
    </View>
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7fbfe' },
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 120 },
  toast: {
    position: 'absolute',
    top: 56,
    left: 18,
    right: 18,
    zIndex: 100,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#102a43',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 24,
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
  toastText: { color: '#102a43', fontSize: 14, fontWeight: '900', textAlign: 'center', lineHeight: 20 },
  confirmBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
    backgroundColor: 'rgba(16, 42, 67, 0.38)',
  },
  confirmCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#102a43',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 28,
    elevation: 18,
  },
  confirmIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: '#eaf8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmIconText: { color: '#1688c9', fontSize: 28, fontWeight: '900' },
  confirmTitle: { color: '#111827', fontSize: 21, fontWeight: '900', marginBottom: 8 },
  confirmText: {
    color: '#617b91',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 14,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  confirmActionButton: {
    flex: 1,
    maxWidth: 180,
  },
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
    overflow: 'hidden',
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
  heroLogoImage: { width: 38, height: 31, resizeMode: 'contain' },
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
  modalBackdropTouch: {
    flex: 1,
  },
  modalCard: {
    maxHeight: '84%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#d7effa',
    marginBottom: 14,
  },
  modalEyebrow: {
    color: '#7b91a5',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 16 },
  subTitle: { color: '#243047', fontSize: 14, fontWeight: '900', marginBottom: 10, marginTop: 8 },
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
  rankingHero: {
    minHeight: 142,
    borderRadius: 26,
    backgroundColor: '#102a43',
    padding: 18,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#102a43',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 24,
    elevation: 6,
  },
  rankingHeroLabel: { color: '#b8d7ff', fontSize: 12, fontWeight: '900', marginBottom: 8, textTransform: 'uppercase' },
  rankingHeroTitle: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 6 },
  rankingHeroMeta: { color: '#d7efff', fontSize: 13, fontWeight: '700', lineHeight: 19, maxWidth: 220 },
  rankingHeroBadge: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: '#43c7f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingHeroBadgeText: { color: '#fff', fontSize: 30, fontWeight: '900' },
  rankingFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 14,
    marginBottom: 18,
    shadowColor: '#91c9e0',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 4,
  },
  rankingFilterSummary: {
    flex: 1,
  },
  rankingFilterLabel: {
    color: '#7b91a5',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  rankingFilterText: {
    color: '#243047',
    fontSize: 13,
    fontWeight: '900',
  },
  rankingCount: { color: '#7b91a5', fontSize: 12, fontWeight: '900' },
  rankingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e3f2f8',
    backgroundColor: '#f8fcff',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  rankingRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eef6fa', paddingVertical: 14 },
  rankingPosition: { color: '#1688c9', fontSize: 16, fontWeight: '900', width: 34, paddingTop: 8 },
  rankingAvatar: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#eaf8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingAvatarText: { color: '#1688c9', fontSize: 18, fontWeight: '900' },
  rankingInfo: { flex: 1 },
  rankingName: { color: '#243047', fontSize: 15, fontWeight: '900', marginBottom: 4 },
  rankingMeta: { color: '#7b91a5', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  rankingStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  rankingStat: {
    color: '#1688c9',
    backgroundColor: '#eaf8ff',
    borderRadius: 99,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '900',
  },
  rankingDetail: { color: '#617b91', fontSize: 12, fontWeight: '700' },
  rankingDistance: { color: '#617b91', fontSize: 13, fontWeight: '800' },
  publicProfileCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 22,
    shadowColor: '#102a43',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 28,
    elevation: 18,
  },
  publicProfileAvatarWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  publicProfileAvatar: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: '#eaf8ff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  publicProfileAvatarText: { color: '#1688c9', fontSize: 28, fontWeight: '900' },
  publicProfileName: { color: '#111827', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 5 },
  publicProfileMeta: { color: '#617b91', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  publicProfileStats: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  publicProfileStat: { flex: 1, backgroundColor: '#f8fcff', borderRadius: 16, padding: 12, alignItems: 'center' },
  publicProfileStatValue: { color: '#1688c9', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  publicProfileStatLabel: { color: '#7b91a5', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  membershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef6fa',
    paddingVertical: 12,
  },
  membershipInfo: { flex: 1 },
  membershipName: { color: '#243047', fontSize: 14, fontWeight: '900', marginBottom: 3 },
  membershipMeta: { color: '#7b91a5', fontSize: 12, fontWeight: '700' },
  membershipActions: { gap: 8 },
  academyResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef6fa',
    paddingVertical: 12,
  },
  academyAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#eaf8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  academyAvatarText: { color: '#1688c9', fontSize: 17, fontWeight: '900' },
  statusPill: {
    color: '#1688c9',
    backgroundColor: '#eaf8ff',
    borderRadius: 99,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: '900',
  },
  notificationRow: {
    borderRadius: 16,
    backgroundColor: '#f8fcff',
    borderWidth: 1,
    borderColor: '#e3f2f8',
    padding: 12,
    marginBottom: 10,
  },
  notificationUnread: {
    backgroundColor: '#eaf8ff',
    borderColor: '#bce8f8',
  },
  notificationTitle: { color: '#243047', fontSize: 14, fontWeight: '900', marginBottom: 4 },
  notificationMessage: { color: '#617b91', fontSize: 12, fontWeight: '700', lineHeight: 18 },
  infoRow: { marginBottom: 14 },
  infoLabel: { fontSize: 11, color: '#7b91a5', textTransform: 'uppercase', marginBottom: 6, fontWeight: '900' },
  infoValue: { fontSize: 15, color: '#243047', fontWeight: '800' },
  bottomNav: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    minHeight: 72,
    borderRadius: 28,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#7dbce0',
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 24,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderRadius: 20,
  },
  navItemActive: { backgroundColor: '#f0fbff' },
  navIconShell: {
    width: 34,
    height: 30,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  navIconShellActive: {
    backgroundColor: '#35bdf2',
    shadowColor: '#35bdf2',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 4,
  },
  navIcon: { color: '#9cb1c2', fontSize: 18, fontWeight: '900' },
  navIconActive: { color: '#35bdf2' },
  navLabel: { color: '#9cb1c2', fontSize: 10, fontWeight: '900' },
  navLabelActive: { color: '#1688c9' },
});
