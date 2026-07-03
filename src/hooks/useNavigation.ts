import { useState } from 'react';
import { View } from '../types';

export function useNavigation() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [viewHistory, setViewHistory] = useState<View[]>([]);

  const handleBack = (defaultView: View = 'home') => {
    if (viewHistory.length > 0) {
      const newHistory = [...viewHistory];
      const backTo = newHistory.pop()!;
      setViewHistory(newHistory);
      setCurrentView(backTo);
    } else {
      setCurrentView(defaultView);
    }
  };

  const handleNavigate = (view: View) => {
    if (view !== currentView) {
      setViewHistory(prev => [...prev, currentView]);
      setCurrentView(view);
    }
  };

  return {
    currentView,
    setCurrentView,
    viewHistory,
    setViewHistory,
    handleBack,
    handleNavigate
  };
}
