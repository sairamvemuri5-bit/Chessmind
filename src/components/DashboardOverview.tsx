import React from 'react';
import { 
  Trophy, 
  AlertTriangle, 
  Target, 
  Sparkles, 
  Swords, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  HelpCircle
} from 'lucide-react';
import { PersonalChessProfile } from '../types/chess';
import { NavTab } from './Navbar';

interface DashboardOverviewProps {
  profile: PersonalChessProfile;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ profile, onNavigate }) => {
  const renderStars = (starsCount: number) => {
    return (
      <div className="flex text-amber-400 text-sm tracking-wider">
        {'⭐'.repeat(Math.max(1, Math.min(5, starsCount)))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero Diagnostic Banner: YOUR CHESS PROFILE */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#151b27] via-[#121722] to-[#0d1117] border border-slate-700/80 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                  PLAYER DIAGNOSTICS & BLUEPRINT
                </span>
                <span className="text-xs text-slate-400">
                  Analysed across {profile.totalGamesAnalyzed} games ({profile.dateRange})
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                YOUR CHESS PROFILE
              </h1>
            </div>

            {/* Quick Action CTA */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('sparring')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950 flex items-center gap-2 transition-all"
              >
                <Swords className="w-4 h-4" />
                <span>Spar Against Your Weaknesses</span>
              </button>
            </div>
          </div>

          {/* Core Phase Ratings Summary (Opening / Middlegame / Endgame) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Opening */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#18202e]/90 border border-emerald-500/30 shadow-md flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
                  Opening Phase
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {profile.phases.opening.score}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ 10</span>
                </div>
                <div className="mt-1">{renderStars(profile.phases.opening.stars)}</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl">
                📖
              </div>
            </div>

            {/* Middlegame */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#18202e]/90 border border-amber-500/40 shadow-md flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl" />
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                  <span>Middlegame Phase</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-bold">
                    NEEDS WORK
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {profile.phases.middlegame.score}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ 10</span>
                </div>
                <div className="mt-1">{renderStars(profile.phases.middlegame.stars)}</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl">
                ⚔️
              </div>
            </div>

            {/* Endgame */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#18202e]/90 border border-teal-500/30 shadow-md flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-0.5">
                  Endgame Phase
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {profile.phases.endgame.score}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ 10</span>
                </div>
                <div className="mt-1">{renderStars(profile.phases.endgame.stars)}</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-xl">
                👑
              </div>
            </div>
          </div>

          {/* 4 Core Pillars: Strength, Weakness, Mistake, Goal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Biggest Strength */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1.5">
                <Trophy className="w-4 h-4" />
                <span>Biggest Strength</span>
              </div>
              <div className="text-lg font-bold text-white mb-1">
                {profile.biggestStrength.title}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {profile.biggestStrength.description}
              </p>
              <div className="mt-2 text-[11px] text-emerald-400/90 font-medium">
                {profile.biggestStrength.evidence}
              </div>
            </div>

            {/* Biggest Weakness */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-red-500/40 relative">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Biggest Weakness</span>
              </div>
              <div className="text-lg font-bold text-white mb-1">
                {profile.biggestWeakness.title}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {profile.biggestWeakness.description}
              </p>
              <div className="mt-2 text-[11px] text-red-400/90 font-medium">
                {profile.biggestWeakness.evidence}
              </div>
            </div>

            {/* Most Common Mistake */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1.5">
                <XCircle className="w-4 h-4" />
                <span>Most Common Mistake</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {profile.mostCommonMistake}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Appears predominantly between moves 12 and 22 right after theoretical development ends.
              </p>
            </div>

            {/* Your Next Improvement Goal */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-400/40">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider mb-1.5">
                <Target className="w-4 h-4" />
                <span>Your Next Improvement Goal</span>
              </div>
              <blockquote className="text-sm font-bold text-emerald-300 italic border-l-2 border-emerald-400 pl-3 my-1">
                “{profile.nextImprovementGoal}”
              </blockquote>
              <p className="text-xs text-slate-400 mt-2">
                Actionable directive derived directly from your lost games.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Deep-Dive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Opening Detail */}
        <div className="p-6 rounded-2xl bg-[#141923] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Opening Performance
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Grade: {profile.phases.opening.grade}
              </span>
            </div>
            <div className="text-2xl font-black text-white mb-3">
              {profile.phases.opening.score} / 10
            </div>
            <ul className="space-y-2">
              {profile.phases.opening.bulletPoints.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => onNavigate('transitions')}
            className="mt-5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 group"
          >
            <span>Inspect Opening Transitions</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Middlegame Detail */}
        <div className="p-6 rounded-2xl bg-[#141923] border border-amber-500/40 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-amber-500/40" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Middlegame Performance
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                Grade: {profile.phases.middlegame.grade}
              </span>
            </div>
            <div className="text-2xl font-black text-white mb-3">
              {profile.phases.middlegame.score} / 10
            </div>
            <ul className="space-y-2">
              {profile.phases.middlegame.bulletPoints.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => onNavigate('problems')}
            className="mt-5 text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 group"
          >
            <span>View Middlegame Weakness Evidence</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Endgame Detail */}
        <div className="p-6 rounded-2xl bg-[#141923] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                Endgame Performance
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                Grade: {profile.phases.endgame.grade}
              </span>
            </div>
            <div className="text-2xl font-black text-white mb-3">
              {profile.phases.endgame.score} / 10
            </div>
            <ul className="space-y-2">
              {profile.phases.endgame.bulletPoints.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => onNavigate('situations')}
            className="mt-5 text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 group"
          >
            <span>Explore Situational Endgame Stats</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
