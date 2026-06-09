export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  cpf: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  swimmingAcademy: string;
  swimmingStyles: SwimmingStyle[];
  createdAt: string;
}

export type SwimmingStyle =
  | 'freestyle'
  | 'backstroke'
  | 'breaststroke'
  | 'butterfly'
  | 'individual-medley';

export type WorkoutPlaceType = 'pool' | 'open-water';

export interface WorkoutRecord {
  id: string;
  userId: string;
  trainedAt: string;
  placeName: string;
  placeType: WorkoutPlaceType;
  swimmingStyle: SwimmingStyle;
  laps: number;
  poolLength: number;
  totalDistance: number;
}

export interface SignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  cpf: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  swimmingAcademy: string;
  swimmingStyles: SwimmingStyle[];
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
  logout: () => void;
  clearError: () => void;
}

export const SWIMMING_ACADEMIES = [
  'Não sou afiliado',
  'Academia Natação Olímpica',
  'Centro de Treinamento Aquático',
  'Escola de Natação Infantil',
  'Academia Aqua Plus',
  'Natação Pro',
  'Instituto de Natação Brasil',
  'Academia Splash',
  'Outra',
];

export const SWIMMING_STYLES: { value: SwimmingStyle; label: string }[] = [
  { value: 'freestyle', label: 'Nado Livre' },
  { value: 'backstroke', label: 'Costas' },
  { value: 'breaststroke', label: 'Peito' },
  { value: 'butterfly', label: 'Borboleta' },
  { value: 'individual-medley', label: 'Medley Individual' },
];
