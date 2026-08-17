import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Play, 
  Pause, 
  RefreshCw, 
  Sparkles, 
  Star, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Share2
} from 'lucide-react';
import { ParsedGame, MoveAnalysis } from '../types/chess';
import { ChessboardView } from './ChessboardView';
import { getMoveClassificationDetails, formatEval } from '../utils/formatters';
import { chessAudio } from '../utils/audio';

interface GameTimelineProps {
  games: ParsedGame[];
  selectedGame: ParsedGame;
  onSelectGame: (game: ParsedGame) => void;
  startingPly?: number;
}

export const GameTimeline: React.FC<GameTimelineProps> = ({
  games,
  selectedGame,
  onSelectGame,
  startingPly,
}) => {
  const [currentPly, setCurrentPly] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<'w' | 'b'>(selectedGame.heroColor);

  // Reset ply when selected game changes
  useEffect(() => {
    setCurrentPly(Math.max(0, Math.min(selectedGame.moves.length, startingPly || 0)));
    setIsPlaying(false);
    setOrientation(selectedGame.heroColor);
  }, [selectedGame, startingPly]);

  // Autoplay timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentPly(prev => {
          if (prev >= selectedGame.moves.length) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          const nextMove = selectedGame.moves[next - 1];
          if (nextMove) {
            if (nextMove.san.includes('x')) chessAudio.playCapture();
            else if (nextMove.san.includes('+')) chessAudio.playCheck();
            else chessAudio.playMove();
          }
          return next;
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedGame.moves]);

  const currentMove: MoveAnalysis | undefined =
    currentPly > 0 ? selectedGame.moves[currentPly - 1] : undefined;

  const currentFen = currentMove ? currentMove.fenAfter : selectedGame.moves[0]?.fenBefore || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const currentEval = currentMove ? currentMove.evalAfter : 20;

  const lastMoveObj = currentMove
    ? {
        from: currentMove.uci.slice(0, 2),
        to: currentMove.uci.slice(2, 4),
      }
    : null;

  const goToPly = (ply: number) => {
    const clamped = Math.max(0, Math.min(selectedGame.moves.length, ply));
    setCurrentPly(clamped);
    if (clamped > 0) {
      const m = selectedGame.moves[clamped - 1];
      if (m?.san.includes('x')) chessAudio.playCapture();
      else if (m?.san.includes('+')) chessAudio.playCheck();
      else chessAudio.playMove();
    }
  };

  const classificationDetails = currentMove
    ? getMoveClassificationDetails(currentMove.classification)
    : null;

  return (
    <div className="space-y-6">
      {/* Header & Game Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/30 mb-1">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>INTERACTIVE MOVE TIMELINE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {selectedGame.white.username} vs {selectedGame.black.username}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {selectedGame.openingName} ({selectedGame.eco}) • {selectedGame.date} • {selectedGame.timeControl}
          </p>
        </div>

        {/* Game Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400 hidden sm:block">
            Select Game:
          </label>
          <select
            value={selectedGame.id}
            onChange={e => {
              const found = games.find(g => g.id === e.target.value);
              if (found) onSelectGame(found);
            }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 max-w-xs truncate"
          >
            {games.map(g => (
              <option key={g.id} value={g.id}>
                {g.result.toUpperCase()}: {g.white.username} vs {g.black.username} ({g.openingName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Critical Moments Filter Bar */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-purple-400 fill-purple-400" />
          <span className="text-xs font-bold text-slate-200">Jump to Critical Turning Points:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {selectedGame.moves
            .filter(m => m.classification === 'critical' || m.classification === 'blunder' || m.classification === 'mistake')
            .map((m, idx) => (
              <button
                key={idx}
                onClick={() => goToPly(m.ply)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  currentPly === m.ply
                    ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-950'
                    : m.classification === 'critical'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                    : m.classification === 'blunder'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                    : 'bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30'
                }`}
              >
                <span>
                  {m.classification === 'critical' ? '⭐' : m.classification === 'blunder' ? '🔴' : '🟠'}
                </span>
                <span>
                  {m.color === 'w' ? `${m.moveNumber}.` : `${m.moveNumber}...`} {m.san}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Main Board & Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Chessboard */}
        <div className="lg:col-span-7 flex flex-col items-center p-6 rounded-2xl bg-[#141923] border border-slate-800 shadow-2xl">
          {/* Top Bar above Board */}
          <div className="w-full flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-200">
                {orientation === 'w' ? selectedGame.black.username : selectedGame.white.username}
              </span>
              <span className="text-[10px] text-slate-400">
                ({orientation === 'w' ? selectedGame.black.rating : selectedGame.white.rating})
              </span>
            </div>

            <button
              onClick={() => setOrientation(prev => (prev === 'w' ? 'b' : 'w'))}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs flex items-center gap-1"
              title="Flip Board"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Flip</span>
            </button>
          </div>

          <ChessboardView
            fen={currentFen}
            orientation={orientation}
            interactive={false}
            lastMove={lastMoveObj}
            evalCp={currentEval}
          />

          {/* Bottom Bar below Board */}
          <div className="w-full flex items-center justify-between mt-4 px-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-200">
                {orientation === 'w' ? selectedGame.white.username : selectedGame.black.username}
              </span>
              <span className="text-[10px] text-slate-400">
                ({orientation === 'w' ? selectedGame.white.rating : selectedGame.black.rating})
              </span>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Eval: <strong className="text-white">{formatEval(currentEval)}</strong>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-2 mt-5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => goToPly(0)}
              disabled={currentPly === 0}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30"
              title="Start"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToPly(currentPly - 1)}
              disabled={currentPly === 0}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30"
              title="Previous Move"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 px-3 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold"
              title={isPlaying ? 'Pause' : 'Autoplay'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => goToPly(currentPly + 1)}
              disabled={currentPly >= selectedGame.moves.length}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30"
              title="Next Move"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToPly(selectedGame.moves.length)}
              disabled={currentPly >= selectedGame.moves.length}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30"
              title="End"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Human Commentary & Move Tree */}
        <div className="lg:col-span-5 space-y-4">
          {/* Plain-English Human Move Explanation */}
          {currentMove && classificationDetails && (
            <div className="p-5 rounded-2xl bg-[#151c27] border border-slate-700/80 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{classificationDetails.icon}</span>
                  <span className="font-bold text-sm text-white">
                    Move {currentMove.moveNumber}: {currentMove.san}
                  </span>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${classificationDetails.badgeClass}`}
                >
                  {classificationDetails.label}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">
                {currentMove.humanExplanation}
              </p>

              {currentMove.clockRemaining !== undefined && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Clock remaining: {currentMove.clockRemaining}s</span>
                </div>
              )}
            </div>
          )}

          {/* Full Move List */}
          <div className="p-5 rounded-2xl bg-[#141923] border border-slate-800 shadow-xl">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Game Notation
            </div>

            <div className="max-h-72 overflow-y-auto font-mono text-xs pr-2 space-y-1">
              {Array.from({ length: Math.ceil(selectedGame.moves.length / 2) }).map((_, i) => {
                const whiteMove = selectedGame.moves[i * 2];
                const blackMove = selectedGame.moves[i * 2 + 1];

                const isWhiteActive = currentPly === i * 2 + 1;
                const isBlackActive = currentPly === i * 2 + 2;

                return (
                  <div key={i} className="flex items-center gap-2 py-0.5 text-slate-300">
                    <span className="w-8 text-slate-500 text-right">{i + 1}.</span>

                    {/* White Move */}
                    {whiteMove && (
                      <button
                        onClick={() => goToPly(whiteMove.ply)}
                        className={`flex-1 text-left px-2 py-1 rounded transition-all flex items-center justify-between ${
                          isWhiteActive
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <span>{whiteMove.san}</span>
                        {whiteMove.classification !== 'good' && whiteMove.classification !== 'best' && (
                          <span className="text-[10px]">
                            {whiteMove.classification === 'blunder' ? '🔴' : whiteMove.classification === 'mistake' ? '🟠' : '🟡'}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Black Move */}
                    {blackMove && (
                      <button
                        onClick={() => goToPly(blackMove.ply)}
                        className={`flex-1 text-left px-2 py-1 rounded transition-all flex items-center justify-between ${
                          isBlackActive
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <span>{blackMove.san}</span>
                        {blackMove.classification !== 'good' && blackMove.classification !== 'best' && (
                          <span className="text-[10px]">
                            {blackMove.classification === 'blunder' ? '🔴' : blackMove.classification === 'mistake' ? '🟠' : '🟡'}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
