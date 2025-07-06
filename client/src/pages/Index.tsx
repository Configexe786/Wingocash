
import React, { useState, useEffect } from 'react';
import SplashScreen from '../components/SplashScreen';
import AuthScreen from '../components/AuthScreen';
import Dashboard from '../components/Dashboard';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('tirangaProUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentScreen('dashboard');
    } else {
      // Show splash screen for 3 seconds then go to auth
      const timer = setTimeout(() => {
        setCurrentScreen('auth');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('tirangaProUser', JSON.stringify(userData));
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('tirangaProUser');
    setCurrentScreen('auth');
  };

  if (currentScreen === 'splash') {
    return <SplashScreen />;
  }

  if (currentScreen === 'auth') {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
};

export default Index;
