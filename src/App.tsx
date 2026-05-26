import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { authService } from './services/authService';
import { seedDemoUser } from './services/seedService';
import { LoginScreen } from './screens/LoginScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { HomeScreen } from './screens/HomeScreen';

type AuthState = 'login' | 'signup' | 'home' | 'loading';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AuthState>('loading');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Seed demo user
        await seedDemoUser();
        
        // Check for existing user
        const existingUser = await authService.getCurrentUser();
        if (existingUser) {
          setCurrentScreen('home');
        } else {
          setCurrentScreen('login');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setCurrentScreen('login');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (!isInitializing) {
      if (user) {
        setCurrentScreen('home');
      }
    }
  }, [user, isInitializing]);

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const handleNavigateToSignUp = () => {
    setCurrentScreen('signup');
  };

  const handleNavigateToLogin = () => {
    setCurrentScreen('login');
  };

  const handleLogout = () => {
    setCurrentScreen('login');
  };

  return (
    <>
      {currentScreen === 'login' && (
        <LoginScreen onNavigateToSignUp={handleNavigateToSignUp} />
      )}
      {currentScreen === 'signup' && (
        <SignUpScreen onNavigateToLogin={handleNavigateToLogin} />
      )}
      {currentScreen === 'home' && user && (
        <HomeScreen onLogout={handleLogout} />
      )}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
