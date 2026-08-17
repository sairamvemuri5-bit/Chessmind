import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Sparkles, 
  Zap, 
  Layers, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Platform } from '../types/chess';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (options: {
    platform: Platform;
    lichessUsername?: string;
    chesscomUsername?: string;
    gameCount: number;
    customPgn?: string;
    pgnUsername?: string;
    useDemoProfile?: boolean;
  }) => Promise<void>;
  isLoading: boolean;
  progressMessage: string;
  errorMessage: string | null;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onAnalyze,
  isLoading,
  progressMessage,
  errorMessage,
}) => {
  const [platform, setPlatform] = useState<Platform>('lichess');
  const [lichessUser, setLichessUser] = useState('');
  const [chesscomUser, setChesscomUser] = useState('');
  const [gameCount, setGameCount] = useState<number>(25);
  const [activeTab, setActiveTab] = useState<'api' | 'demo' | 'pgn'>('demo');
  const [customPgn, setCustomPgn] = useState('');
  const [pgnUsername, setPgnUsername] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'demo') {
      await onAnalyze({
        platform: 'lichess',
        useDemoProfile: true,
        gameCount: 25,
      });
      return;
    }

    if (activeTab === 'pgn') {
      if (!customPgn.trim()) return;
      await onAnalyze({
        platform: 'custom',
        customPgn,
        pgnUsername: pgnUsername.trim() || undefined,
        gameCount: 25,
      });
      return;
    }

    await onAnalyze({
      platform,
      lichessUsername: lichessUser.trim() || undefined,
      chesscomUsername: chesscomUser.trim() || undefined,
      gameCount,
    });
  };

  const handleQuickLoadProfile = async (profilePlatform: 'lichess' | 'chesscom' | 'both', username: string) => {
    await onAnalyze({
      platform: profilePlatform,
      ...(profilePlatform === 'lichess'
        ? { lichessUsername: username }
        : profilePlatform === 'chesscom'
          ? { chesscomUsername: username }
          : { lichessUsername: username, chesscomUsername: username }),
      gameCount: 25,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#131822] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PERSONAL CHESS DIAGNOSTICS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Connect Your Chess Accounts
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
            We fetch your actual games and run deep algorithmic pattern analysis to uncover your recurring mistakes.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === 'demo'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Quick Public Profiles</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
              1-Click
            </span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === 'api'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Live Account Fetch</span>
          </button>

          <button
            onClick={() => setActiveTab('pgn')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === 'pgn'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste PGN</span>
          </button>
        </div>

        {/* Demo Profiles View */}
        {activeTab === 'demo' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300">
              <p className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Quick public-account analysis
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Load a recent public-game sample with one click. These are live account requests, so availability and loading time depend on Lichess or Chess.com.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLoadProfile('chesscom', 'MagnusCarlsen')}
                className="p-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-emerald-300 text-sm">
                    Magnus Carlsen (Chess.com)
                  </div>
                  <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                    GM · public account
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLoadProfile('both', 'Tangomonkey')}
                className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-sm">Tangomonkey (Both Platforms)</div>
                  <div className="text-[11px] text-slate-400">Your Lichess + Chess.com games</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLoadProfile('chesscom', 'Hikaru')}
                className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-sm">Hikaru (Chess.com)</div>
                  <div className="text-[11px] text-slate-400">GM Hikaru Nakamura</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLoadProfile('chesscom', 'GothamChess')}
                className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-sm">GothamChess (Chess.com)</div>
                  <div className="text-[11px] text-slate-400">IM Levy Rozman</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Live API Form */}
        {activeTab === 'api' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Platform Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Platform
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPlatform('lichess')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                    platform === 'lichess'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                      : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  Lichess.org
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('chesscom')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                    platform === 'chesscom'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                      : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  Chess.com
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('both')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                    platform === 'both'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                      : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  Combine Both
                </button>
              </div>
            </div>

            {/* Username Inputs */}
            {(platform === 'lichess' || platform === 'both') && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lichess Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. EricRosen, MagnusCarlsen..."
                  value={lichessUser}
                  onChange={e => setLichessUser(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            {(platform === 'chesscom' || platform === 'both') && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Chess.com Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hikaru, GothamChess..."
                  value={chesscomUser}
                  onChange={e => setChesscomUser(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Game Count Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Number of Games to Analyse
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { value: 10, label: 'Last 10' },
                  { value: 25, label: 'Last 25' },
                  { value: 50, label: 'Last 50' },
                  { value: 100, label: 'Last 100' },
                  { value: 250, label: 'Last 250' },
                  { value: 0, label: 'All Games 🌟' },
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setGameCount(item.value)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                      gameCount === item.value
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                        : 'bg-slate-800/40 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || (platform === 'lichess' && !lichessUser.trim()) || (platform === 'chesscom' && !chesscomUser.trim()) || (platform === 'both' && !lichessUser.trim() && !chesscomUser.trim())}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progressMessage || 'Analysing Games...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Pattern Diagnostics</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Custom PGN View */}
        {activeTab === 'pgn' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your username in these games <span className="text-slate-500 font-normal">(optional, needed when you played Black)</span>
              </label>
              <input
                type="text"
                value={pgnUsername}
                onChange={e => setPgnUsername(e.target.value)}
                placeholder="Exactly as it appears in the PGN"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Paste PGN Games (Supports Multi-Game PGN)
              </label>
              <textarea
                rows={6}
                value={customPgn}
                onChange={e => setCustomPgn(e.target.value)}
                placeholder="[Event &quot;Rated Blitz&quot;]&#10;1. e4 e5 2. Nf3 Nc6..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !customPgn.trim()}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analysing PGN...</span>
                </>
              ) : (
                <span>Analyse PGN Dataset</span>
              )}
            </button>
          </form>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
