import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Language } from '../types';
import { useAppContext } from './AppContext';

interface VoiceContextType {
  isListening: boolean;
  transcript: string;
  startListening: (lang?: Language) => void;
  stopListening: () => void;
  speak: (text: string, lang: Language, onEnd?: () => void) => void;
  cancelSpeech: () => void;
  isSpeaking: boolean;
  setTranscript: (text: string) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useAppContext();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const startListening = useCallback((lang?: Language) => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      
      const langMap: Record<Language, string> = {
        en: 'en-US',
        hi: 'hi-IN',
        kn: 'kn-IN'
      };
      
      const recognitionLang = langMap[lang || settings.language] || 'en-US';
      recognitionRef.current.lang = recognitionLang;
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const speak = useCallback((text: string, lang: Language, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const langMap: Record<Language, string> = {
      en: 'en-US',
      hi: 'hi-IN',
      kn: 'kn-IN'
    };
    
    const langCode = langMap[lang];
    utterance.lang = langCode;
    utterance.rate = settings.voiceSpeed || 1;
    
    // Try to find a high-quality voice for the language
    // Search by full lang code first, then by language prefix
    const voice = voicesRef.current.find(v => v.lang.toLowerCase() === langCode.toLowerCase() && v.localService) ||
                  voicesRef.current.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()) && v.localService);
    
    const fallbackVoice = voicesRef.current.find(v => v.lang.toLowerCase() === langCode.toLowerCase()) ||
                          voicesRef.current.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
    
    if (voice) {
      utterance.voice = voice;
    } else if (fallbackVoice) {
      utterance.voice = fallbackVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [settings.voiceSpeed]);

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return (
    <VoiceContext.Provider value={{ 
      isListening, 
      transcript, 
      startListening, 
      stopListening, 
      speak, 
      cancelSpeech,
      isSpeaking,
      setTranscript
    }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) throw new Error('useVoice must be used within VoiceProvider');
  return context;
};
