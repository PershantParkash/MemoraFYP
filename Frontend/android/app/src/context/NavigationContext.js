import React, { createContext, useContext, useRef, useState } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const navigationHistory = useRef([]);
  const [currentScreen, setCurrentScreen] = useState('CameraScreen');

  const addToHistory = (screenName) => {
    if (navigationHistory.current.length === 0 || 
        navigationHistory.current[navigationHistory.current.length - 1] !== screenName) {
      navigationHistory.current.push(screenName);
    }
    setCurrentScreen(screenName);
  };

  const removeFromHistory = () => {
    if (navigationHistory.current.length > 1) {
      navigationHistory.current.pop();
      const previousScreen = navigationHistory.current[navigationHistory.current.length - 1];
      setCurrentScreen(previousScreen);
      return previousScreen;
    }
    return null;
  };

  const isOnCameraTab = () => {
    return currentScreen === 'CameraScreen';
  };

  const isOnLoginScreen = () => {
    return currentScreen === 'Index';
  };

  const resetHistory = () => {
    navigationHistory.current = [];
    setCurrentScreen('CameraScreen');
  };

  const initializeHistory = () => {
    if (navigationHistory.current.length === 0) {
      navigationHistory.current = ['CameraScreen'];
      setCurrentScreen('CameraScreen');
    }
  };

  const value = {
    currentScreen,
    addToHistory,
    removeFromHistory,
    isOnCameraTab,
    isOnLoginScreen,
    resetHistory,
    initializeHistory,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
}; 