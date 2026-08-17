import React, { useState } from 'react';
import { 
  Compass, 
  Percent, 
  Swords, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { SituationalStats } from '../types/chess';
import { NavTab } from './Navbar';

interface SituationalMasteryProps {
  situations: SituationalStats[];
  onNavigate: (tab: NavTab) => void;
  onSelectBotForWeakness?: (weaknessId: string) => void;
}

export const SituationalMastery: React.FC<SituationalMasteryProps> = ({
  situations,
  onNavigate,
  onSelectBotForWeakness,
}) => {
  const [selectedSituationId, setSelectedSituationId] = useState<string>(situations[0]?.id || '');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filtered = situations.filter(s => {
    if (filterCategory === 'all') return true;
    return s.category === filterCategory;
  });

  const activeSituation = situations.find(s => s.id === selectedSituationId) || situations[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-bold text-xs border border-teal-500/30 mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>SITUATIONAL WIN / LOSS MATRIX</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Situational Mastery & Missed Strategies
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            See exactly which tactical & positional structures you win vs lose, and your most common missed strategies.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {['all', 'tactical', 'positional', 'endgame', 'psychology'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterCategory === cat
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Situation Cards & Selected Situation Deep-Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Situation Matrix Cards (Left Column) */}
        <div className="lg:col-span-7 space-y-3">
          {filtered.map(sit => {
            const isSelected = activeSituation?.id === sit.id;
            const isStruggling = sit.winRate < 45;

            return (
              <div
                key={sit.id}
                onClick={() => setSelectedSituationId(sit.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#182332] border-teal-500/60 shadow-lg shadow-teal-950/40'
                    : 'bg-[#10141d] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{sit.icon}</span>
                    <span className="font-bold text-sm text-white">
                      {sit.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Freq: <strong className="text-slate-200">{sit.frequencyPercent}%</strong>
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                        sit.winRate >= 55
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isStruggling
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {sit.winRate}% Win
                    </span>
                  </div>
                </div>

                {/* Visual Win / Draw / Loss Bar */}
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex mb-2">
                  <div
                    style={{ width: `${sit.winRate}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Wins: ${sit.wins} (${sit.winRate}%)`}
                  />
                  <div
                    style={{ width: `${sit.drawRate}%` }}
                    className="bg-slate-500 h-full"
                    title={`Draws: ${sit.draws} (${sit.drawRate}%)`}
                  />
                  <div
                    style={{ width: `${sit.lossRate}%` }}
                    className="bg-red-500 h-full"
                    title={`Losses: ${sit.losses} (${sit.lossRate}%)`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[320px]">{sit.description}</span>
                  <span>{sit.wins}W / {sit.draws}D / {sit.losses}L</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Situation Deep Dive (Right Column) */}
        {activeSituation && (
          <div className="lg:col-span-5 p-6 rounded-2xl bg-[#141923] border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-2xl">
                {activeSituation.icon}
              </div>
              <div>
                <div className="text-[11px] font-bold text-teal-400 uppercase">
                  {activeSituation.category} Archetype
                </div>
                <h3 className="text-base font-bold text-white leading-snug">
                  {activeSituation.name}
                </h3>
              </div>
            </div>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-lg font-black text-emerald-400">{activeSituation.winRate}%</div>
                <div className="text-[10px] text-slate-400 font-semibold">Win Rate</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <div className="text-lg font-black text-slate-300">{activeSituation.drawRate}%</div>
                <div className="text-[10px] text-slate-400 font-semibold">Draw Rate</div>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="text-lg font-black text-red-400">{activeSituation.lossRate}%</div>
                <div className="text-[10px] text-slate-400 font-semibold">Loss Rate</div>
              </div>
            </div>

            {/* Common Missed Strategy Box */}
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1">
              <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold uppercase tracking-wide">
                <XCircle className="w-4 h-4" />
                <span>Common Missed Strategy</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {activeSituation.commonMissedStrategy}
              </p>
            </div>

            {/* Golden Rule of Thumb */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4" />
                <span>Key Rule of Thumb</span>
              </div>
              <p className="text-xs text-emerald-200 leading-relaxed font-medium">
                “{activeSituation.recommendedKeyRule}”
              </p>
            </div>

            {/* CTA to Sparring Bot */}
            <button
              onClick={() => {
                onSelectBotForWeakness?.(activeSituation.id);
                onNavigate('sparring');
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-950 transition-all flex items-center justify-center gap-2"
            >
              <Swords className="w-4 h-4" />
              <span>Train this Situation vs Sparring Bot</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
