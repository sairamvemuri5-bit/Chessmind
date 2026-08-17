import React from 'react';
import { Layers, CheckCircle2, TrendingUp, Sparkles, Swords, BarChart3 } from 'lucide-react';
import { PersonalChessProfile } from '../types/chess';

interface PlatformCompareProps {
  profile: PersonalChessProfile;
}

export const PlatformCompare: React.FC<PlatformCompareProps> = ({ profile }) => {
  const comparison = profile.platformComparison;

  const lichess = comparison?.lichess;
  const chesscom = comparison?.chesscom;

  if (!lichess || !chesscom) {
    return (
      <div className="p-6 rounded-2xl bg-[#141923] border border-slate-800 shadow-xl">
        <h2 className="text-lg font-black text-white">Platform comparison needs both accounts</h2>
        <p className="text-sm text-slate-400 mt-2">Analyse at least one Lichess and one Chess.com account together. ChessMind will only show a comparison when it has real games from both platforms.</p>
      </div>
    );
  }

  const metrics = [
    { label: 'Rating Estimate', lichess: lichess.rating, chesscom: chesscom.rating, suffix: ' Elo', isHigherBetter: true },
    { label: 'Win Rate', lichess: `${lichess.winRate}%`, chesscom: `${chesscom.winRate}%`, rawL: lichess.winRate, rawC: chesscom.winRate, isHigherBetter: true },
    { label: 'Average Accuracy', lichess: `${lichess.accuracy}%`, chesscom: `${chesscom.accuracy}%`, rawL: lichess.accuracy, rawC: chesscom.accuracy, isHigherBetter: true },
    { label: 'Blunders Per Game', lichess: lichess.blundersPerGame, chesscom: chesscom.blundersPerGame, isHigherBetter: false },
    { label: 'Games Analysed', lichess: lichess.games, chesscom: chesscom.games, isHigherBetter: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold text-xs border border-blue-500/30 mb-1">
          <Layers className="w-3.5 h-3.5" />
          <span>CROSS-PLATFORM BENCHMARK</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Lichess vs Chess.com Head-to-Head
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Comparing your performance metrics and habits across both chess platforms.
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lichess Card */}
        <div className="p-6 rounded-2xl bg-[#141923] border border-slate-700/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                🐴
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Lichess.org</h3>
                <div className="text-xs text-slate-400">{lichess.games} Games Analysed</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-emerald-400">{lichess.rating}</div>
              <div className="text-[10px] text-slate-400">Rating</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Win Rate:</span>
              <span className="font-bold text-emerald-400">{lichess.winRate}%</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Average Accuracy:</span>
              <span className="font-bold text-white">{lichess.accuracy}%</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="text-slate-400">Blunders / Game:</span>
              <span className="font-bold text-red-400">{lichess.blundersPerGame}</span>
            </div>
          </div>
        </div>

        {/* Chess.com Card */}
        <div className="p-6 rounded-2xl bg-[#141923] border border-slate-700/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-xl">
                ♟️
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Chess.com</h3>
                <div className="text-xs text-slate-400">{chesscom.games} Games Analysed</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-emerald-400">{chesscom.rating}</div>
              <div className="text-[10px] text-slate-400">Rating</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Win Rate:</span>
              <span className="font-bold text-emerald-400">{chesscom.winRate}%</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Average Accuracy:</span>
              <span className="font-bold text-white">{chesscom.accuracy}%</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="text-slate-400">Blunders / Game:</span>
              <span className="font-bold text-red-400">{chesscom.blundersPerGame}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Comparison Metric Table */}
      <div className="p-6 rounded-2xl bg-[#141923] border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Side-by-Side Diagnostic Breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
              <tr>
                <th className="pb-3">Metric</th>
                <th className="pb-3">Lichess.org</th>
                <th className="pb-3">Chess.com</th>
                <th className="pb-3">Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {metrics.map((m, idx) => {
                const lichessBetter = m.isHigherBetter ? (Number(m.lichess) > Number(m.chesscom)) : (Number(m.lichess) < Number(m.chesscom));
                return (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 text-white font-semibold">{m.label}</td>
                    <td className="py-3 font-bold text-emerald-400">
                      {m.lichess}{m.suffix || ''}
                    </td>
                    <td className="py-3 font-bold text-amber-400">
                      {m.chesscom}{m.suffix || ''}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {lichessBetter ? 'Lichess higher' : 'Chess.com higher'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
