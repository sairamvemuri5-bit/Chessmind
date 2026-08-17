import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { BiggestProblems } from './components/BiggestProblems';
import { TransitionAnalysis } from './components/TransitionAnalysis';
import { SituationalMastery } from './components/SituationalMastery';
import { GameTimeline } from './components/GameTimeline';
import { SparringBotArena } from './components/SparringBotArena';
import { AskMyGames } from './components/AskMyGames';
import { TrainingPlan } from './components/TrainingPlan';
import { StatsDashboard } from './components/StatsDashboard';
import { PlatformCompare } from './components/PlatformCompare';
import { OpponentScout } from './components/OpponentScout';
import { PersonalPuzzles } from './components/PersonalPuzzles';
import { OnboardingModal } from './components/OnboardingModal';
import { ParsedGame, PersonalChessProfile, Platform } from './types/chess';
import { getSampleProfileAlex } from './data/sampleProfiles';
import { fetchLichessGames } from './services/lichessApi';
import { fetchChessComGames } from './services/chessComApi';
import { parsePgnGame } from './services/pgnParser';
import { generatePersonalProfile } from './services/profileGenerator';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active dataset
  const [profile, setProfile] = useState<PersonalChessProfile>(() => getSampleProfileAlex().profile);
  const [games, setGames] = useState<ParsedGame[]>(() => getSampleProfileAlex().games);
  const [selectedGame, setSelectedGame] = useState<ParsedGame>(() => getSampleProfileAlex().games[0]);
  const [selectedPly, setSelectedPly] = useState(0);
  const [activeSparringWeaknessId, setActiveSparringWeaknessId] = useState<string | undefined>(undefined);

  const [platform, setPlatform] = useState<Platform>('lichess');

  // Handle Analysis Flow from Onboarding
  const handleAnalyze = async (options: {
    platform: Platform;
    lichessUsername?: string;
    chesscomUsername?: string;
    gameCount: number;
    customPgn?: string;
    pgnUsername?: string;
    useDemoProfile?: boolean;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (options.useDemoProfile) {
        const { profile: demoProf, games: demoGames } = getSampleProfileAlex();
        setProfile(demoProf);
        setGames(demoGames);
        setSelectedGame(demoGames[0]);
        setPlatform('lichess');
        setIsOnboardingOpen(false);
        setIsLoading(false);
        return;
      }

      let fetchedGames: ParsedGame[] = [];
      let heroName = 'Player';

      if (options.customPgn) {
        setProgressMessage('Parsing PGN dataset...');
        const blocks = options.customPgn
          .split(/\n\n(?=\[Event )/)
          .map(p => p.trim())
          .filter(p => p.length > 0);

        for (const block of blocks) {
          const parsed = parsePgnGame(block, options.pgnUsername, 'custom');
          if (parsed) fetchedGames.push(parsed);
        }
        heroName = options.pgnUsername || fetchedGames[0]?.white.username || 'Custom PGN';
      } else if (options.platform === 'lichess' && options.lichessUsername) {
        heroName = options.lichessUsername;
        fetchedGames = await fetchLichessGames(
          options.lichessUsername,
          options.gameCount,
          setProgressMessage
        );
      } else if (options.platform === 'chesscom' && options.chesscomUsername) {
        heroName = options.chesscomUsername;
        fetchedGames = await fetchChessComGames(
          options.chesscomUsername,
          options.gameCount,
          setProgressMessage
        );
      } else if (options.platform === 'both') {
        const lichessPromise = options.lichessUsername
          ? fetchLichessGames(options.lichessUsername, Math.round(options.gameCount / 2), setProgressMessage)
          : Promise.resolve([]);
        const chesscomPromise = options.chesscomUsername
          ? fetchChessComGames(options.chesscomUsername, Math.round(options.gameCount / 2), setProgressMessage)
          : Promise.resolve([]);

        const [lGames, cGames] = await Promise.all([lichessPromise, chesscomPromise]);
        fetchedGames = [...lGames, ...cGames];
        heroName = options.lichessUsername || options.chesscomUsername || 'Player';
      }

      if (fetchedGames.length === 0) {
        throw new Error('No games could be retrieved for this player. Please check the spelling or try another user.');
      }

      setProgressMessage('Aggregating patterns and building personal chess profile...');
      const generatedProfile = generatePersonalProfile(fetchedGames, heroName);

      setGames(fetchedGames);
      setSelectedGame(fetchedGames[0]);
      setProfile(generatedProfile);
      setPlatform(options.platform);
      setIsOnboardingOpen(false);
      setActiveTab('overview');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while fetching games.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBotForWeakness = (weaknessId: string) => {
    setActiveSparringWeaknessId(weaknessId);
    setActiveTab('sparring');
  };

  return (
    <div className="min-h-screen bg-[#090C10] text-[#E2E8F0] flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        username={profile.heroUsername}
        platform={platform}
        ratingEstimate={profile.overallRatingEstimate}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <DashboardOverview
            profile={profile}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'problems' && (
          <BiggestProblems
            weaknesses={profile.topWeaknesses}
            onNavigate={setActiveTab}
            onSelectBotForWeakness={handleSelectBotForWeakness}
          />
        )}

        {activeTab === 'transitions' && (
          <TransitionAnalysis
            games={games}
            onNavigate={setActiveTab}
            onSelectGame={setSelectedGame}
          />
        )}

        {activeTab === 'situations' && (
          <SituationalMastery
            situations={profile.situationalMastery}
            onNavigate={setActiveTab}
            onSelectBotForWeakness={handleSelectBotForWeakness}
          />
        )}

        {activeTab === 'sparring' && (
          <SparringBotArena
            initialWeaknessId={activeSparringWeaknessId}
          />
        )}

        {activeTab === 'games' && (
          <GameTimeline
            games={games}
            selectedGame={selectedGame}
            onSelectGame={(game) => { setSelectedGame(game); setSelectedPly(0); }}
            startingPly={selectedPly}
          />
        )}

        {activeTab === 'coach' && (
          <AskMyGames
            profile={profile}
            games={games}
            onNavigate={setActiveTab}
            onSelectGame={setSelectedGame}
            onOpenPosition={(game, ply) => { setSelectedGame(game); setSelectedPly(ply); setActiveTab('games'); }}
          />
        )}

        {activeTab === 'training' && (
          <TrainingPlan
            profile={profile}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8">
            <StatsDashboard profile={profile} />
            <PlatformCompare profile={profile} />
          </div>
        )}

        {activeTab === 'scout' && <OpponentScout />}

        {activeTab === 'puzzles' && <PersonalPuzzles games={games} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0a0d14] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">ChessMind</span>
            <span>• Long-term algorithmic pattern recognition & personalized AI coaching</span>
          </div>
          <div className="text-slate-400">
            Powered by Stockfish & Open APIs (Lichess & Chess.com)
          </div>
        </div>
      </footer>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onAnalyze={handleAnalyze}
        isLoading={isLoading}
        progressMessage={progressMessage}
        errorMessage={errorMessage}
      />
    </div>
  );
};
