import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export const seedDemoUser = async () => {
  try {
    const usersKey = 'users_data';
    const existingUsers = await AsyncStorage.getItem(usersKey);

    if (!existingUsers) {
      const demoUser: User = {
        id: 'demo-001',
        email: 'demo@swimapp.com',
        password: '123456',
        firstName: 'João',
        lastName: 'Silva',
        dateOfBirth: '1995-05-15',
        cpf: '123.456.789-00',
        phone: '(11) 98765-4321',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '01310-100',
        swimmingAcademy: 'Academia Natação Olímpica',
        swimmingStyles: ['freestyle', 'backstroke', 'breaststroke'],
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(usersKey, JSON.stringify([demoUser]));
    }
  } catch (error) {
    console.error('Error seeding demo user:', error);
  }
};
