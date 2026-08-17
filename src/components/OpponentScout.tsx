import React, { useState } from 'react';
import { Target, Search, AlertTriangle, Loader2 } from 'lucide-react';
import { Platform, PersonalChessProfile } from '../types/chess';
import { fetchLichessGames } from '../services/lichessApi';
import { fetchChessComGames } from '../services/chessComApi';
import { generatePersonalProfile } from '../services/profileGenerator';

export const OpponentScout: React.FC = () => {
  const [platform, setPlatform] = useState<Extract<Platform, 'lichess' | 'chesscom'>>('lichess');
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState<PersonalChessProfile | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scout = async (event: React.FormEvent) => {
    event.preventDefault(); if (!username.trim()) return;
    setLoading(true); setError(''); setProfile(null);
    try {
      const games = platform === 'lichess'
        ? await fetchLichessGames(username.trim(), 50, setStatus)
        : await fetchChessComGames(username.trim(), 50, setStatus);
      setProfile(generatePersonalProfile(games, username.trim()));
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not analyse this public account.'); }
    finally { setLoading(false); }
  };
  return <div className="space-y-6">
    <div><div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-300 font-bold text-xs border border-red-500/30 mb-1"><Target className="w-3.5 h-3.5" /> OPPONENT SCOUT</div><h2 className="text-2xl sm:text-3xl font-black text-white">Prepare against a public opponent</h2><p className="text-sm text-slate-400 mt-1">Analyse recent public games to identify practical weaknesses and their most common openings.</p></div>
    <form onSubmit={scout} className="p-5 rounded-2xl bg-[#141923] border border-slate-800 flex flex-col sm:flex-row gap-3">
      <select value={platform} onChange={e => setPlatform(e.target.value as typeof platform)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-white"><option value="lichess">Lichess</option><option value="chesscom">Chess.com</option></select>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Opponent username" className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white" />
      <button disabled={loading || !username.trim()} className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 font-bold text-sm text-white flex justify-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}{loading ? status || 'Scouting…' : 'Scout account'}</button>
    </form>
    {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">{error}</div>}
    {profile && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-5 rounded-2xl bg-[#141923] border border-slate-800"><h3 className="font-bold text-white">Exploit these patterns</h3><div className="space-y-3 mt-4">{profile.topWeaknesses.slice(0, 3).map(weakness => <div key={weakness.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800"><div className="font-bold text-amber-300">{weakness.title} · {weakness.frequencyPercent}%</div><p className="text-xs text-slate-400 mt-1">{weakness.description}</p><p className="text-xs text-emerald-300 mt-2"><strong>Game plan:</strong> {weakness.coachingFix}</p></div>)}</div></div>
      <div className="p-5 rounded-2xl bg-[#141923] border border-slate-800"><h3 className="font-bold text-white">Opening tendencies</h3><div className="space-y-2 mt-4">{profile.stats.openingRepertoire.slice(0, 5).map(opening => <div key={`${opening.name}-${opening.color}`} className="flex justify-between text-sm border-b border-slate-800 pb-2"><span className="text-slate-200">{opening.name} <span className="text-slate-500">as {opening.color === 'w' ? 'White' : 'Black'}</span></span><span className="text-slate-400">{opening.gamesPlayed} games · {opening.winRate}% wins</span></div>)}</div><p className="text-xs text-slate-500 mt-4">Use this as preparation, not certainty: it describes recent public games rather than a guaranteed strategy.</p></div>
    </div>}
  </div>;
};
