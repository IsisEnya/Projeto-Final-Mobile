import AsyncStorage from '@react-native-async-storage/async-storage';
import { SignUpData, User } from '../types';
import { validateEmail, validateCPF } from '../utils/validators';

class AuthService {
  private readonly USERS_KEY = 'users_data';
  private readonly CURRENT_USER_KEY = 'current_user';

  async login(email: string, password: string): Promise<User> {
    // Simula uma chamada à API
    await new Promise((resolve) => setTimeout(resolve, 1000));

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
    // Simula uma chamada à API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Validações
    if (!validateEmail(data.email)) {
      throw new Error('Email inválido');
    }

    if (!validateCPF(data.cpf)) {
      throw new Error('CPF inválido');
    }

    if (data.password !== data.confirmPassword) {
      throw new Error('Senhas não conferem');
    }

    if (data.password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    if (!data.firstName || !data.lastName) {
      throw new Error('Nome e sobrenome são obrigatórios');
    }

    if (!data.dateOfBirth || !data.phone || !data.address) {
      throw new Error('Todos os campos pessoais são obrigatórios');
    }

    if (!data.swimmingAcademy) {
      throw new Error('Selecione uma academia de natação');
    }

    if (data.swimmingStyles.length === 0) {
      throw new Error('Selecione pelo menos um estilo de nado');
    }

    // Verifica se o email já existe
    const users = await this.getStoredUsers();
    if (users.some((u) => u.email === data.email)) {
      throw new Error('Email já cadastrado');
    }

    const newUser: User = {
      id: Date.now().toString(),
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      cpf: data.cpf,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      swimmingAcademy: data.swimmingAcademy,
      swimmingStyles: data.swimmingStyles,
      createdAt: new Date().toISOString(),
    };

    // Salva o novo usuário
    const updatedUsers = [...users, newUser];
    await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(updatedUsers));
    await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(newUser));

    return newUser;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(this.CURRENT_USER_KEY);
  }

  async getCurrentUser(): Promise<User | null> {
    const userJson = await AsyncStorage.getItem(this.CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private async getStoredUsers(): Promise<User[]> {
    const usersJson = await AsyncStorage.getItem(this.USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  }
}

export const authService = new AuthService();
