import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Loader2, Mic, Volume2, VolumeX, Sparkles, Trophy, ArrowRight, RefreshCw } from 'lucide-react';
import { useVoice } from '../context/VoiceContext';
import { useAppContext } from '../context/AppContext';
import { translations } from '../translations';
import { GoogleGenAI } from '@google/genai';
import { MicButton } from './MicButton';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
}

export const AITutor: React.FC = () => {
  const { settings, updateProgress } = useAppContext();
  const { speak, cancelSpeech, isSpeaking, isListening } = useVoice();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'chat' | 'tutor'>('chat');
  const [tutorLang, setTutorLang] = useState<Language>(settings.language);
  const [targetText, setTargetText] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const t = translations[settings.language];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateTutorTask = useCallback(async () => {
    setIsProcessing(true);
    setFeedback(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const langName = tutorLang === 'en' ? 'English' : tutorLang === 'hi' ? 'Hindi' : 'Kannada';
      const prompt = `Generate a single, extremely simple word or a very short sentence (max 3 words) for a dyslexic student to practice reading. 
      The word should be common and easy to sound out. 
      The language should be ${langName}. 
      Return ONLY the word/sentence.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
      });

      if (response.text) {
        const text = response.text.trim().replace(/[".]/g, '');
        setTargetText(text);
        speak(text, tutorLang);
      }
    } catch (error) {
      console.error('Tutor task error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [tutorLang, speak]);

  const handleTutorSpeech = useCallback((transcript: string) => {
    if (!targetText) return;
    
    const normalizedTarget = targetText.toLowerCase().trim().replace(/[.,!?;:]/g, '');
    const normalizedInput = transcript.toLowerCase().trim().replace(/[.,!?;:]/g, '');
    
    if (normalizedInput.includes(normalizedTarget) || normalizedTarget.includes(normalizedInput)) {
      setFeedback('correct');
      updateProgress({ stars: 2, speakingMinutes: 0.5 });
      speak(t.excellent, settings.language);
    } else {
      setFeedback('incorrect');
      speak(t.tryAgain, settings.language);
    }
  }, [targetText, updateProgress, t.excellent, t.tryAgain, settings.language, speak]);

  const handleSend = useCallback(async (text: string) => {
    if (!text || isProcessing) return;
    setIsProcessing(true);
    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `You are a world-class patient tutor for a dyslexic student. 
      Your goal is to explain concepts in the ABSOLUTE SIMPLEST way possible.
      - Use very short sentences.
      - Use simple, common words.
      - Break down complex ideas into tiny, easy steps.
      - Use friendly analogies (like comparing things to toys or everyday objects).
      - If explaining a word, break it into syllables (e.g., "cat-er-pil-lar").
      - Use bold text for key words to help focus.
      - Be extremely encouraging.
      - IMPORTANT: If an image would help explain the concept (like a diagram, a picture of an object, or a visual aid), GENERATE an image as part of your response.
      
      Answer the following in ${settings.language === 'en' ? 'English' : settings.language === 'hi' ? 'Hindi' : 'Kannada'}:
      Question: ${text}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: prompt }] }],
      });

      let responseText = '';
      let responseImageUrl = '';

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.text) {
            responseText += part.text;
          } else if (part.inlineData) {
            responseImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }

      if (responseText || responseImageUrl) {
        const aiMsg: Message = { 
          role: 'model', 
          text: responseText || (responseImageUrl ? 'Here is a picture to help you understand!' : ''),
          imageUrl: responseImageUrl 
        };
        setMessages(prev => [...prev, aiMsg]);
        if (responseText) speak(responseText, settings.language);
        updateProgress({ stars: 1 });
      }
    } catch (error) {
      console.error('AI Tutor error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, settings.language, speak, updateProgress]);

  return (
    <div className="flex flex-col h-full gap-6 p-6 bg-white rounded-3xl shadow-xl border-4 border-purple-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold text-purple-900 flex items-center gap-2">
            <Bot size={32} />
            {t.aiTutor}
          </h2>
          <div className="flex bg-purple-50 p-1 rounded-xl border-2 border-purple-100">
            <button
              onClick={() => setMode('chat')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                mode === 'chat' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-700 hover:bg-purple-100'
              }`}
            >
              {t.chatMode}
            </button>
            <button
              onClick={() => {
                setMode('tutor');
                if (!targetText) generateTutorTask();
              }}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                mode === 'tutor' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-700 hover:bg-purple-100'
              }`}
            >
              {t.tutorMode}
            </button>
          </div>
          {mode === 'tutor' && (
            <div className="flex bg-purple-50 p-1 rounded-xl border-2 border-purple-100 ml-2">
              {(['en', 'hi', 'kn'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setTutorLang(lang);
                    setTargetText('');
                    setFeedback(null);
                  }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all text-sm ${
                    tutorLang === lang 
                      ? 'bg-purple-600 text-white shadow-sm' 
                      : 'text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={cancelSpeech}
          className={`p-4 rounded-2xl transition-all ${isSpeaking ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}
          title={t.stop}
        >
          {isSpeaking ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {mode === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full gap-4"
            >
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 rounded-2xl bg-purple-50/50 border-4 border-purple-50 border-dashed"
              >
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-purple-300 gap-4">
                    <Bot size={64} />
                    <p className="text-xl font-bold">Ask me anything!</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-6 rounded-3xl shadow-sm flex gap-4 ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-tr-none'
                          : 'bg-white text-purple-900 rounded-tl-none border border-purple-100'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {msg.role === 'user' ? <User size={24} /> : <Bot size={24} />}
                      </div>
                      <div className="text-xl leading-relaxed markdown-content" style={{ fontFamily: 'Andika, sans-serif' }}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                        {msg.imageUrl && (
                          <div className="mt-4 rounded-2xl overflow-hidden border-4 border-purple-100 shadow-sm">
                            <img 
                              src={msg.imageUrl} 
                              alt="Explanation visual" 
                              className="w-full h-auto"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white p-6 rounded-3xl rounded-tl-none border border-purple-100 flex items-center gap-2 text-purple-400">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="font-bold">{t.processing}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend(inputText)}
                    placeholder="Type or speak your question..."
                    className="w-full p-6 pr-16 rounded-2xl border-4 border-purple-100 focus:border-purple-400 focus:ring-0 transition-all text-xl"
                    style={{ fontFamily: 'Andika, sans-serif' }}
                  />
                  <button
                    onClick={() => handleSend(inputText)}
                    disabled={!inputText || isProcessing}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50"
                  >
                    <Send size={24} />
                  </button>
                </div>
                <MicButton onTranscript={handleSend} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="tutor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full items-center justify-center gap-8"
            >
              <div className="text-center space-y-4">
                <p className="text-purple-600 font-bold text-xl uppercase tracking-widest">{t.readThis}</p>
                <div className="p-12 bg-purple-50 rounded-3xl border-4 border-purple-100 shadow-inner">
                  {isProcessing ? (
                    <Loader2 className="animate-spin text-purple-400 mx-auto" size={64} />
                  ) : (
                    <h3 className="text-6xl font-bold text-purple-900 tracking-wide" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {targetText}
                    </h3>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <MicButton onTranscript={handleTutorSpeech} />
                  {feedback === 'correct' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-4 -right-4 bg-yellow-400 p-2 rounded-full shadow-lg"
                    >
                      <Trophy className="text-white" size={24} />
                    </motion.div>
                  )}
                </div>

                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className={`p-6 rounded-2xl text-xl font-bold text-center shadow-lg ${
                        feedback === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {feedback === 'correct' ? t.excellent : t.tryAgain}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-4">
                  <button
                    onClick={() => speak(targetText, settings.language)}
                    className="flex items-center gap-2 px-8 py-4 bg-purple-100 text-purple-700 rounded-2xl font-bold hover:bg-purple-200 transition-all"
                  >
                    <Volume2 size={24} />
                    {t.readAloud}
                  </button>
                  <button
                    onClick={generateTutorTask}
                    className="flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg hover:scale-105 active:scale-95"
                  >
                    {feedback === 'correct' ? <ArrowRight size={24} /> : <RefreshCw size={24} />}
                    {feedback === 'correct' ? t.nextWord : t.startTutor}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
