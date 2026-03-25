import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserSettings, ProgressData, Language, Theme } from '../types';

interface AppContextType {
  settings: UserSettings;
  progress: ProgressData;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  updateProgress: (newData: Partial<ProgressData>) => void;
  resetProgress: () => void;
}

const defaultSettings: UserSettings = {
  language: 'en',
  fontSize: 24,
  theme: 'light',
  voiceSpeed: 1,
  voiceCommandsEnabled: true,
  micSensitivity: 50,
  autoPunctuation: true,
};

const defaultProgress: ProgressData = {
  speakingMinutes: 0,
  readingMinutes: 0,
  writingSessions: 0,
  stars: 0,
  streak: 0,
  lastActive: new Date().toISOString(),
  badges: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('dyslexic_buddy_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [progress, setProgress] = useState<ProgressData>(() => {
    const saved = localStorage.getItem('dyslexic_buddy_progress');
    return saved ? JSON.parse(saved) : defaultProgress;
  });

  useEffect(() => {
    localStorage.setItem('dyslexic_buddy_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('dyslexic_buddy_progress', JSON.stringify(progress));
  }, [progress]);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const updateProgress = useCallback((newData: Partial<ProgressData>) => {
    setProgress(prev => {
      const updated = { ...prev, ...newData };
      
      // Check for badges
      const newBadges = [...updated.badges];
      if (updated.speakingMinutes >= 60 && !newBadges.includes('voiceLearner')) {
        newBadges.push('voiceLearner');
      }
      if (updated.writingSessions >= 10 && !newBadges.includes('writingScholar')) {
        newBadges.push('writingScholar');
      }
      if (updated.stars >= 50 && !newBadges.includes('confidentSpeaker')) {
        newBadges.push('confidentSpeaker');
      }
      
      return { ...updated, badges: newBadges };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(defaultProgress);
  }, []);

  return (
    <AppContext.Provider value={{ settings, progress, updateSettings, updateProgress, resetProgress }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
