import React from 'react';
import { 
  Calendar, 
  Target, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Swords, 
  BookOpen, 
  Trophy,
  ArrowRight
} from 'lucide-react';
import { PersonalChessProfile } from '../types/chess';
import { NavTab } from './Navbar';

interface TrainingPlanProps {
  profile: PersonalChessProfile;
  onNavigate: (tab: NavTab) => void;
}

export const TrainingPlan: React.FC<TrainingPlanProps> = ({ profile, onNavigate }) => {
  const plan = profile.weeklyTrainingPlan;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/30 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>CUSTOM IMPROVEMENT ROADMAP</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Weekly Personalized Training Plan
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Tailored weekly training regimen engineered around your detected weaknesses.
          </p>
        </div>
      </div>

      {/* Focus Area Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#17221e] via-[#141b24] to-[#17221e] border border-emerald-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              Current Weekly Priority #1
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {plan.focusArea}
            </h3>
          </div>

          <button
            onClick={() => onNavigate('sparring')}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all"
          >
            <Swords className="w-4 h-4" />
            <span>Launch Today's Drill</span>
          </button>
        </div>

        {/* 3 Golden Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {plan.coreRules.map((rule, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200">
              <span className="font-bold text-emerald-400 mr-1.5">✓</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Routine Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plan.days.map((dayItem, idx) => {
          let categoryColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
          if (dayItem.category === 'Sparring') categoryColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
          else if (dayItem.category === 'Puzzles') categoryColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
          else if (dayItem.category === 'Opening') categoryColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#141923] border border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-white">{dayItem.day}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${categoryColor}`}>
                    {dayItem.category}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {dayItem.routine}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{dayItem.durationMinutes} mins</span>
                </div>

                {dayItem.category === 'Sparring' ? (
                  <button
                    onClick={() => onNavigate('sparring')}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <span>Start</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="text-slate-500 font-medium">Daily Drill</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
