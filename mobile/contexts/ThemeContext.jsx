import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES } from '@/constants/colors';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('coffee');
  const [colors, setColors] = useState(THEMES.coffee);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme && THEMES[savedTheme]) {
        setCurrentTheme(savedTheme);
        setColors(THEMES[savedTheme]);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeTheme = async (themeName) => {
    try {
      if (THEMES[themeName]) {
        setCurrentTheme(themeName);
        setColors(THEMES[themeName]);
        await AsyncStorage.setItem('app_theme', themeName);
        console.log('✅ Theme changed to:', themeName);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, colors, changeTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};