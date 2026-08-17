import React, { useState } from 'react';
import { 
  AlertOctagon, 
  ShieldAlert, 
  Swords, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';
import { WeaknessPattern } from '../types/chess';
import { ChessboardView } from './ChessboardView';
import { NavTab } from './Navbar';

interface BiggestProblemsProps {
  weaknesses: WeaknessPattern[];
  onNavigate: (tab: NavTab) => void;
  onSelectBotForWeakness?: (weaknessId: string) => void;
}

export const BiggestProblems: React.FC<BiggestProblemsProps> = ({
  weaknesses,
  onNavigate,
  onSelectBotForWeakness,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string>(weaknesses[0]?.id || '');
  const [activeEvidenceIndex, setActiveEvidenceIndex] = useState<Record<string, number>>({});

  const filtered = weaknesses.filter(w => {
    if (selectedCategory === 'all') return true;
    return w.category === selectedCategory;
  });

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? '' : id));
  };

  const handleStartSparring = (weaknessId: string) => {
    onSelectBotForWeakness?.(weaknessId);
    onNavigate('sparring');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold text-xs border border-red-500/30 mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>RECURRING DIAGNOSTICS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Your Biggest Problems
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Algorithmic breakdown of recurring blindspots across your actual games.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {['all', 'positional', 'tactics', 'time'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Weakness List */}
      <div className="space-y-4">
        {filtered.map((weakness, index) => {
          const isExpanded = expandedId === weakness.id;
          const currentEvidenceIdx = activeEvidenceIndex[weakness.id] || 0;
          const currentEvidence = weakness.evidenceExamples[currentEvidenceIdx];

          return (
            <div
              key={weakness.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isExpanded
                  ? 'bg-[#141923] border-slate-700 shadow-2xl'
                  : 'bg-[#10141d] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Card Header Row */}
              <div
                onClick={() => handleToggleExpand(weakness.id)}
                className="p-5 sm:p-6 cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-sm text-slate-300">
                    #{index + 1}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-base sm:text-lg font-bold text-white">
                        {weakness.title}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          weakness.severity === 'critical'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : weakness.severity === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {weakness.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      {weakness.headline}
                    </p>
                  </div>
                </div>

                {/* Frequency Stat & Toggle */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-lg font-black text-amber-400">
                      {weakness.frequencyPercent}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      of analysed games
                    </div>
                  </div>

                  <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Details & Actual Game Evidence */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 p-5 sm:p-6 bg-slate-950/40 space-y-6">
                  {/* Description & Trigger */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">
                        Pattern Anatomy
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {weakness.description}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">
                        Common Trigger
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {weakness.commonTrigger}
                      </p>
                    </div>
                  </div>

                  {/* Evidence from Actual Games */}
                  {weakness.evidenceExamples.length > 0 && currentEvidence && (
                    <div className="p-5 rounded-xl bg-[#151c27] border border-slate-700/80 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Concrete Evidence From Your Games
                          </span>
                        </div>

                        {/* Evidence Tabs */}
                        <div className="flex gap-1">
                          {weakness.evidenceExamples.map((_, i) => (
                            <button
                              key={i}
                              onClick={() =>
                                setActiveEvidenceIndex(prev => ({
                                  ...prev,
                                  [weakness.id]: i,
                                }))
                              }
                              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                                currentEvidenceIdx === i
                                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              }`}
                            >
                              Game #{i + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Position & Commentary */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                        <div className="lg:col-span-6 flex justify-center">
                          <ChessboardView
                            fen={currentEvidence.fen}
                            interactive={false}
                          />
                        </div>

                        <div className="lg:col-span-6 space-y-3">
                          <div className="text-xs font-bold text-slate-400">
                            Match: <span className="text-white">{currentEvidence.gameTitle}</span>
                          </div>

                          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30">
                            <div className="text-xs font-bold text-red-400 uppercase mb-0.5">
                              Move {currentEvidence.moveNumber} Blunder: Played {currentEvidence.playedMove}
                            </div>
                            <p className="text-xs text-slate-300">
                              {currentEvidence.explanation}
                            </p>
                          </div>

                          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                            <div className="text-xs font-bold text-emerald-400 uppercase mb-0.5">
                              Coach Recommended Move: {currentEvidence.betterMove}
                            </div>
                            <p className="text-xs text-slate-300">
                              Maintains control, harmonizes piece placement, and prevents enemy counterplay.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Coaching Fix & Actionable Drills */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30">
                    <div className="space-y-1 max-w-xl">
                      <div className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>The Coaching Fix</span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium leading-relaxed">
                        {weakness.coachingFix}
                      </p>
                    </div>

                    <button
                      onClick={() => handleStartSparring(weakness.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Spar on This Weakness</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
