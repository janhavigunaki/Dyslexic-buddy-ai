import React from 'react';
import { Trophy, Star, Zap, Mic, BookOpen, PenTool, Award } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../translations';
import { motion } from 'motion/react';

export const Progress: React.FC = () => {
  const { progress, settings } = useAppContext();
  const t = translations[settings.language];

  const stats = [
    { label: t.stats.speaking, value: Math.round(progress.speakingMinutes), icon: Mic, color: 'bg-blue-100 text-blue-600' },
    { label: t.stats.reading, value: Math.round(progress.readingMinutes), icon: BookOpen, color: 'bg-purple-100 text-purple-600' },
    { label: t.stats.writing, value: progress.writingSessions, icon: PenTool, color: 'bg-green-100 text-green-600' },
    { label: t.stats.stars, value: progress.stars, icon: Star, color: 'bg-yellow-100 text-yellow-600' },
    { label: t.stats.streak, value: progress.streak, icon: Zap, color: 'bg-orange-100 text-orange-600' },
  ];

  const badges = [
    { id: 'voiceLearner', label: t.badges.voiceLearner, icon: Mic, color: 'bg-blue-500' },
    { id: 'confidentSpeaker', label: t.badges.confidentSpeaker, icon: Award, color: 'bg-yellow-500' },
    { id: 'writingScholar', label: t.badges.writingScholar, icon: Trophy, color: 'bg-green-500' },
  ];

  return (
    <div className="flex flex-col gap-8 p-8 bg-white rounded-3xl shadow-xl border-4 border-yellow-100">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold text-yellow-900 flex items-center gap-3">
          <Trophy size={48} className="text-yellow-500" />
          {t.progress}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`${stat.color} p-6 rounded-3xl flex flex-col items-center gap-3 text-center shadow-sm border-2 border-white`}
          >
            <stat.icon size={32} />
            <span className="text-3xl font-black">{stat.value}</span>
            <span className="text-sm font-bold uppercase tracking-wider opacity-80">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Award size={32} className="text-blue-500" />
          Your Badges
        </h3>
        <div className="flex flex-wrap gap-4">
          {badges.map((badge, i) => {
            const earned = progress.badges.includes(badge.id);
            return (
              <motion.div
                key={i}
                whileHover={earned ? { scale: 1.1, rotate: 5 } : {}}
                className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                  earned ? `${badge.color} text-white shadow-lg` : 'bg-gray-100 text-gray-400 grayscale'
                }`}
              >
                <badge.icon size={24} />
                <span className="font-bold text-lg">{badge.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
