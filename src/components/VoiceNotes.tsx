import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, Trash2, Save, FileText, Eraser, Languages, Download, Loader2 } from 'lucide-react';
import { useVoice } from '../context/VoiceContext';
import { useAppContext } from '../context/AppContext';
import { translations } from '../translations';
import { MicButton } from './MicButton';
import { Language } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const VoiceNotes: React.FC = () => {
  const { settings, updateProgress } = useAppContext();
  const { transcript, isListening, setTranscript } = useVoice();
  const [notes, setNotes] = useState('');
  const [noteLang, setNoteLang] = useState<Language>(settings.language);
  const [isExporting, setIsExporting] = useState(false);
  const t = translations[settings.language];
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleCommand = useCallback((command: string) => {
    const cmd = command.toLowerCase().trim();
    if (cmd.includes('new paragraph') || cmd.includes('नया पैराग्राफ') || cmd.includes('ಹೊಸ ಪ್ಯಾರಾಗ್ರಾಫ್')) {
      setNotes(prev => prev + '\n\n');
    } else if (cmd.includes('delete last sentence') || cmd.includes('पिछला वाक्य हटाएं') || cmd.includes('ಕೊನೆಯ ವಾಕ್ಯ ಅಳಿಸಿ')) {
      setNotes(prev => {
        const sentences = prev.split(/[.!?]\s+/);
        if (sentences.length > 1) {
          sentences.pop();
          return sentences.join('. ') + '. ';
        }
        return '';
      });
    } else if (cmd.includes('clear') || cmd.includes('साफ करें') || cmd.includes('ತೆರವುಗೊಳಿಸಿ')) {
      setNotes('');
    }
    updateProgress({ writingSessions: 1 });
  }, [updateProgress]);

  const handleTranscript = useCallback((text: string) => {
    setNotes(prev => prev + ' ' + text);
  }, []);

  const downloadPDF = async () => {
    if (!notes || isExporting) return;
    setIsExporting(true);
    
    try {
      // Create a temporary element for capturing
      const element = document.createElement('div');
      element.style.padding = '40px';
      element.style.width = '800px';
      element.style.backgroundColor = 'white';
      element.style.color = 'black';
      element.style.fontSize = `${settings.fontSize}px`;
      element.style.lineHeight = '1.8';
      element.style.fontFamily = 'Andika, sans-serif';
      element.style.whiteSpace = 'pre-wrap';
      element.innerText = notes;
      
      document.body.appendChild(element);
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`voice-note-${new Date().getTime()}.pdf`);
      
      document.body.removeChild(element);
      updateProgress({ writingSessions: 1 });
    } catch (error) {
      console.error('PDF Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-3xl shadow-xl border-4 border-green-100">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-green-900 flex items-center gap-2">
          <FileText size={32} />
          {t.voiceNotes}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex bg-green-50 p-1 rounded-xl border-2 border-green-100">
            {(['en', 'hi', 'kn'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setNoteLang(lang)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  noteLang === lang 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'text-green-700 hover:bg-green-100'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={downloadPDF}
            disabled={!notes || isExporting}
            className={`p-4 bg-blue-100 text-blue-600 rounded-2xl hover:bg-blue-200 transition-all hover:scale-105 active:scale-95 ${
              (!notes || isExporting) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={t.save}
          >
            {isExporting ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
          </button>
          <button
            onClick={() => setNotes('')}
            className="p-4 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
            title={t.clear}
          >
            <Trash2 size={24} />
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Speak to write notes..."
          className="w-full h-80 p-6 rounded-2xl border-4 border-green-50 border-dashed focus:border-green-400 focus:ring-0 transition-all resize-none leading-relaxed"
          style={{ fontSize: `${settings.fontSize}px`, fontFamily: 'Andika, sans-serif' }}
        />
        <div className="absolute bottom-4 right-4">
          <MicButton onCommand={handleCommand} onTranscript={handleTranscript} lang={noteLang} />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
        <div className="flex items-center gap-2 text-green-700 font-bold">
          <Mic size={20} />
          <span>Voice Commands: "New Paragraph", "Delete last sentence", "Clear"</span>
        </div>
      </div>
    </div>
  );
};
