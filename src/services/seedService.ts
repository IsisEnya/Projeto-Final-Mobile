import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export const seedDemoUser = async () => {
  try {
    const usersKey = 'users_data';
    const existingUsers = await AsyncStorage.getItem(usersKey);
    const users: User[] = existingUsers ? JSON.parse(existingUsers) : [];

    const demoUser: User = {
      id: 'demo-001',
      accountType: 'student',
      email: 'demo@hydropump.com',
      password: '123456',
      firstName: 'João',
      lastName: 'Silva',
      trainingPlace: 'Participo de uma academia de natação',
      primaryModality: 'competitive-pool',
      modalities: ['competitive-pool', 'open-water'],
      city: 'São Paulo',
      state: 'SP',
      academyName: 'Academia Natação Olímpica',
      favoriteStrokes: ['crawl', 'backstroke'],
      yearsPracticing: '3 anos',
      weeklyFrequency: '2-3x',
      practicePeriod: 'night',
      createdAt: new Date().toISOString(),
    };

    const demoAcademy: User = {
      id: 'academy-demo-001',
      accountType: 'academy',
      email: 'academia@hydropump.com',
      password: '123456',
      academyProfile: {
        id: 'academy-profile-demo-001',
        name: 'Hydro Center',
        city: 'São Paulo',
        state: 'SP',
        address: 'Rua das Piscinas, 100',
        instagram: '@hydrocenter',
        teachers: ['Prof. Marina'],
        studentIds: ['demo-001'],
        poolIds: [],
      },
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users];
    if (!updatedUsers.some((user) => user.email === demoUser.email)) {
      updatedUsers.push(demoUser);
    }
    if (!updatedUsers.some((user) => user.email === demoAcademy.email)) {
      updatedUsers.push(demoAcademy);
    }

    await AsyncStorage.setItem(usersKey, JSON.stringify(updatedUsers));
  } catch (error) {
    console.error('Error seeding demo user:', error);
  }
};
