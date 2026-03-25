export type Language = 'en' | 'hi' | 'kn';
export type Theme = 'light' | 'cream' | 'dark' | 'dyslexia';

export interface UserSettings {
  language: Language;
  fontSize: number;
  theme: Theme;
  voiceSpeed: number;
  voiceCommandsEnabled: boolean;
  micSensitivity: number;
  autoPunctuation: boolean;
}

export interface ProgressData {
  speakingMinutes: number;
  readingMinutes: number;
  writingSessions: number;
  stars: number;
  streak: number;
  lastActive: string;
  badges: string[];
}

export interface TranslationSchema {
  title: string;
  subtitle: string;
  micHint: string;
  listening: string;
  processing: string;
  readingTool: string;
  voiceNotes: string;
  aiTutor: string;
  progress: string;
  settings: string;
  readAloud: string;
  stop: string;
  clear: string;
  save: string;
  simplify: string;
  translate: string;
  tutorMode: string;
  chatMode: string;
  readThis: string;
  excellent: string;
  tryAgain: string;
  nextWord: string;
  startTutor: string;
  practiceMode: string;
  readMode: string;
  editMode: string;
  stats: {
    speaking: string;
    reading: string;
    writing: string;
    stars: string;
    streak: string;
  };
  badges: {
    voiceLearner: string;
    confidentSpeaker: string;
    writingScholar: string;
  };
}
