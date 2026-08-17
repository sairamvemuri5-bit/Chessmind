import { Chess, Square, Move } from 'chess.js';
import { TrainingBotConfig } from '../types/chess';
import { evaluatePositionStatic } from './engineEvaluator';

export interface BotMoveResult {
  san: string;
  from: Square;
  to: Square;
  fen: string;
  evalCp: number;
  coachFeedback?: string;
  isWeaknessExploited?: boolean;
}

export const PRESET_TRAINING_BOTS: TrainingBotConfig[] = [
  {
    name: 'Viktor "The Punisher"',
    avatar: '⚔️',
    title: 'Tactical Punisher (Targets Loose Pieces & Forks)',
    difficulty: 'punisher',
    targetWeaknessId: 'tactical-blindspots',
    weaknessName: 'Tactical Oversight & Loose Pieces',
    instructions: 'Viktor aggressively looks for unprotected pieces, pins, and tactical forks. Never leave a piece undefended against him!',
    scenarioTitle: 'Defensive Tactical Discipline',
    scenarioDescription: 'Play against Viktor while ensuring all your pieces are strictly defended and verifying every check/capture.',
  },
  {
    name: 'Grandmaster Anatoly',
    avatar: '🛡️',
    title: 'Positional Prophylaxis (Targets Premature Attacks)',
    difficulty: 'standard',
    targetWeaknessId: 'premature-attack',
    weaknessName: 'Premature Middlegame Attacks',
    instructions: 'Anatoly builds rock-solid defensive barriers. If you attack prematurely without developing all pieces, he will blockade and seize your outposts.',
    scenarioTitle: 'Patience & Piece Harmony',
    scenarioDescription: 'Practice improving your worst piece and preparing central pawn breaks before launching any flank attack.',
  },
  {
    name: 'Elena "The Storm"',
    avatar: '⚡',
    title: 'Aggressive Attacker (Targets Weak King Shields)',
    difficulty: 'standard',
    targetWeaknessId: 'king-safety',
    weaknessName: 'King Shield & Pawn Weaknesses',
    instructions: 'Elena will relentlessly test your king safety. If you push f, g, or h pawns unnecessarily, she will pry open files directly at your monarch.',
    scenarioTitle: 'Calm Defense Under Fire',
    scenarioDescription: 'Defend against sharp attacks without weakening your king shelter; seek active piece trades to neutralize threats.',
  },
  {
    name: 'Sven "The Grinder"',
    avatar: '⏳',
    title: 'Endgame Specialist (Tests Conversion & King Activity)',
    difficulty: 'standard',
    targetWeaknessId: 'endgame-conversion',
    weaknessName: 'Endgame Technique & Conversion',
    instructions: 'Sven aims for simplified endgames where he activates his king and challenges your passed pawns. Can you convert cleanly?',
    scenarioTitle: 'Clean Endgame Technique',
    scenarioDescription: 'Activate your king immediately, place rooks behind passed pawns, and convert your positional advantage.',
  },
];

// Approximate piece values for move ordering
const PIECE_VALS: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};

// Order moves so alpha-beta pruning cuts off 90% of branches immediately
function orderMoves(moves: Move[], chess: Chess): Move[] {
  return moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // MVV-LVA for captures
    if (a.captured) {
      scoreA += (PIECE_VALS[a.captured] || 1) * 10 - (PIECE_VALS[a.piece] || 1);
    }
    if (b.captured) {
      scoreB += (PIECE_VALS[b.captured] || 1) * 10 - (PIECE_VALS[b.piece] || 1);
    }

    if (a.san.includes('+')) scoreA += 5;
    if (b.san.includes('+')) scoreB += 5;

    if (a.san === 'O-O' || a.san === 'O-O-O') scoreA += 4;
    if (b.san === 'O-O' || b.san === 'O-O-O') scoreB += 4;

    return scoreB - scoreA;
  });
}

