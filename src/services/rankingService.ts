import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PublicUserProfile,
  RankingEntry,
  RankingFilters,
  RankingResult,
  StrokeStyle,
  STROKE_STYLES,
  SWIMMING_MODALITIES,
  User,
  WorkoutRecord,
} from '../types';

type RankingPageOptions = {
  page?: number;
  pageSize?: number;
};

type RankingTotals = Omit<RankingEntry, 'position'> & {
  strokeSet: Set<StrokeStyle>;
};

const DEFAULT_PAGE_SIZE = 30;

const getUserDisplayName = (user: User) =>
  `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
  user.academyProfile?.name ||
  'Aluno Hydro Pump';

const normalizeText = (value?: string) => value?.trim().toLowerCase() ?? '';

const isSameAcademy = (target: User, currentUser: User) => {
  if (!currentUser.academyId && !currentUser.academyName) return false;
  if (currentUser.academyId && target.academyId === currentUser.academyId) return true;
  return normalizeText(target.academyName) === normalizeText(currentUser.academyName);
};

const getPeriodStart = (period: RankingFilters['period']) => {
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

const getMetricValue = (entry: RankingEntry, sortBy: RankingFilters['sortBy']) => {
  if (sortBy === 'arrivals') return entry.arrivals;
  if (sortBy === 'time') return entry.timeMinutes;
  if (sortBy === 'workouts') return entry.workoutCount;
  if (sortBy === 'stroke-diversity') return entry.strokeDiversity;
  return entry.distance;
};

class RankingService {
  private readonly USERS_KEY = 'users_data';

  async listRanking(
    filters: RankingFilters,
    currentUser: User,
    pageOptions: RankingPageOptions = {}
  ): Promise<RankingResult> {
    const page = Math.max(pageOptions.page ?? 1, 1);
    const pageSize = Math.max(pageOptions.pageSize ?? DEFAULT_PAGE_SIZE, 1);
    const users = await this.getUsers();
    const students = users.filter((user) => user.accountType === 'student');
    const entries = await Promise.all(
      students
        .filter((student) => this.matchesUserFilters(student, currentUser, filters))
        .map((student) => this.buildEntry(student, filters))
    );

    const rankedEntries = entries
      .filter((entry) => entry.distance > 0 || entry.arrivals > 0 || entry.timeMinutes > 0 || entry.workoutCount > 0)
      .sort((a, b) => this.compareEntries(a, b, filters.sortBy))
      .map((entry, index) => ({ ...entry, position: index + 1 }));

    const start = (page - 1) * pageSize;
    const currentUserEntry = rankedEntries.find((entry) => entry.userId === currentUser.id);

    return {
      entries: rankedEntries.slice(start, start + pageSize),
      total: rankedEntries.length,
      currentUserPosition: currentUserEntry?.position,
      currentUserEntry,
    };
  }

  async getCurrentUserPosition(userId: string, filters: RankingFilters): Promise<RankingEntry | null> {
    const users = await this.getUsers();
    const currentUser = users.find((user) => user.id === userId);
    if (!currentUser) return null;

    const result = await this.listRanking(filters, currentUser, { page: 1, pageSize: Number.MAX_SAFE_INTEGER });
    return result.currentUserEntry ?? null;
  }

  async getPublicUserProfile(userId: string): Promise<PublicUserProfile | null> {
    const users = await this.getUsers();
    const user = users.find((item) => item.id === userId && item.accountType === 'student');
    if (!user) return null;

    const allFilters: RankingFilters = {
      period: 'all',
      modality: 'all',
      stroke: 'all',
      academy: 'all',
      location: 'all',
      sortBy: 'distance',
    };
    const entry = await this.buildEntry(user, allFilters);

    return {
      userId: user.id,
      name: getUserDisplayName(user),
      profilePhoto: user.profilePhoto,
      city: user.city,
      state: user.state,
      academyName: user.academyName,
      primaryModality: user.primaryModality,
      yearsPracticing: user.yearsPracticing,
      distance: entry.distance,
      workoutCount: entry.workoutCount,
      favoriteStrokes: user.favoriteStrokes ?? [],
      achievements: [],
    };
  }

  private matchesUserFilters(user: User, currentUser: User, filters: RankingFilters) {
    if (filters.academy === 'my-academy' && !isSameAcademy(user, currentUser)) return false;
    if (filters.location === 'my-city' && normalizeText(user.city) !== normalizeText(currentUser.city)) return false;
    if (filters.location === 'my-state' && normalizeText(user.state) !== normalizeText(currentUser.state)) return false;
    return true;
  }

  private async buildEntry(user: User, filters: RankingFilters): Promise<RankingEntry> {
    const workouts = await this.getWorkouts(user.id);
    const periodStart = getPeriodStart(filters.period);
    const totals: RankingTotals = {
      userId: user.id,
      name: getUserDisplayName(user),
      profilePhoto: user.profilePhoto,
      city: user.city,
      state: user.state,
      academyName: user.academyName,
      academyId: user.academyId,
      distance: 0,
      arrivals: 0,
      timeMinutes: 0,
      workoutCount: 0,
      strokeDiversity: 0,
      strokeSet: new Set<StrokeStyle>(),
    };

    workouts.forEach((workout) => {
      if (!this.isValidWorkout(workout, periodStart)) return;

      const matchingExercises = workout.exercises.filter((exercise) => {
        if (filters.modality !== 'all' && exercise.placeType !== filters.modality) return false;
        if (filters.stroke !== 'all' && exercise.strokeStyle !== filters.stroke) return false;
        return true;
      });

      if (matchingExercises.length === 0) return;

      totals.workoutCount += 1;
      totals.timeMinutes += workout.durationMinutes ?? 0;

      matchingExercises.forEach((exercise) => {
        totals.distance += exercise.distance ?? 0;
        totals.arrivals += exercise.arrivals ?? 0;
        if (exercise.strokeStyle) totals.strokeSet.add(exercise.strokeStyle);
      });
    });

    return {
      ...totals,
      position: 0,
      strokeDiversity: totals.strokeSet.size,
    };
  }

  private isValidWorkout(workout: WorkoutRecord, periodStart: Date | null) {
    if (!workout || !workout.id || !workout.date || !Array.isArray(workout.exercises)) return false;
    if (workout.totalDistance < 0 || workout.durationMinutes < 0) return false;
    if (!periodStart) return true;
    return new Date(workout.date).getTime() >= periodStart.getTime();
  }

  private compareEntries(a: RankingEntry, b: RankingEntry, sortBy: RankingFilters['sortBy']) {
    const selectedMetricDifference = getMetricValue(b, sortBy) - getMetricValue(a, sortBy);
    if (selectedMetricDifference !== 0) return selectedMetricDifference;

    if (b.distance !== a.distance) return b.distance - a.distance;
    if (b.workoutCount !== a.workoutCount) return b.workoutCount - a.workoutCount;
    if (b.timeMinutes !== a.timeMinutes) return b.timeMinutes - a.timeMinutes;
    return a.name.localeCompare(b.name);
  }

  private async getUsers(): Promise<User[]> {
    const usersJson = await AsyncStorage.getItem(this.USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  }

  private async getWorkouts(userId: string): Promise<WorkoutRecord[]> {
    const workoutsJson = await AsyncStorage.getItem(`workout_sessions_${userId}`);
    return workoutsJson ? JSON.parse(workoutsJson) : [];
  }
}

export const rankingService = new RankingService();
export const rankingStrokeOptions = [{ value: 'all', label: 'Todos' }, ...STROKE_STYLES];
export const rankingModalityLabels = SWIMMING_MODALITIES;
