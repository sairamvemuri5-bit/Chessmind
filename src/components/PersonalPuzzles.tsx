import React, { useMemo, useState } from 'react';
import { Square } from 'chess.js';
import { Brain, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { ParsedGame } from '../types/chess';
import { findBestMove } from '../services/engineEvaluator';
import { ChessboardView } from './ChessboardView';

interface PersonalPuzzlesProps { games: ParsedGame[]; }

export const PersonalPuzzles: React.FC<PersonalPuzzlesProps> = ({ games }) => {
  const candidates = useMemo(() => games.flatMap(game =>
    game.moves.filter(move => move.isHeroMove && ['mistake', 'blunder', 'critical'].includes(move.classification))
      .map(move => ({ game, move }))
  ), [games]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const puzzle = candidates[index % Math.max(1, candidates.length)];
  const suggestion = useMemo(() => puzzle ? findBestMove(puzzle.move.fenBefore) : null, [puzzle]);

  const nextPuzzle = () => { setIndex(value => value + 1); setResult(null); };
  if (!puzzle || !suggestion) return <div className="text-slate-400">No missed-move puzzles are available from this set of games yet.</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold text-xs border border-amber-500/30 mb-1"><Brain className="w-3.5 h-3.5" /> YOUR GAME PUZZLES</div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">Find the better move you missed</h2>
        <p className="text-sm text-slate-400 mt-1">Position from {puzzle.game.white.username} vs {puzzle.game.black.username}, move {puzzle.move.moveNumber}. You played {puzzle.move.san}; find the local engine’s stronger move.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#141923] border border-slate-800 flex justify-center">
          <ChessboardView fen={puzzle.move.fenBefore} orientation={puzzle.game.heroColor} interactive={result !== 'correct'} bestMove={result ? { from: suggestion.from, to: suggestion.to } : null} onMove={(move) => setResult(move.from === suggestion.from && move.to === suggestion.to ? 'correct' : 'wrong')} />
        </div>
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#141923] border border-slate-800 space-y-4">
          <h3 className="font-bold text-white">Your turn</h3>
          <p className="text-sm text-slate-400">Check forcing moves first: checks, captures, then threats.</p>
          {result === 'correct' && <div className="p-3 rounded-lg bg-emerald-500/15 text-emerald-200 text-sm flex gap-2"><CheckCircle2 className="w-5 h-5" /> Correct — {suggestion.san} is the local engine’s top move.</div>}
          {result === 'wrong' && <div className="p-3 rounded-lg bg-red-500/15 text-red-200 text-sm flex gap-2"><XCircle className="w-5 h-5" /> Not the top move. The green highlight shows {suggestion.san}; try to work out why before moving on.</div>}
          <button onClick={nextPuzzle} className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm flex justify-center gap-2"><RefreshCw className="w-4 h-4" /> Next puzzle</button>
        </div>
      </div>
    </div>
  );
};
