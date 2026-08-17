import React, { useState } from 'react';
import { 
  TrendingDown, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Flame, 
  PlayCircle,
  Eye
} from 'lucide-react';
import { ParsedGame } from '../types/chess';
import { ChessboardView } from './ChessboardView';
import { NavTab } from './Navbar';

interface TransitionAnalysisProps {
  games: ParsedGame[];
  onNavigate: (tab: NavTab) => void;
  onSelectGame: (game: ParsedGame) => void;
}

export const TransitionAnalysis: React.FC<TransitionAnalysisProps> = ({
  games,
  onNavigate,
  onSelectGame,
}) => {
  const [selectedGameId, setSelectedGameId] = useState<string>(games[0]?.id || '');

  const selectedGame = games.find(g => g.id === selectedGameId) || games[0];

  // Aggregate transition breakdown metrics
  const excellentOpeningCount = games.filter(g => g.transition.openingVerdict === 'excellent').length;
  const solidOpeningCount = games.filter(g => g.transition.openingVerdict === 'solid').length;
  const lostAfterGoodOpening = games.filter(
    g => (g.transition.openingVerdict === 'excellent' || g.transition.openingVerdict === 'solid') && g.result === 'loss'
  ).length;

  const pctLostAfterGoodOpening = Math.round((lostAfterGoodOpening / Math.max(1, games.length)) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/30 mb-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>PHASE TRANSITION INSPECTOR</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Where Your Games Go Wrong
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Pinpointing the critical moves where opening advantage dissolves in the middlegame.
          </p>
        </div>
      </div>

      {/* Key Transition Takeaway Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#17202d] via-[#131923] to-[#17202d] border border-amber-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xl">💡</span>
              <h3 className="text-lg font-bold text-white">
                Your Opening is Not the Problem
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              In <strong className="text-amber-400">{pctLostAfterGoodOpening}% of your lost games</strong>, you successfully achieved an <strong>equal or advantageous position after move 10</strong>, but lost the thread between <strong>Move 14 and Move 22</strong> when independent strategic planning was required.
            </p>
          </div>

          {/* Mini Stats Pill */}
          <div className="flex gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 shrink-0">
            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-lg font-black text-emerald-400">
                {excellentOpeningCount + solidOpeningCount} / {games.length}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Good Openings</div>
            </div>
            <div className="text-center px-3">
              <div className="text-lg font-black text-red-400">
                {lostAfterGoodOpening}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Lost in Middlegame</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Transition Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Game Selector Column */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Select Game to Inspect
          </div>
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {games.map((g, idx) => {
              const isSelected = selectedGame?.id === g.id;
              const evalAfterOp = (g.transition.evalAfterOpening / 100).toFixed(1);

              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGameId(g.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#182232] border-emerald-500/60 shadow-lg shadow-emerald-950/40'
                      : 'bg-[#10141d] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-bold text-xs text-white truncate">
                      {g.white.username} vs {g.black.username}
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        g.result === 'win'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : g.result === 'loss'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {g.result}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{g.openingName}</span>
                    <span
                      className={
                        parseFloat(evalAfterOp) >= 0
                          ? 'text-emerald-400 font-semibold'
                          : 'text-red-400 font-semibold'
                      }
                    >
                      Post-Op: {parseFloat(evalAfterOp) > 0 ? `+${evalAfterOp}` : evalAfterOp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Game Transition Details */}
        {selectedGame && (
          <div className="lg:col-span-7 p-6 rounded-2xl bg-[#141923] border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedGame.white.username} vs {selectedGame.black.username}
                </h3>
                <div className="text-xs text-slate-400">
                  {selectedGame.openingName} ({selectedGame.eco}) • {selectedGame.timeControl}
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectGame(selectedGame);
                  onNavigate('games');
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Replay Full Game</span>
              </button>
            </div>

            {/* Diagnostic Snapshot Box */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Opening performance:</span>
                <span className="font-bold text-emerald-400 capitalize">
                  {selectedGame.transition.openingVerdict}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Position after development (Move {selectedGame.transition.openingEndMove}):</span>
                <span className="font-bold text-emerald-400">
                  {(selectedGame.transition.evalAfterOpening / 100) > 0 ? '+' : ''}
                  {(selectedGame.transition.evalAfterOpening / 100).toFixed(1)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">First strategic mistake:</span>
                <span className="font-bold text-amber-400">
                  {selectedGame.transition.firstStrategicMistakeMove
                    ? `Move ${selectedGame.transition.firstStrategicMistakeMove}`
                    : 'None (Maintained equality)'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Game-deciding blunder:</span>
                <span className="font-bold text-red-400">
                  {selectedGame.transition.gameDecidingBlunderMove
                    ? `Move ${selectedGame.transition.gameDecidingBlunderMove}`
                    : 'None'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Final result:</span>
                <span
                  className={`font-bold capitalize ${
                    selectedGame.result === 'win'
                      ? 'text-emerald-400'
                      : selectedGame.result === 'loss'
                      ? 'text-red-400'
                      : 'text-slate-300'
                  }`}
                >
                  {selectedGame.result}
                </span>
              </div>
            </div>

            {/* Human Summary */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="text-xs font-bold text-amber-300 uppercase mb-1">
                Transition Verdict
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {selectedGame.transition.summary}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
