export interface User {
  id: string;
  accountType: AccountType;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  academyProfile?: AcademyProfile;
  trainingPlace?: string;
  primaryModality?: SwimmingModality;
  modalities?: SwimmingModality[];
  city?: string;
  state?: string;
  profilePhoto?: string;
  academyId?: string;
  academyName?: string;
  favoriteStrokes?: StrokeStyle[];
  yearsPracticing?: string;
  weeklyFrequency?: WeeklyFrequency;
  practicePeriod?: PracticePeriod;
  createdAt: string;
}

export type AccountType = 'student' | 'academy';

export type SwimmingModality =
  | 'recreational-pool'
  | 'competitive-pool'
  | 'open-water'
  | 'triathlon'
  | 'masters'
  | 'youth'
  | 'paralympic'
  | 'diving'
  | 'other';

export type StrokeStyle =
  | 'crawl'
  | 'backstroke'
  | 'breaststroke'
  | 'butterfly'
  | 'medley';

export type SwimAccessory =
  | 'none'
  | 'kickboard'
  | 'pull-buoy'
  | 'paddles'
  | 'fins'
  | 'elastic'
  | 'snorkel'
  | 'resistance-parachute'
  | 'noodle'
  | 'float-vest';

export type WorkoutPlaceType = 'pool' | 'open-water';

export type WeeklyFrequency = '1x' | '2-3x' | '4-5x' | '6x-plus';

export type PracticePeriod = 'morning' | 'afternoon' | 'night' | 'mixed';

export interface PoolRecord {
  id: string;
  userId: string;
  name: string;
  length: number;
  city?: string;
  academyName?: string;
  createdAt: string;
}

export interface ExerciseRecord {
  id: string;
  placeType: WorkoutPlaceType;
  strokeStyle?: StrokeStyle;
  accessory?: SwimAccessory;
  arrivals?: number;
  poolLength?: number;
  distance: number;
  durationMinutes?: number;
  locationName?: string;
}

export interface WorkoutRecord {
  id: string;
  userId: string;
  name: string;
  date: string;
  placeType: WorkoutPlaceType;
  poolId?: string;
  poolName?: string;
  durationMinutes: number;
  totalDistance: number;
  exercises: ExerciseRecord[];
  createdAt: string;
}

export interface AcademyProfile {
  id: string;
  name: string;
  logo?: string;
  city: string;
  state: string;
  address?: string;
  site?: string;
  instagram?: string;
  teachers: string[];
  studentIds: string[];
  poolIds: string[];
}

export interface SignUpData {
  accountType: AccountType;
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  trainingPlace?: string;
  primaryModality?: SwimmingModality;
  modalities?: SwimmingModality[];
  academyName?: string;
  city?: string;
  state?: string;
  address?: string;
  site?: string;
  instagram?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const TRAINING_PLACE_OPTIONS = [
  'Participo de uma academia de natação',
  'Treino sozinho',
  'Aulas particulares',
];

export const SWIMMING_MODALITIES: { value: SwimmingModality; label: string }[] = [
  { value: 'recreational-pool', label: 'Piscina recreativa' },
  { value: 'competitive-pool', label: 'Piscina competitiva' },
  { value: 'open-water', label: 'Águas abertas' },
  { value: 'triathlon', label: 'Triathlon' },
  { value: 'masters', label: 'Master' },
  { value: 'youth', label: 'Infantil/Juvenil' },
  { value: 'paralympic', label: 'Paralímpico' },
  { value: 'diving', label: 'Mergulho' },
  { value: 'other', label: 'Outro' },
];

export const STROKE_STYLES: { value: StrokeStyle; label: string }[] = [
  { value: 'crawl', label: 'Crawl (Livre)' },
  { value: 'backstroke', label: 'Costas' },
  { value: 'breaststroke', label: 'Peito' },
  { value: 'butterfly', label: 'Borboleta' },
  { value: 'medley', label: 'Medley' },
];

export const SWIM_ACCESSORIES: { value: SwimAccessory; label: string }[] = [
  { value: 'none', label: 'Nenhum' },
  { value: 'kickboard', label: 'Prancha' },
  { value: 'pull-buoy', label: 'Pull buoy' },
  { value: 'paddles', label: 'Palmar' },
  { value: 'fins', label: 'Nadadeira' },
  { value: 'elastic', label: 'Elástico' },
  { value: 'snorkel', label: 'Snorkel frontal' },
  { value: 'resistance-parachute', label: 'Paraquedas de resistência' },
  { value: 'noodle', label: 'Espaguete' },
  { value: 'float-vest', label: 'Colete flutuador' },
];

export const WEEKLY_FREQUENCIES: { value: WeeklyFrequency; label: string }[] = [
  { value: '1x', label: '1x por semana' },
  { value: '2-3x', label: '2-3x por semana' },
  { value: '4-5x', label: '4-5x por semana' },
  { value: '6x-plus', label: '6+ vezes por semana' },
];

export const PRACTICE_PERIODS: { value: PracticePeriod; label: string }[] = [
  { value: 'morning', label: 'Manhã' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'night', label: 'Noite' },
  { value: 'mixed', label: 'Variado' },
];
