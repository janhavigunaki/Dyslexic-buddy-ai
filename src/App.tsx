import React, { useState, useEffect } from 'react';
import { Mic, BookOpen, FileText, Bot, Trophy, Settings as SettingsIcon, Sparkles, Sun, Moon, Palette } from 'lucide-react';
import { AppProvider, useAppContext } from './context/AppContext';
import { VoiceProvider, useVoice } from './context/VoiceContext';
import { ReadingTool } from './components/ReadingTool';
import { VoiceNotes } from './components/VoiceNotes';
import { AITutor } from './components/AITutor';
import { Progress } from './components/Progress';
import { Settings } from './components/Settings';
import { translations } from './translations';
import { motion, AnimatePresence } from 'motion/react';
import { Theme } from './types';

const AppContent: React.FC = () => {
  const { settings, updateSettings, updateProgress } = useAppContext();
  const { speak, isListening, stopListening, startListening } = useVoice();
  const [activeTab, setActiveTab] = useState<'reading' | 'notes' | 'tutor' | 'progress' | 'settings'>('reading');
  const [hasStarted, setHasStarted] = useState(false);
  const t = translations[settings.language];

  const themes: { id: Theme; color: string; label: string }[] = [
    { id: 'light', color: 'bg-white', label: 'Light' },
    { id: 'cream', color: 'bg-[#fdf6e3]', label: 'Cream' },
    { id: 'dark', color: 'bg-gray-900', label: 'Dark' },
    { id: 'dyslexia', color: 'bg-[#fffae6]', label: 'Friendly' },
  ];

  const handleStart = () => {
    setHasStarted(true);
    // Welcome message
    const welcome = {
      en: 'Welcome to Dyslexic Buddy AI. I am here to help you learn.',
      hi: 'डिस्लेक्सिक बडी AI में आपका स्वागत है। मैं यहाँ आपकी मदद करने के लिए हूँ।',
      kn: 'ಡಿಸ್ಲೆಕ್ಸಿಕ್ ಬಡ್ಡಿ AI ಗೆ ಸ್ವಾಗತ. ನಿಮಗೆ ಕಲಿಯಲು ಸಹಾಯ ಮಾಡಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ.'
    };
    speak(welcome[settings.language], settings.language);
  };

  const tabs = [
    { id: 'reading', label: t.readingTool, icon: BookOpen, color: 'bg-blue-500' },
    { id: 'notes', label: t.voiceNotes, icon: FileText, color: 'bg-green-500' },
    { id: 'tutor', label: t.aiTutor, icon: Bot, color: 'bg-purple-500' },
    { id: 'progress', label: t.progress, icon: Trophy, color: 'bg-yellow-500' },
    { id: 'settings', label: t.settings, icon: SettingsIcon, color: 'bg-gray-500' },
  ];

  if (!hasStarted) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-500 ${
        settings.theme === 'cream' ? 'bg-[#fdf6e3]' : 
        settings.theme === 'dark' ? 'bg-gray-950 text-white' : 
        settings.theme === 'dyslexia' ? 'bg-[#fffae6]' : 'bg-blue-50/30'
      }`}>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center flex flex-col items-center gap-8"
        >
          <div className="p-8 bg-blue-600 text-white rounded-[40px] shadow-2xl rotate-3 mb-4">
            <Sparkles size={80} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-blue-900 drop-shadow-sm">
              {t.title}
            </h1>
            <p className="text-xl md:text-2xl font-bold text-blue-600/60 uppercase tracking-[0.2em]">
              {t.subtitle}
            </p>
          </div>

          <button
            onClick={handleStart}
            className="mt-8 px-12 py-6 bg-blue-600 text-white text-2xl font-black rounded-[30px] shadow-2xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group"
          >
            <span>Go to Functions</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Sparkles className="group-hover:rotate-12 transition-transform" />
            </motion.div>
          </button>

          {/* Small theme selector even on landing page */}
          <div className="mt-12 flex items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-full border-2 border-white">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => updateSettings({ theme: theme.id })}
                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${theme.color} ${
                  settings.theme === theme.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      settings.theme === 'cream' ? 'bg-[#fdf6e3]' : 
      settings.theme === 'dark' ? 'bg-gray-950 text-white' : 
      settings.theme === 'dyslexia' ? 'bg-[#fffae6]' : 'bg-blue-50/30'
    }`}>
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b-4 border-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg rotate-3">
            <Sparkles size={24} />
          </div>
          
          {/* Theme Selector - Small at top left */}
          <div className="flex items-center gap-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => updateSettings({ theme: theme.id })}
                className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${theme.color} ${
                  settings.theme === theme.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                }`}
                title={theme.label}
              />
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border-2 border-blue-100">
            <Trophy size={20} className="text-yellow-500" />
            <span className="font-black text-blue-900">Level 1</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'reading' && <ReadingTool />}
            {activeTab === 'notes' && <VoiceNotes />}
            {activeTab === 'tutor' && <AITutor />}
            {activeTab === 'progress' && <Progress />}
            {activeTab === 'settings' && <Settings />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[85%] max-w-2xl p-2 bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl border-2 border-white flex items-center justify-around z-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all relative group ${
              activeTab === tab.id ? `${tab.color} text-white scale-105 shadow-lg` : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={22} />
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeTab === tab.id ? 'block' : 'hidden md:group-hover:block'}`}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="nav-active"
                className="absolute -bottom-1 w-1.5 h-1.5 bg-white rounded-full"
              />
            )}
          </button>
        ))}
      </nav>

      {/* Global Voice Feedback */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-blue-900/5 pointer-events-none z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <VoiceProvider>
        <AppContent />
      </VoiceProvider>
    </AppProvider>
  );
};

export default App;
