import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SignUpData,
  SWIMMING_MODALITIES,
  SwimmingModality,
  TRAINING_PLACE_OPTIONS,
  User,
} from '../types';
import { academyService } from './academyService';
import { validateEmail } from '../utils/validators';

class AuthService {
  private readonly USERS_KEY = 'users_data';
  private readonly CURRENT_USER_KEY = 'current_user';

  async login(email: string, password: string): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }

    const users = await this.getStoredUsers();
    const user = users.find((u) => u.email === email && u.password === password);

    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }

  async signUp(data: SignUpData): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!validateEmail(data.email)) {
      throw new Error('Email inválido');
    }

    if (data.password !== data.confirmPassword) {
      throw new Error('Senhas não conferem');
    }

    if (data.password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    if (data.accountType === 'student') {
      if (!data.firstName || !data.lastName) {
        throw new Error('Nome e sobrenome são obrigatórios');
      }

      if (!data.trainingPlace) {
        throw new Error('Informe onde você treina');
      }

      if (!data.primaryModality) {
        throw new Error('Selecione sua modalidade principal');
      }

      if (!data.modalities || data.modalities.length === 0) {
        throw new Error('Selecione pelo menos uma modalidade');
      }
    }

    if (data.accountType === 'academy') {
      if (!data.academyName || !data.city || !data.state) {
        throw new Error('Informe nome, cidade e estado da academia');
      }
    }

    const users = await this.getStoredUsers();
    if (users.some((u) => u.email === data.email)) {
      throw new Error('Email já cadastrado');
    }

    const newUser: User =
      data.accountType === 'academy'
        ? {
            id: Date.now().toString(),
            accountType: 'academy',
            email: data.email,
            password: data.password,
            academyProfile: {
              id: `academy-${Date.now()}`,
              name: data.academyName ?? '',
              city: data.city ?? '',
              state: data.state ?? '',
              address: data.address,
              site: data.site,
              instagram: data.instagram,
              teachers: [],
              studentIds: [],
              poolIds: [],
            },
            createdAt: new Date().toISOString(),
          }
        : {
            id: Date.now().toString(),
            accountType: 'student',
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            trainingPlace: data.trainingPlace,
            primaryModality: data.primaryModality,
            modalities: data.modalities,
            createdAt: new Date().toISOString(),
          };

    const updatedUsers = [...users, newUser];
    await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(updatedUsers));
    await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(newUser));

    if (newUser.accountType === 'academy' && newUser.academyProfile) {
      await academyService.createAcademy({
        ownerUserId: newUser.id,
        name: newUser.academyProfile.name,
        email: newUser.email,
        address: newUser.academyProfile.address,
        city: newUser.academyProfile.city,
        state: newUser.academyProfile.state,
        instagram: newUser.academyProfile.instagram,
        status: 'active',
      });
    }

    return newUser;
  }

  async updateCurrentUser(data: Partial<User>): Promise<User> {
    const currentUser = await this.getCurrentUser();

    if (!currentUser) {
      throw new Error('Nenhum usuário logado');
    }

    const updatedUser = this.normalizeUser({
      ...currentUser,
      ...data,
      academyProfile: {
        ...currentUser.academyProfile,
        ...data.academyProfile,
      } as User['academyProfile'],
    });

    const users = await this.getStoredUsers();
    const updatedUsers = users.map((user) => (user.id === updatedUser.id ? updatedUser : user));

    await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(updatedUsers));
    await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updatedUser));

    if (updatedUser.accountType === 'academy' && updatedUser.academyProfile) {
      const academy = await academyService.getAcademyByOwner(updatedUser.id);
      if (academy) {
        await academyService.editAcademy(updatedUser.id, academy.id, {
          name: updatedUser.academyProfile.name,
          email: updatedUser.email,
          address: updatedUser.academyProfile.address ?? '',
          city: updatedUser.academyProfile.city,
          state: updatedUser.academyProfile.state,
          instagram: updatedUser.academyProfile.instagram,
        });
      } else {
        await academyService.createAcademy({
          ownerUserId: updatedUser.id,
          name: updatedUser.academyProfile.name,
          email: updatedUser.email,
          address: updatedUser.academyProfile.address,
          city: updatedUser.academyProfile.city,
          state: updatedUser.academyProfile.state,
          instagram: updatedUser.academyProfile.instagram,
          status: 'active',
        });
      }
    }

    return updatedUser;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(this.CURRENT_USER_KEY);
  }

  async getCurrentUser(): Promise<User | null> {
    const userJson = await AsyncStorage.getItem(this.CURRENT_USER_KEY);
    return userJson ? this.normalizeUser(JSON.parse(userJson)) : null;
  }

  private async getStoredUsers(): Promise<User[]> {
    const usersJson = await AsyncStorage.getItem(this.USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : [];
    return users.map((user: Partial<User>) => this.normalizeUser(user));
  }

  private normalizeUser(user: Partial<User>): User {
    if (user.accountType === 'academy' || user.academyProfile) {
      return {
        id: user.id ?? Date.now().toString(),
        accountType: 'academy',
        email: user.email ?? '',
        password: user.password ?? '',
        academyProfile: {
          id: user.academyProfile?.id ?? `academy-${user.id ?? Date.now()}`,
          name: user.academyProfile?.name ?? 'Academia',
          city: user.academyProfile?.city ?? '',
          state: user.academyProfile?.state ?? '',
          address: user.academyProfile?.address,
          site: user.academyProfile?.site,
          instagram: user.academyProfile?.instagram,
          teachers: user.academyProfile?.teachers ?? [],
          studentIds: user.academyProfile?.studentIds ?? [],
          poolIds: user.academyProfile?.poolIds ?? [],
        },
        createdAt: user.createdAt ?? new Date().toISOString(),
      };
    }

    const validModalities = SWIMMING_MODALITIES.map((modality) => modality.value);
    const legacyModalities = Array.isArray((user as any).swimmingStyles)
      ? ((user as any).swimmingStyles as string[])
      : [];
    const rawModalities = Array.isArray(user.modalities) ? user.modalities : legacyModalities;
    const modalities = rawModalities.filter((modality): modality is SwimmingModality =>
      validModalities.includes(modality as SwimmingModality)
    );
    const trainingPlace = user.trainingPlace ?? (user as any).swimmingAcademy;
    const validTrainingPlace = TRAINING_PLACE_OPTIONS.includes(trainingPlace ?? '');

    return {
      id: user.id ?? Date.now().toString(),
      accountType: 'student',
      email: user.email ?? '',
      password: user.password ?? '',
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      trainingPlace: validTrainingPlace ? trainingPlace! : 'Treino sozinho',
      primaryModality: user.primaryModality ?? modalities[0] ?? 'recreational-pool',
      modalities: modalities.length > 0 ? modalities : ['recreational-pool'],
      city: user.city,
      state: user.state,
      profilePhoto: user.profilePhoto,
      academyId: user.academyId,
      academyName: user.academyName,
      favoriteStrokes: user.favoriteStrokes,
      yearsPracticing: user.yearsPracticing,
      weeklyFrequency: user.weeklyFrequency,
      practicePeriod: user.practicePeriod,
      createdAt: user.createdAt ?? new Date().toISOString(),
    };
  }
}

export const authService = new AuthService();
