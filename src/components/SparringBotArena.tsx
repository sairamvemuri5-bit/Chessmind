import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { 
  Swords, 
  RotateCcw, 
  Sparkles, 
  ShieldAlert, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Trophy,
  Volume2
} from 'lucide-react';
import { PRESET_TRAINING_BOTS, computeBotMoveAsync } from '../services/weaknessBotEngine';
import { TrainingBotConfig } from '../types/chess';
import { ChessboardView } from './ChessboardView';
import { chessAudio } from '../utils/audio';

interface SparringBotArenaProps {
  initialWeaknessId?: string;
}

export const SparringBotArena: React.FC<SparringBotArenaProps> = ({ initialWeaknessId }) => {
  const [selectedBotIndex, setSelectedBotIndex] = useState(0);
  const [chess, setChess] = useState<Chess>(new Chess());
  const [fen, setFen] = useState<string>(new Chess().fen());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [evalCp, setEvalCp] = useState<number>(0);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [coachAlerts, setCoachAlerts] = useState<{ type: 'warn' | 'good' | 'info'; text: string }[]>([
    {
      type: 'info',
      text: 'Welcome to the Sparring Arena! Make your move on the board. The bot will actively test your recurring habits.',
    },
  ]);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');

  const activeBot = PRESET_TRAINING_BOTS[selectedBotIndex] || PRESET_TRAINING_BOTS[0];

  // If initialWeaknessId is passed, select matching bot
  useEffect(() => {
    if (initialWeaknessId) {
      const idx = PRESET_TRAINING_BOTS.findIndex(b => b.targetWeaknessId.includes(initialWeaknessId));
      if (idx !== -1) {
        setSelectedBotIndex(idx);
      }
    }
  }, [initialWeaknessId]);

  const startNewMatch = async (color: 'w' | 'b' = playerColor) => {
    const newGame = new Chess();
    setPlayerColor(color);
    setChess(newGame);
    setFen(newGame.fen());
    setMoveHistory([]);
    setLastMove(null);
    setEvalCp(0);
    setGameResult(null);
    setCoachAlerts([
      {
        type: 'info',
        text: `New match started against ${activeBot.name}. Focus on: ${activeBot.instructions}`,
      },
    ]);

    // When playing Black, let the bot make White's opening move first.
    if (color === 'b') {
      setIsBotThinking(true);
      const botMove = await computeBotMoveAsync(newGame, activeBot);
      setIsBotThinking(false);
      if (botMove) {
        setChess(newGame);
        setFen(botMove.fen);
        setLastMove({ from: botMove.from, to: botMove.to });
        setMoveHistory(newGame.history());
        setEvalCp(botMove.evalCp);
      }
    }
  };

  const handleResetGame = () => { void startNewMatch(); };

  const handleUserMove = async (moveData: { from: Square; to: Square; promotion?: string }) => {
    if (isBotThinking || gameResult) return;

    try {
      // Clone game instance to prevent race conditions
      const currentInstance = new Chess(chess.fen());
      if (currentInstance.turn() !== playerColor) return;
      const moveResult = currentInstance.move({
        from: moveData.from,
        to: moveData.to,
        promotion: moveData.promotion || 'q',
      });
      if (!moveResult) return;

      const newFen = currentInstance.fen();
      setChess(currentInstance);
      setFen(newFen);
      setLastMove({ from: moveData.from, to: moveData.to });
      setMoveHistory(currentInstance.history());

      // Play move sound
      if (moveResult.captured) chessAudio.playCapture();
      else if (currentInstance.inCheck()) chessAudio.playCheck();
      else chessAudio.playMove();

      // Check if user move triggers habit warning
      if (activeBot.targetWeaknessId === 'premature-attack' && (moveResult.san.startsWith('g4') || moveResult.san.startsWith('f4') || moveResult.san.startsWith('h4'))) {
        setCoachAlerts(prev => [
          {
            type: 'warn',
            text: `⚠️ Habit Triggered: You pushed a flank pawn (${moveResult.san}) before finishing central piece coordination!`,
          },
          ...prev.slice(0, 4),
        ]);
      } else if (moveResult.san.includes('+')) {
        setCoachAlerts(prev => [
          {
            type: 'good',
            text: `🎯 Active check with ${moveResult.san}! Maintain positional harmony.`,
          },
          ...prev.slice(0, 4),
        ]);
      }

      if (currentInstance.isCheckmate()) {
        chessAudio.playSuccess();
        setGameResult('You won by Checkmate! 🎉');
        return;
      }
      if (currentInstance.isDraw() || currentInstance.isStalemate() || currentInstance.isThreefoldRepetition()) {
        setGameResult('Game drawn.');
        return;
      }

      // Trigger bot turn safely
      setIsBotThinking(true);
      const botMove = await computeBotMoveAsync(currentInstance, activeBot);
      setIsBotThinking(false);

      if (botMove) {
        setChess(currentInstance);
        setFen(botMove.fen);
        setLastMove({ from: botMove.from, to: botMove.to });
        setMoveHistory(currentInstance.history());
        setEvalCp(botMove.evalCp);

        if (botMove.san.includes('x')) chessAudio.playCapture();
        else if (currentInstance.inCheck()) chessAudio.playCheck();
        else chessAudio.playMove();

        if (botMove.coachFeedback) {
          setCoachAlerts(prev => [
            {
              type: botMove.isWeaknessExploited ? 'warn' : 'info',
              text: botMove.coachFeedback || '',
            },
            ...prev.slice(0, 4),
          ]);
        }

        if (currentInstance.isCheckmate()) {
          chessAudio.playBlunder();
          setGameResult(`${activeBot.name} won by Checkmate.`);
        } else if (currentInstance.isDraw() || currentInstance.isStalemate() || currentInstance.isThreefoldRepetition()) {
          setGameResult('Game drawn.');
        }
      }
    } catch (err) {
      console.error('Error handling user/bot move:', err);
      setIsBotThinking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/30 mb-1">
            <Swords className="w-3.5 h-3.5" />
            <span>WEAKNESS-TARGETED SPARRING</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Weakness Sparring Bot
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Spar against specialized bots programmed to specifically test and punish your recurring habits.
          </p>
        </div>

        <button
          onClick={handleResetGame}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Match</span>
        </button>
      </div>

      {/* Bot Selector Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PRESET_TRAINING_BOTS.map((bot, idx) => {
          const isSelected = selectedBotIndex === idx;
          return (
            <div
              key={bot.name}
              onClick={() => {
                setSelectedBotIndex(idx);
                handleResetGame();
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#182332] border-emerald-500 shadow-lg shadow-emerald-950/50'
                  : 'bg-[#10141d] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-2xl">{bot.avatar}</span>
                <div>
                  <div className="font-bold text-xs text-white">{bot.name}</div>
                  <div className="text-[10px] text-emerald-400 font-medium">
                    {bot.weaknessName}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {bot.instructions}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-[#141923] border border-slate-800">
        <span className="text-xs font-bold text-slate-300 mr-1">Play as</span>
        <button onClick={() => void startNewMatch('w')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${playerColor === 'w' ? 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-slate-300'}`}>White</button>
        <button onClick={() => void startNewMatch('b')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${playerColor === 'b' ? 'bg-slate-700 text-white border border-slate-500' : 'bg-slate-800 text-slate-300'}`}>Black</button>
        <span className="text-[11px] text-slate-500">Changing colour starts a fresh match.</span>
      </div>

      {/* Interactive Sparring Arena Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Chessboard */}
        <div className="lg:col-span-7 flex flex-col items-center p-6 rounded-2xl bg-[#141923] border border-slate-800 shadow-2xl">
          <div className="w-full flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeBot.avatar}</span>
              <div>
                <div className="font-bold text-xs text-white">{activeBot.name}</div>
                <div className="text-[10px] text-slate-400">
                  {isBotThinking ? 'Thinking...' : 'Ready'}
                </div>
              </div>
            </div>

            {gameResult && (
              <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40">
                {gameResult}
              </div>
            )}
          </div>

          <ChessboardView
            fen={fen}
            orientation={playerColor}
            interactive={!isBotThinking && !gameResult}
            lastMove={lastMove}
            evalCp={evalCp}
            onMove={handleUserMove}
          />

          <div className="w-full flex items-center justify-between mt-4 px-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">You ({playerColor === 'w' ? 'White' : 'Black'})</span>
            <span>Click any piece to see legal dots, then click target square.</span>
          </div>
        </div>

        {/* Right: Live Coach Commentary & Move Log */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Coaching Box */}
          <div className="p-5 rounded-2xl bg-[#151c27] border border-slate-700/80 shadow-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Live Coaching Stream
              </span>
            </div>

            <div className="space-y-2.5 min-h-[160px]">
              {coachAlerts.map((alert, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl text-xs leading-relaxed transition-all ${
                    alert.type === 'warn'
                      ? 'bg-red-500/15 border border-red-500/30 text-red-200'
                      : alert.type === 'good'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-200'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-300'
                  }`}
                >
                  {alert.text}
                </div>
              ))}
            </div>
          </div>

          {/* Move Log */}
          <div className="p-5 rounded-2xl bg-[#141923] border border-slate-800 shadow-xl">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Move History ({moveHistory.length} plies)
            </div>

            <div className="max-h-48 overflow-y-auto font-mono text-xs space-y-1 pr-2">
              {moveHistory.length === 0 ? (
                <div className="text-slate-500 italic">No moves yet. Make your first move!</div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">{i + 1}.</span>
                      <span className="font-semibold text-white">{moveHistory[i * 2]}</span>
                      <span className="text-slate-400">{moveHistory[i * 2 + 1] || ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
