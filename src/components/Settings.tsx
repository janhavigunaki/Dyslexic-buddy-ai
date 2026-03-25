import React from 'react';
import { Settings as SettingsIcon, Languages, Type, Volume2, Mic, Trash2, RotateCcw, Palette } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../translations';
import { Language, Theme } from '../types';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetProgress } = useAppContext();
  const t = translations[settings.language];

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  ];

  const themes: { id: Theme; label: string; color: string }[] = [
    { id: 'light', label: 'Light', color: 'bg-white border-gray-200' },
    { id: 'cream', label: 'Cream', color: 'bg-[#fdf6e3] border-[#eee8d5]' },
    { id: 'dark', label: 'Dark', color: 'bg-gray-900 border-gray-800 text-white' },
    { id: 'dyslexia', label: 'Dyslexia Friendly', color: 'bg-[#fffae6] border-[#f0e68c]' },
  ];

  return (
    <div className="flex flex-col gap-8 p-8 bg-white rounded-3xl shadow-xl border-4 border-gray-100">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
          <SettingsIcon size={48} className="text-gray-500" />
          {t.settings}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Language Selection */}
        <div className="flex flex-col gap-4">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Languages size={32} className="text-blue-500" />
            Language
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => updateSettings({ language: lang.code })}
                className={`p-6 rounded-2xl text-xl font-bold transition-all border-4 text-left flex items-center justify-between ${
                  settings.language === lang.code
                    ? 'bg-blue-600 text-white border-blue-400 shadow-lg scale-105'
                    : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                }`}
              >
                {lang.label}
                {settings.language === lang.code && <div className="w-4 h-4 bg-white rounded-full" />}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Selection */}
        <div className="flex flex-col gap-4">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Palette size={32} className="text-orange-500" />
            Theme
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => updateSettings({ theme: theme.id })}
                className={`p-4 rounded-2xl font-bold transition-all border-4 flex items-center gap-3 ${
                  settings.theme === theme.id
                    ? 'bg-orange-600 text-white border-orange-400 shadow-lg scale-105'
                    : `${theme.color} text-gray-600 border-gray-100 hover:bg-gray-50`
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 ${theme.color} ${settings.theme === theme.id ? 'border-white' : 'border-gray-200'}`} />
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        {/* Voice & Accessibility */}
        <div className="flex flex-col gap-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Volume2 size={32} className="text-purple-500" />
            Voice & Accessibility
          </h3>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-lg font-bold text-gray-600 flex items-center justify-between">
                Voice Speed
                <span className="text-purple-600">{settings.voiceSpeed}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.voiceSpeed}
                onChange={(e) => updateSettings({ voiceSpeed: parseFloat(e.target.value) })}
                className="w-full h-4 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-lg font-bold text-gray-600 flex items-center justify-between">
                Font Size
                <span className="text-blue-600">{settings.fontSize}px</span>
              </label>
              <input
                type="range"
                min="16"
                max="48"
                step="2"
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                className="w-full h-4 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border-2 border-gray-100">
              <div className="flex items-center gap-3">
                <Mic size={24} className="text-red-500" />
                <span className="text-xl font-bold text-gray-700">Voice Commands</span>
              </div>
              <button
                onClick={() => updateSettings({ voiceCommandsEnabled: !settings.voiceCommandsEnabled })}
                className={`w-16 h-8 rounded-full transition-all relative ${
                  settings.voiceCommandsEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
                  settings.voiceCommandsEnabled ? 'left-9' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t-4 border-gray-50 flex justify-end">
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to reset all progress?')) {
              resetProgress();
            }
          }}
          className="flex items-center gap-2 p-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"
        >
          <RotateCcw size={20} />
          Reset All Progress
        </button>
      </div>
    </div>
  );
};