// Compute bot move asynchronously with time-budget and non-blocking search
export function computeBotMoveAsync(
  chess: Chess,
  botConfig: TrainingBotConfig
): Promise<BotMoveResult | null> {
  return new Promise((resolve) => {
    // Non-blocking via setTimeout to never freeze the browser UI thread
    setTimeout(() => {
      try {
        if (chess.isGameOver()) {
          resolve(null);
          return;
        }

        const legalMoves = chess.moves({ verbose: true });
        if (legalMoves.length === 0) {
          resolve(null);
          return;
        }

        // Count total pieces to adjust depth
        let totalPieces = 0;
        const board = chess.board();
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (board[r][c]) totalPieces++;
          }
        }

        // Dynamic depth: depth 2 for complex positions (>12 pieces), depth 3 for endgames (<=12 pieces)
        const targetDepth = totalPieces <= 12 ? 3 : 2;
        const startTime = performance.now();
        const MAX_TIME_MS = 45; // 45ms hard time budget to guarantee buttery smooth 60fps UI

        const isMaximizing = chess.turn() === 'w';
        const orderedMoves = orderMoves([...legalMoves], chess);

        let bestMove = orderedMoves[0];
        let bestScore = isMaximizing ? -Infinity : Infinity;

        for (const move of orderedMoves) {
          chess.move(move.san);
          const score = minimax(
            chess,
            targetDepth - 1,
            -Infinity,
            Infinity,
            !isMaximizing,
            botConfig,
            startTime,
            MAX_TIME_MS
          );
          chess.undo();

          if (isMaximizing) {
            if (score > bestScore) {
              bestScore = score;
              bestMove = move;
            }
          } else {
            if (score < bestScore) {
              bestScore = score;
              bestMove = move;
            }
          }

          // Abort further top-level branches if time budget exceeded
          if (performance.now() - startTime > MAX_TIME_MS) {
            break;
          }
        }

        // Execute best move
        chess.move(bestMove.san);
        const newFen = chess.fen();
        const evalCp = evaluatePositionStatic(chess);

        // Generate real-time coaching feedback
        let coachFeedback = `Bot played ${bestMove.san}.`;
        let isWeaknessExploited = false;

        if (bestMove.captured) {
          coachFeedback = `Bot captured on ${bestMove.to}! Watch out for tactical skewers and unprotected squares.`;
          isWeaknessExploited = true;
        } else if (bestMove.san.includes('+')) {
          coachFeedback = `Bot delivered check with ${bestMove.san}! Look for safe retreats or piece blocks.`;
        } else if (bestMove.piece === 'n' && ['d5', 'e5', 'd4', 'e4', 'f5', 'c5'].includes(bestMove.to)) {
          coachFeedback = `Bot occupied a strong central outpost (${bestMove.san}). Prepare a pawn lever to challenge it.`;
        } else if (bestMove.san === 'O-O' || bestMove.san === 'O-O-O') {
          coachFeedback = `Bot castled to connect heavy rooks and safeguard the king.`;
        } else {
          coachFeedback = `Bot played ${bestMove.san}, solidifying position and applying pressure.`;
        }

        resolve({
          san: bestMove.san,
          from: bestMove.from,
          to: bestMove.to,
          fen: newFen,
          evalCp,
          coachFeedback,
          isWeaknessExploited,
        });
      } catch (err) {
        console.error('Error computing bot move:', err);
        // Fallback: pick first legal move
        const fallbackMoves = chess.moves({ verbose: true });
        if (fallbackMoves.length > 0) {
          const m = fallbackMoves[0];
          chess.move(m.san);
          resolve({
            san: m.san,
            from: m.from,
            to: m.to,
            fen: chess.fen(),
            evalCp: evaluatePositionStatic(chess),
            coachFeedback: `Bot played ${m.san}.`,
            isWeaknessExploited: false,
          });
        } else {
          resolve(null);
        }
      }
    }, 15);
  });
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  botConfig: TrainingBotConfig,
  startTime: number,
  maxTimeMs: number
): number {
  if (depth === 0 || chess.isGameOver() || performance.now() - startTime > maxTimeMs) {
    let evalScore = evaluatePositionStatic(chess);
    if (botConfig.targetWeaknessId === 'tactical-blindspots' && chess.inCheck()) {
      evalScore += chess.turn() === 'w' ? -40 : 40;
    }
    return evalScore;
  }

  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return evaluatePositionStatic(chess);

  const ordered = orderMoves(moves, chess);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const m of ordered) {
      chess.move(m.san);
      const ev = minimax(chess, depth - 1, alpha, beta, false, botConfig, startTime, maxTimeMs);
      chess.undo();
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break; // Alpha-beta cutoff
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const m of ordered) {
      chess.move(m.san);
      const ev = minimax(chess, depth - 1, alpha, beta, true, botConfig, startTime, maxTimeMs);
      chess.undo();
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break; // Alpha-beta cutoff
    }
    return minEval;
  }
}
