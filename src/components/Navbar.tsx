import React from 'react';
import { 
  ShieldAlert, 
  Brain, 
  Swords, 
  Compass, 
  Sparkles, 
  Calendar, 
  BarChart3, 
  Target,
  Puzzle,
  RotateCcw, 
  Volume2, 
  VolumeX, 
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { Platform } from '../types/chess';
import { chessAudio } from '../utils/audio';

export type NavTab = 
  | 'overview' 
  | 'problems' 
  | 'transitions' 
  | 'situations' 
  | 'games' 
  | 'sparring' 
  | 'coach' 
  | 'training' 
  | 'stats'
  | 'scout'
  | 'puzzles';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  username: string;
  platform: Platform;
  ratingEstimate: number;
  onOpenOnboarding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  username,
  platform,
  ratingEstimate,
  onOpenOnboarding,
}) => {
  const [soundOn, setSoundOn] = React.useState(chessAudio.isEnabled());

  const handleToggleSound = () => {
    const next = chessAudio.toggleSound();
    setSoundOn(next);
  };

  const navItems = [
    { id: 'overview', label: 'Chess Profile', icon: Brain },
    { id: 'problems', label: 'Biggest Problems', icon: ShieldAlert },
    { id: 'transitions', label: 'Where Games Go Wrong', icon: TrendingDown },
    { id: 'situations', label: 'Situational Mastery', icon: Compass },
    { id: 'sparring', label: 'Sparring Bot', icon: Swords, badge: 'NEW' },
    { id: 'games', label: 'Game Timeline', icon: RotateCcw },
    { id: 'coach', label: 'Ask My Games', icon: Sparkles, badge: 'AI' },
    { id: 'training', label: 'Weekly Training', icon: Calendar },
    { id: 'stats', label: 'Stats & Compare', icon: BarChart3 },
    { id: 'scout', label: 'Opponent Scout', icon: Target },
    { id: 'puzzles', label: 'My Puzzles', icon: Puzzle, badge: 'NEW' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0c1017]/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('overview')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/30 border border-emerald-400/30">
              <span className="text-xl">♞</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                  ChessMind
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  AI COACH
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Stop analysing individual games. Understand your chess.
              </p>
            </div>
          </div>

          {/* Right Actions: Player Badge & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Player Pill */}
            <button
              onClick={onOpenOnboarding}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all text-xs font-medium text-slate-200 group"
              title="Click to analyze a different username or platform"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-emerald-400">@{username}</span>
              <span className="text-slate-400">({ratingEstimate} Elo)</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 uppercase tracking-wide">
                {platform}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-lg border transition-colors ${
                soundOn
                  ? 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:bg-slate-800'
              }`}
              title={soundOn ? 'Mute sound effects' : 'Unmute sound effects'}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-1 py-2 border-t border-slate-800/40" aria-label="Main navigation">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`min-w-0 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                    item.badge === 'AI' 
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40' 
                      : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
