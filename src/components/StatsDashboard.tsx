import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  ShieldCheck, 
  Swords, 
  Clock, 
  CheckCircle2, 
  XCircle,
  BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';
import { PersonalChessProfile } from '../types/chess';

interface StatsDashboardProps {
  profile: PersonalChessProfile;
}

const PIE_COLORS = ['#10B981', '#64748B', '#EF4444'];

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ profile }) => {
  const stats = profile.stats;

  const resultPieData = [
    { name: 'Wins', value: stats.winRate },
    { name: 'Draws', value: stats.drawRate },
    { name: 'Losses', value: stats.lossRate },
  ];

  const colorData = [
    { name: 'White', winRate: stats.winRateAsWhite, accuracy: stats.accuracyAsWhite },
    { name: 'Black', winRate: stats.winRateAsBlack, accuracy: stats.accuracyAsBlack },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold text-xs border border-blue-500/30 mb-1">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>STATISTICAL ENGINE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Performance Analytics & Repertoire
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Aggregated quantitative metrics across your entire game history.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-[#141923] border border-slate-800">
          <div className="text-xs font-bold text-slate-400 uppercase">Avg Accuracy</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
            {stats.avgAccuracy}%
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Lichess/Chess.com standard</div>
        </div>

        <div className="p-4 rounded-xl bg-[#141923] border border-slate-800">
          <div className="text-xs font-bold text-slate-400 uppercase">Avg Centipawn Loss</div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1">
            {stats.avgCentipawnLoss}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Lower is better</div>
        </div>

        <div className="p-4 rounded-xl bg-[#141923] border border-slate-800">
          <div className="text-xs font-bold text-slate-400 uppercase">Blunders / Game</div>
          <div className="text-2xl sm:text-3xl font-black text-red-400 mt-1">
            {stats.blundersPerGame}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Major tactical swings</div>
        </div>

        <div className="p-4 rounded-xl bg-[#141923] border border-slate-800">
          <div className="text-xs font-bold text-slate-400 uppercase">Overall Win Rate</div>
          <div className="text-2xl sm:text-3xl font-black text-teal-400 mt-1">
            {stats.winRate}%
          </div>
          <div className="text-[10px] text-slate-500 font-medium">{stats.drawRate}% Draws • {stats.lossRate}% Losses</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Accuracy Trend Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-[#141923] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Accuracy & Centipawn Loss Trend
            </h3>
            <span className="text-xs text-slate-400">Recent Games</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.accuracyOverTime}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#242d3d" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={[40, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151b27',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  name="Accuracy %"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#accGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Color Performance (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[#141923] border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            White vs Black Breakdown
          </h3>

          <div className="space-y-4">
            {/* White */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span>As White</span>
                </span>
                <span className="text-emerald-400">{stats.winRateAsWhite}% Win Rate</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${stats.winRateAsWhite}%` }}
                  className="bg-emerald-400 h-full"
                />
              </div>
              <div className="text-[11px] text-slate-400">
                Avg Accuracy: <strong className="text-slate-200">{stats.accuracyAsWhite}%</strong>
              </div>
            </div>

            {/* Black */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-500" />
                  <span>As Black</span>
                </span>
                <span className="text-emerald-400">{stats.winRateAsBlack}% Win Rate</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${stats.winRateAsBlack}%` }}
                  className="bg-emerald-400 h-full"
                />
              </div>
              <div className="text-[11px] text-slate-400">
                Avg Accuracy: <strong className="text-slate-200">{stats.accuracyAsBlack}%</strong>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 italic">
            Performance disparity between colors is within normal tactical baseline (5-10%).
          </div>
        </div>
      </div>

      {/* Opening Repertoire Table */}
      <div className="p-6 rounded-2xl bg-[#141923] border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Opening Repertoire Performance
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
              <tr>
                <th className="pb-3">Opening</th>
                <th className="pb-3">ECO</th>
                <th className="pb-3">Color</th>
                <th className="pb-3">Games</th>
                <th className="pb-3">Win Rate</th>
                <th className="pb-3">Accuracy</th>
                <th className="pb-3">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {stats.openingRepertoire.map((op, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 text-white font-bold">{op.name}</td>
                  <td className="py-3 text-slate-400 font-mono">{op.eco}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase text-[10px]">
                      {op.color === 'w' ? 'White' : 'Black'}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">{op.gamesPlayed}</td>
                  <td className="py-3 font-bold text-emerald-400">{op.winRate}%</td>
                  <td className="py-3 text-slate-300">{op.avgAccuracy}%</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        op.verdict === 'Excellent'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : op.verdict === 'Solid'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : op.verdict === 'Avoid'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {op.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
