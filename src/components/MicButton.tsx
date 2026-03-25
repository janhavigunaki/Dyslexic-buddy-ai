import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useVoice } from '../context/VoiceContext';
import { useAppContext } from '../context/AppContext';
import { translations } from '../translations';

import { Language } from '../types';

interface MicButtonProps {
  onCommand?: (command: string) => void;
  onTranscript?: (text: string) => void;
  onStart?: () => void;
  lang?: Language;
}

export const MicButton: React.FC<MicButtonProps> = ({ onCommand, onTranscript, onStart, lang }) => {
  const { isListening, transcript, startListening, stopListening, isSpeaking } = useVoice();
  const { settings } = useAppContext();
  const t = translations[settings.language];
  const processedRef = useRef(false);

  const handleStart = () => {
    if (isSpeaking) return;
    if (onStart) onStart();
    startListening(lang || settings.language);
  };

  useEffect(() => {
    if (isListening) {
      processedRef.current = false;
    }
    
    if (!isListening && transcript && !processedRef.current) {
      if (settings.voiceCommandsEnabled && onCommand) {
        onCommand(transcript);
      }
      if (onTranscript) {
        onTranscript(transcript);
      }
      processedRef.current = true;
    }
  }, [isListening, transcript, settings.voiceCommandsEnabled, onCommand, onTranscript]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0.2 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-blue-500 rounded-full"
            />
          )}
        </AnimatePresence>
        
        <button
          onClick={isListening ? stopListening : handleStart}
          disabled={isSpeaking}
          className={`relative z-10 p-4 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
            isListening ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
          } ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={isListening ? t.stop : t.micHint}
        >
          {isListening ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
      </div>

      <div className="h-6 flex items-center justify-center">
        {isListening ? (
          <div className="flex items-center gap-1 text-blue-600 text-xs font-medium animate-pulse">
            <Loader2 className="animate-spin" size={14} />
            <span>{t.listening}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">{t.micHint}</span>
        )}
      </div>

      <AnimatePresence>
        {isListening && transcript && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-full max-w-lg p-4 bg-white rounded-2xl shadow-lg border-2 border-blue-100 text-center"
          >
            <p className="text-lg text-blue-800 font-medium italic">"{transcript}"</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
