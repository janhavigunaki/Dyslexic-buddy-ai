import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Trash2, Wand2, Languages, Type, Image as ImageIcon, Camera, Loader2, Bot, Edit3, Eye } from 'lucide-react';
import { useVoice } from '../context/VoiceContext';
import { useAppContext } from '../context/AppContext';
import { translations } from '../translations';
import { GoogleGenAI } from '@google/genai';
import { Language } from '../types';
import { MicButton } from './MicButton';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export const ReadingTool: React.FC = () => {
  const { settings, updateProgress } = useAppContext();
  const { speak, cancelSpeech, isSpeaking } = useVoice();
  const [text, setText] = useState('');
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [readingLang, setReadingLang] = useState<Language>(settings.language);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [sentences, setSentences] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isEditMode, setIsEditMode] = useState(true);
  const [overlayColor, setOverlayColor] = useState<string>('bg-white');
  const [lineHeight, setLineHeight] = useState<number>(1.6);
  const [letterSpacing, setLetterSpacing] = useState<number>(0);
  const [showRuler, setShowRuler] = useState(false);
  const [rulerY, setRulerY] = useState(200);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[settings.language];
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isSpeaking) {
      timerRef.current = window.setInterval(() => {
        updateProgress({ readingMinutes: 1 / 60 });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isSpeaking, updateProgress]);

  const handleReadAloud = useCallback(() => {
    if (!text) return;
    if (isSpeaking) {
      cancelSpeech();
    } else {
      speak(text, readingLang, () => setHighlightIndex(-1));
    }
  }, [text, isSpeaking, cancelSpeech, speak, readingLang]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        
        const prompt = `Extract all text from this image. If the text is in Hindi or Kannada, preserve the script. Format it clearly for reading.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64Data
                }
              }
            ]
          }],
        });

        if (response.text) {
          setText(response.text);
          setIsEditMode(false);
          updateProgress({ readingMinutes: 1 }); // Reward for uploading
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image processing error:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSimplify = useCallback(async () => {
    if (!text || isSimplifying) return;
    setIsSimplifying(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const langName = readingLang === 'en' ? 'English' : readingLang === 'hi' ? 'Hindi' : 'Kannada';
      const prompt = `Simplify the following text for a dyslexic student. Use short sentences, simple words, and clear structure. Keep the language as ${langName}. Return ONLY the simplified text without any introductory or explanatory remarks. Text: ${text}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
      });
      if (response.text) {
        setText(response.text);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error('Simplification error:', error);
    } finally {
      setIsSimplifying(false);
    }
  }, [text, isSimplifying, readingLang]);

  const handleTranslate = useCallback(async () => {
    if (!text || isTranslating) return;
    setIsTranslating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const targetLang = readingLang === 'en' ? 'English' : readingLang === 'hi' ? 'Hindi' : 'Kannada';
      const prompt = `Translate the following text to ${targetLang}. Keep it simple and easy to read. Return ONLY the translated text without any introductory or explanatory remarks. Text: ${text}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
      });
      if (response.text) {
        setText(response.text);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  }, [text, isTranslating, readingLang]);

  const handleDictation = (transcript: string) => {
    if (isPracticeMode) {
      handlePracticeSpeech(transcript);
    } else {
      setText(prev => prev + (prev ? ' ' : '') + transcript);
    }
  };

  const overlayColors = [
    { name: 'White', class: 'bg-white', hex: '#FFFFFF' },
    { name: 'Cream', class: 'bg-orange-50', hex: '#FFFDD0' },
    { name: 'Blue', class: 'bg-blue-50', hex: '#E0F7FA' },
    { name: 'Yellow', class: 'bg-yellow-50', hex: '#FFF9C4' },
    { name: 'Green', class: 'bg-green-50', hex: '#E8F5E9' },
  ];

  const startPractice = () => {
    if (!text) return;
    
    // Auto-detect language if possible
    const hasHindi = /[\u0900-\u097F]/.test(text);
    const hasKannada = /[\u0C80-\u0CFF]/.test(text);
    if (hasHindi) setReadingLang('hi');
    else if (hasKannada) setReadingLang('kn');

    const splitSentences = text.split(/[.!?।॥]/).filter(s => s.trim().length > 0);
    if (splitSentences.length === 0) return;
    
    setSentences(splitSentences);
    setPracticeIndex(0);
    setIsPracticeMode(true);
    setFeedback(null);
    speak(splitSentences[0], hasHindi ? 'hi' : hasKannada ? 'kn' : readingLang);
  };

  const handlePracticeSpeech = (transcript: string) => {
    const clean = (s: string) => s.toLowerCase().trim()
      .normalize('NFC')
      .replace(/[.,!?;:।॥()"'\[\]{}]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0);

    const targetWords = clean(sentences[practiceIndex]);
    const inputWords = clean(transcript);
    
    // Calculate word overlap
    const matches = targetWords.filter(word => inputWords.includes(word));
    const matchRatio = matches.length / targetWords.length;

    // Be lenient: 60% match is enough for success
    const targetClean = sentences[practiceIndex].toLowerCase().trim().normalize('NFC').replace(/[.,!?;:।॥]/g, '');
    const inputClean = transcript.toLowerCase().trim().normalize('NFC').replace(/[.,!?;:।॥]/g, '');

    if (matchRatio >= 0.6 || inputClean.includes(targetClean) || targetClean.includes(inputClean)) {
      setFeedback('correct');
      updateProgress({ stars: 2, speakingMinutes: 0.5 });
      speak(t.excellent, settings.language, () => {
        if (practiceIndex < sentences.length - 1) {
          setTimeout(() => {
            const nextIdx = practiceIndex + 1;
            setPracticeIndex(nextIdx);
            setFeedback(null);
            speak(sentences[nextIdx], readingLang);
          }, 1500);
        } else {
          setIsPracticeMode(false);
        }
      });
    } else {
      setFeedback('incorrect');
      speak(t.tryAgain, settings.language, () => {
        setTimeout(() => {
          speak(sentences[practiceIndex], readingLang);
        }, 1000);
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-3xl shadow-xl border-4 border-blue-100">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
          <Type size={32} />
          {t.readingTool}
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 ${
              showSettings ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
            }`}
            title="Reading Settings"
          >
            <Type size={24} />
          </button>
          <div className="flex bg-blue-50 p-1 rounded-xl border-2 border-blue-100">
            {(['en', 'hi', 'kn'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setReadingLang(lang)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  readingLang === lang 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-blue-700 hover:bg-blue-100'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 ${
              isEditMode ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
            }`}
            title={isEditMode ? t.readMode : t.editMode}
          >
            {isEditMode ? <Eye size={24} /> : <Edit3 size={24} />}
          </button>
          <button
            onClick={() => {
              setText('');
              setIsEditMode(true);
            }}
            className="p-4 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
            title={t.clear}
          >
            <Trash2 size={24} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-blue-50 rounded-2xl border-2 border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <p className="font-bold text-blue-800 text-sm uppercase tracking-wider">Background Tint</p>
                <div className="flex gap-2">
                  {overlayColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setOverlayColor(color.class)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        overlayColor === color.class ? 'border-blue-600 scale-110 shadow-md' : 'border-white'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="font-bold text-blue-800 text-sm uppercase tracking-wider">Text Spacing</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-600">
                    <span>Line Height</span>
                    <span>{lineHeight.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" min="1" max="3" step="0.1" 
                    value={lineHeight} onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex items-center justify-between text-xs font-bold text-blue-600 mt-2">
                    <span>Letter Spacing</span>
                    <span>{letterSpacing}px</span>
                  </div>
                  <input 
                    type="range" min="0" max="10" step="1" 
                    value={letterSpacing} onChange={(e) => setLetterSpacing(parseInt(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-bold text-blue-800 text-sm uppercase tracking-wider">Focus Tools</p>
                <button
                  onClick={() => setShowRuler(!showRuler)}
                  className={`w-full p-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    showRuler ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border-2 border-blue-100'
                  }`}
                >
                  <div className="w-6 h-1 bg-current rounded-full" />
                  Line Focus Ruler
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {isPracticeMode ? (
          <div className="w-full h-80 p-8 rounded-3xl border-4 border-purple-200 bg-purple-50/30 flex flex-col items-center justify-center text-center gap-6">
            <div className="text-sm font-bold text-purple-600 uppercase tracking-widest">
              {t.readThis} ({practiceIndex + 1} / {sentences.length})
            </div>
            <div 
              className="text-3xl font-bold text-blue-900 leading-relaxed"
              style={{ fontSize: `${settings.fontSize + 4}px` }}
            >
              {sentences[practiceIndex]}
            </div>
            
            <AnimatePresence mode="wait">
              {feedback && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={`text-xl font-black ${feedback === 'correct' ? 'text-green-600' : 'text-orange-600'}`}
                >
                  {feedback === 'correct' ? '🌟 ' + t.excellent : '🔄 ' + t.tryAgain}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-4 mt-4">
              <MicButton 
                onTranscript={handlePracticeSpeech} 
                onStart={() => setFeedback(null)}
                lang={readingLang} 
              />
              <button
                onClick={() => speak(sentences[practiceIndex], readingLang)}
                className="p-4 bg-blue-100 text-blue-600 rounded-2xl hover:bg-blue-200 transition-all"
              >
                <Play size={24} />
              </button>
              <button
                onClick={() => setIsPracticeMode(false)}
                className="p-4 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all"
              >
                {t.stop}
              </button>
            </div>
          </div>
        ) : (
          <div className="relative group">
            {isEditMode ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste text or upload a photo..."
                className={`w-full h-96 p-8 rounded-3xl border-4 border-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none shadow-xl ${overlayColor} text-gray-900`}
                style={{ 
                  fontSize: `${settings.fontSize}px`, 
                  fontFamily: 'Andika, sans-serif',
                  lineHeight: lineHeight,
                  letterSpacing: `${letterSpacing}px`
                }}
              />
            ) : (
              <div 
                className={`w-full h-96 p-8 rounded-3xl border-4 border-blue-100 shadow-xl ${overlayColor} text-gray-900 overflow-y-auto markdown-content`}
                style={{ 
                  fontSize: `${settings.fontSize}px`, 
                  fontFamily: 'Andika, sans-serif',
                  lineHeight: lineHeight,
                  letterSpacing: `${letterSpacing}px`
                }}
                onClick={() => setIsEditMode(true)}
              >
                {text ? (
                  <ReactMarkdown>{text}</ReactMarkdown>
                ) : (
                  <p className="text-gray-400 italic">Click to type or paste text...</p>
                )}
              </div>
            )}

            {showRuler && (
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 384 }}
                initial={{ y: rulerY }}
                onDragEnd={(_, info) => setRulerY(info.point.y)}
                className="absolute left-0 right-0 h-12 bg-blue-500/20 border-y-2 border-blue-500/50 pointer-events-auto cursor-ns-resize z-10 flex items-center justify-center"
                style={{ top: 0 }}
              >
                <div className="w-12 h-1 bg-blue-500/50 rounded-full" />
              </motion.div>
            )}
            
            <div className="absolute bottom-6 right-6 flex gap-2">
              <div className="scale-75 origin-bottom-right">
                <MicButton onTranscript={handleDictation} lang={readingLang} />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-12 h-12 flex items-center justify-center bg-orange-500 text-white rounded-xl shadow-lg hover:bg-orange-600 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                title="Upload Image"
              >
                {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
              </button>
              <button
                onClick={handleReadAloud}
                disabled={!text}
                className={`w-12 h-12 flex items-center justify-center rounded-xl shadow-lg transition-all hover:scale-110 active:scale-95 ${
                  isSpeaking ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
                } disabled:opacity-50`}
                title={isSpeaking ? t.stop : t.readAloud}
              >
                {isSpeaking ? <Pause size={20} /> : <Play size={20} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {!isPracticeMode && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleSimplify}
            disabled={!text || isSimplifying || isTranslating}
            className="flex flex-col items-center justify-center gap-1 w-24 h-24 bg-purple-100 text-purple-700 rounded-2xl font-bold hover:bg-purple-200 transition-all disabled:opacity-50 border-b-4 border-purple-200 active:border-b-0 active:translate-y-1"
          >
            <Wand2 size={24} />
            <span className="text-xs">{isSimplifying ? t.processing : t.simplify}</span>
          </button>
          <button
            onClick={handleTranslate}
            disabled={!text || isSimplifying || isTranslating}
            className="flex flex-col items-center justify-center gap-1 w-24 h-24 bg-green-100 text-green-700 rounded-2xl font-bold hover:bg-green-200 transition-all disabled:opacity-50 border-b-4 border-green-200 active:border-b-0 active:translate-y-1"
          >
            <Languages size={24} />
            <span className="text-xs">{isTranslating ? t.processing : t.translate}</span>
          </button>
          <button
            onClick={startPractice}
            disabled={!text || isSimplifying || isTranslating}
            className="flex flex-col items-center justify-center gap-1 w-24 h-24 bg-orange-100 text-orange-700 rounded-2xl font-bold hover:bg-orange-200 transition-all disabled:opacity-50 border-b-4 border-orange-200 active:border-b-0 active:translate-y-1"
          >
            <Bot size={24} />
            <span className="text-xs">{t.practiceMode}</span>
          </button>
        </div>
      )}
    </div>
  );
};
