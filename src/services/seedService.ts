import AsyncStorage from '@react-native-async-storage/async-storage';
import { Academy, AcademyMembership, User, WorkoutRecord } from '../types';

export const seedDemoUser = async () => {
  try {
    const usersKey = 'users_data';
    const academiesKey = 'academies_data';
    const membershipsKey = 'academy_memberships_data';
    const existingUsers = await AsyncStorage.getItem(usersKey);
    const existingAcademies = await AsyncStorage.getItem(academiesKey);
    const existingMemberships = await AsyncStorage.getItem(membershipsKey);
    const users: User[] = existingUsers ? JSON.parse(existingUsers) : [];
    const academies: Academy[] = existingAcademies ? JSON.parse(existingAcademies) : [];
    const memberships: AcademyMembership[] = existingMemberships ? JSON.parse(existingMemberships) : [];

    const demoUser: User = {
      id: 'demo-001',
      accountType: 'student',
      email: 'demo@hydropump.com',
      password: '123456',
      firstName: 'Joao',
      lastName: 'Silva',
      trainingPlace: 'Participo de uma academia de natacao',
      primaryModality: 'competitive-pool',
      modalities: ['competitive-pool', 'open-water'],
      city: 'Sao Paulo',
      state: 'SP',
      academyId: 'academy-profile-demo-001',
      academyName: 'Hydro Center',
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
        city: 'Sao Paulo',
        state: 'SP',
        address: 'Rua das Piscinas, 100',
        instagram: '@hydrocenter',
        teachers: ['Prof. Marina'],
        studentIds: [],
        poolIds: [],
      },
      createdAt: new Date().toISOString(),
    };

    const demoAcademyEntity: Academy = {
      id: 'academy-profile-demo-001',
      ownerUserId: 'academy-demo-001',
      name: 'Hydro Center',
      email: 'academia@hydropump.com',
      address: 'Rua das Piscinas, 100',
      city: 'Sao Paulo',
      state: 'SP',
      country: 'Brasil',
      instagram: '@hydrocenter',
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    const mariaUser: User = {
      id: 'demo-002',
      accountType: 'student',
      email: 'maria@hydropump.com',
      password: '123456',
      firstName: 'Maria',
      lastName: 'Costa',
      trainingPlace: 'Treino sozinho',
      primaryModality: 'open-water',
      modalities: ['open-water', 'triathlon'],
      city: 'Sao Paulo',
      state: 'SP',
      academyId: 'academy-profile-demo-001',
      academyName: 'Hydro Center',
      favoriteStrokes: ['crawl', 'breaststroke'],
      yearsPracticing: '5 anos',
      weeklyFrequency: '4-5x',
      practicePeriod: 'morning',
      createdAt: new Date().toISOString(),
    };

    const pedroUser: User = {
      id: 'demo-003',
      accountType: 'student',
      email: 'pedro@hydropump.com',
      password: '123456',
      firstName: 'Pedro',
      lastName: 'Alves',
      trainingPlace: 'Aulas particulares',
      primaryModality: 'competitive-pool',
      modalities: ['competitive-pool', 'masters'],
      city: 'Campinas',
      state: 'SP',
      favoriteStrokes: ['butterfly', 'medley'],
      yearsPracticing: '2 anos',
      weeklyFrequency: '2-3x',
      practicePeriod: 'night',
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users];
    if (!updatedUsers.some((user) => user.email === demoUser.email)) updatedUsers.push(demoUser);
    if (!updatedUsers.some((user) => user.email === demoAcademy.email)) updatedUsers.push(demoAcademy);
    if (!updatedUsers.some((user) => user.email === mariaUser.email)) updatedUsers.push(mariaUser);
    if (!updatedUsers.some((user) => user.email === pedroUser.email)) updatedUsers.push(pedroUser);

    const updatedAcademies = [...academies];
    if (!updatedAcademies.some((academy) => academy.id === demoAcademyEntity.id)) {
      updatedAcademies.push(demoAcademyEntity);
    }

    const updatedMemberships = [...memberships];
    const demoMemberships: AcademyMembership[] = [
      {
        id: 'membership-demo-001',
        userId: 'demo-001',
        academyId: 'academy-profile-demo-001',
        status: 'approved',
        requestedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
      },
      {
        id: 'membership-demo-002',
        userId: 'demo-002',
        academyId: 'academy-profile-demo-001',
        status: 'approved',
        requestedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
      },
    ];

    demoMemberships.forEach((membership) => {
      if (!updatedMemberships.some((item) => item.id === membership.id)) {
        updatedMemberships.push(membership);
      }
    });

    await AsyncStorage.setItem(usersKey, JSON.stringify(updatedUsers));
    await AsyncStorage.setItem(academiesKey, JSON.stringify(updatedAcademies));
    await AsyncStorage.setItem(membershipsKey, JSON.stringify(updatedMemberships));
    await seedWorkoutData('demo-001', createDemoWorkouts('demo-001', 7200, 38, 95, ['crawl', 'backstroke']));
    await seedWorkoutData('demo-002', createDemoWorkouts('demo-002', 9800, 42, 120, ['crawl', 'breaststroke']));
    await seedWorkoutData('demo-003', createDemoWorkouts('demo-003', 6200, 30, 80, ['butterfly', 'medley']));
  } catch (error) {
    console.error('Error seeding demo user:', error);
  }
};

const seedWorkoutData = async (userId: string, workouts: WorkoutRecord[]) => {
  const key = `workout_sessions_${userId}`;
  const existingWorkouts = await AsyncStorage.getItem(key);

  if (!existingWorkouts) {
    await AsyncStorage.setItem(key, JSON.stringify(workouts));
  }
};

const createDemoWorkouts = (
  userId: string,
  distance: number,
  arrivals: number,
  durationMinutes: number,
  strokes: WorkoutRecord['exercises'][number]['strokeStyle'][]
): WorkoutRecord[] => {
  const now = new Date();
  const firstDate = new Date(now);
  firstDate.setDate(now.getDate() - 1);
  const secondDate = new Date(now);
  secondDate.setDate(now.getDate() - 5);

  return [
    {
      id: `seed-workout-${userId}-1`,
      userId,
      name: 'Treino tecnico',
      date: firstDate.toISOString(),
      placeType: 'pool',
      poolName: 'Hydro Center',
      durationMinutes: Math.round(durationMinutes * 0.55),
      totalDistance: Math.round(distance * 0.55),
      exercises: [
        {
          id: `seed-exercise-${userId}-1`,
          placeType: 'pool',
          strokeStyle: strokes[0],
          accessory: 'none',
          arrivals: Math.round(arrivals * 0.55),
          poolLength: 25,
          distance: Math.round(distance * 0.55),
          locationName: 'Hydro Center',
        },
      ],
      createdAt: firstDate.toISOString(),
    },
    {
      id: `seed-workout-${userId}-2`,
      userId,
      name: 'Treino de resistencia',
      date: secondDate.toISOString(),
      placeType: 'pool',
      poolName: 'Hydro Center',
      durationMinutes: Math.round(durationMinutes * 0.45),
      totalDistance: Math.round(distance * 0.45),
      exercises: [
        {
          id: `seed-exercise-${userId}-2`,
          placeType: 'pool',
          strokeStyle: strokes[1],
          accessory: 'pull-buoy',
          arrivals: Math.round(arrivals * 0.45),
          poolLength: 25,
          distance: Math.round(distance * 0.45),
          locationName: 'Hydro Center',
        },
      ],
      createdAt: secondDate.toISOString(),
    },
  ];
};
