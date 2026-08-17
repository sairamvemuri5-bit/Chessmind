import { Chess, PieceSymbol } from 'chess.js';
import { MoveAnalysis, MoveClassification, TransitionPoint, ChessPhase } from '../types/chess';

// Standard piece base values (centipawns)
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square tables (PST) for positional evaluation (from White's perspective)
const PAWN_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_PST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_PST = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

const KING_MG_PST = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-20,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

// Evaluate position statically (positive is good for White, negative for Black)
export function evaluatePositionStatic(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -10000 : 10000;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
    return 0;
  }

  let evalCp = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const baseVal = PIECE_VALUES[piece.type];
      let pstVal = 0;

      // Map row index: White pieces are at r=6,7 initially, Black at r=0,1
      const whiteRow = r;
      const blackRow = 7 - r;

      if (piece.type === 'p') {
        pstVal = piece.color === 'w' ? PAWN_PST[whiteRow][c] : PAWN_PST[blackRow][c];
      } else if (piece.type === 'n') {
        pstVal = piece.color === 'w' ? KNIGHT_PST[whiteRow][c] : KNIGHT_PST[blackRow][c];
      } else if (piece.type === 'b') {
        pstVal = piece.color === 'w' ? BISHOP_PST[whiteRow][c] : BISHOP_PST[blackRow][c];
      } else if (piece.type === 'r') {
        pstVal = piece.color === 'w' ? ROOK_PST[whiteRow][c] : ROOK_PST[blackRow][c];
      } else if (piece.type === 'k') {
        pstVal = piece.color === 'w' ? KING_MG_PST[whiteRow][c] : KING_MG_PST[blackRow][c];
      }

      const totalVal = baseVal + pstVal;
      if (piece.color === 'w') {
        evalCp += totalVal;
      } else {
        evalCp -= totalVal;
      }
    }
  }

  return evalCp;
}

export interface EngineMoveSuggestion {
  san: string;
  from: string;
  to: string;
  evaluation: number;
}

// A small, deterministic local search used for puzzles and recommendations.
// It is intentionally bounded so it remains usable in the browser.
export function findBestMove(fen: string, depth = 2): EngineMoveSuggestion | null {
  const chess = new Chess(fen);
  const rootColor = chess.turn();
  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  const search = (position: Chess, remaining: number): number => {
    if (remaining === 0 || position.isGameOver()) return evaluatePositionStatic(position);
    const moves = position.moves({ verbose: true });
    let value = position.turn() === 'w' ? -Infinity : Infinity;
    for (const move of moves) {
      position.move(move.san);
      const score = search(position, remaining - 1);
      position.undo();
      value = position.turn() === 'w' ? Math.max(value, score) : Math.min(value, score);
    }
    return value;
  };

  let best = legalMoves[0];
  let bestScore = rootColor === 'w' ? -Infinity : Infinity;
  for (const move of legalMoves) {
    chess.move(move.san);
    const score = search(chess, depth - 1);
    chess.undo();
    if ((rootColor === 'w' && score > bestScore) || (rootColor === 'b' && score < bestScore)) {
      best = move;
      bestScore = score;
    }
  }
  return { san: best.san, from: best.from, to: best.to, evaluation: bestScore };
}

// Convert centipawns to win probability (0 to 100) from White's perspective
// Uses the standard Lichess / CAPS2 win percentage model
export function evalToWinProbability(evalCp: number, color: 'w' | 'b'): number {
  if (evalCp >= 9000) return color === 'w' ? 100 : 0;
  if (evalCp <= -9000) return color === 'w' ? 0 : 100;

  // Logistic model: W(eval) = 50 + 50 * (2 / (1 + exp(-0.00368208 * eval)) - 1)
  const clampedEval = Math.max(-1500, Math.min(1500, evalCp));
  const whiteWinPct = 100 / (1 + Math.exp(-0.00368208 * clampedEval));

  return color === 'w' ? whiteWinPct : (100 - whiteWinPct);
}

// Classify move based on Win Probability Loss (Win% Drop) rather than raw centipawn delta
// This ensures that humans are not penalized for natural human moves, winning simplifications, or opening lines
export function classifyMove(
  evalBefore: number,
  evalAfter: number,
  color: 'w' | 'b',
  isCheckmate: boolean,
  ply: number = 20
): { classification: MoveClassification; evalDiff: number; winPctDrop: number } {
  // Raw centipawn difference for moving player
  const evalDiff = color === 'w' ? (evalBefore - evalAfter) : (evalAfter - evalBefore);

  if (isCheckmate) {
    return { classification: 'best', evalDiff: 0, winPctDrop: 0 };
  }

  const winBefore = evalToWinProbability(evalBefore, color);
  const winAfter = evalToWinProbability(evalAfter, color);
  const winPctDrop = Math.max(0, winBefore - winAfter);

  // In opening moves (first 10 moves / 20 plies), standard human developing moves are best/good
  if (ply <= 16) {
    if (winPctDrop <= 4.0 || evalDiff <= 45) {
      return { classification: 'best', evalDiff: Math.max(0, evalDiff), winPctDrop };
    }
    if (winPctDrop <= 10.0 || evalDiff <= 90) {
      return { classification: 'good', evalDiff, winPctDrop };
    }
    if (winPctDrop <= 18.0 || evalDiff <= 180) {
      return { classification: 'inaccuracy', evalDiff, winPctDrop };
    }
    if (winPctDrop <= 30.0 || evalDiff <= 320) {
      return { classification: 'mistake', evalDiff, winPctDrop };
    }
    return { classification: 'blunder', evalDiff, winPctDrop };
  }

  // Middlegame and endgame: Win Probability based thresholds
  // 1. Best move: win% drop <= 2.5%
  if (winPctDrop <= 2.5 || (evalDiff <= 25 && winPctDrop <= 5.0)) {
    return { classification: 'best', evalDiff: Math.max(0, evalDiff), winPctDrop };
  }

  // 2. Good move: win% drop <= 6.5% (very normal human positional play)
  if (winPctDrop <= 6.5 || (evalDiff <= 65 && winPctDrop <= 9.0)) {
    return { classification: 'good', evalDiff, winPctDrop };
  }

  // 3. Inaccuracy: win% drop <= 14.0%
  if (winPctDrop <= 14.0 || evalDiff <= 140) {
    return { classification: 'inaccuracy', evalDiff, winPctDrop };
  }

  // 4. Mistake: win% drop <= 25.0%
  if (winPctDrop <= 25.0 || evalDiff <= 280) {
    return { classification: 'mistake', evalDiff, winPctDrop };
  }

  // 5. Blunder: win% drop > 25.0%
  return { classification: 'blunder', evalDiff, winPctDrop };
}

// Generate human explanation for a move
export function generateHumanExplanation(
  san: string,
  classification: MoveClassification,
  color: 'w' | 'b',
  evalBefore: number,
  evalAfter: number,
  chessBefore?: Chess,
  bestMoveSan?: string
): string {
  const isHeroLeading = (color === 'w' && evalBefore > 180) || (color === 'b' && evalBefore < -180);
  const droppedSignificantAdvantage = isHeroLeading && ((color === 'w' && evalAfter <= 40) || (color === 'b' && evalAfter >= -40));

  if (classification === 'best') {
    if (san.includes('#')) return 'Delivered checkmate with precise execution!';
    if (san.includes('+')) return 'Strong checking move keeping up the pressure.';
    if (san.includes('x')) return 'Precise tactical capture winning material or opening key files.';
    if (san === 'O-O' || san === 'O-O-O') return 'Castled to safeguard the king and connect the heavy rooks.';
    return 'The most accurate move, optimizing piece coordination and board control.';
  }

  if (classification === 'good') {
    if (san === 'O-O' || san === 'O-O-O') return 'Castled safely to connect rooks.';
    if (san.includes('x')) return 'Solid capture keeping balanced piece coordination.';
    return 'Solid, natural move that maintains the position.';
  }

  if (classification === 'blunder') {
    if (droppedSignificantAdvantage) {
      return `Critical turning point. You had a winning advantage, but ${san} gave away the initiative. ${bestMoveSan ? `Playing ${bestMoveSan} would have maintained control.` : ''}`;
    }
    if (san.includes('x')) {
      return `This trade was flawed. It opened up attacking lines for the opponent or lost a key piece.`;
    }
    if (san.startsWith('P') || san.match(/^[a-h][1-8]/)) {
      return `Pawn push that created permanent square weaknesses and left a piece undefended. Better was ${bestMoveSan || 'solidifying your position'}.`;
    }
    if (san.startsWith('N') || san.startsWith('B')) {
      return `Moving this minor piece left your position vulnerable to tactical strikes. ${bestMoveSan ? `A better plan was ${bestMoveSan}.` : ''}`;
    }
    return `Tactical oversight that shifted the evaluation against you. ${bestMoveSan ? `Strongest was ${bestMoveSan}.` : ''}`;
  }

  if (classification === 'mistake') {
    return `Inaccurate positional decision. ${san} allowed opponent counterplay. ${bestMoveSan ? `Preferred was ${bestMoveSan} to keep pressure.` : ''}`;
  }

  if (classification === 'inaccuracy') {
    return `Slight inaccuracy. ${san} is playable, but ${bestMoveSan || 'another developing move'} was more harmonious.`;
  }

  return 'Solid developing move.';
}

// Helper to determine game phase
export function getGamePhase(ply: number, fen: string): ChessPhase {
  if (ply <= 18) return 'opening';
  
  const chess = new Chess(fen);
  const board = chess.board();
  let majorMinorCount = 0;
  let queensCount = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (p.type === 'q') queensCount++;
      if (['r', 'b', 'n', 'q'].includes(p.type)) majorMinorCount++;
    }
  }

  if (queensCount === 0 || majorMinorCount <= 6) {
    return 'endgame';
  }
  return 'middlegame';
}

// Compute transition point for a game
export function analyzeGameTransition(moves: MoveAnalysis[], heroColor: 'w' | 'b'): TransitionPoint {
  const openingMoves = moves.filter(m => m.phase === 'opening');
  const openingEndMove = Math.max(1, Math.floor(openingMoves.length / 2));
  
  const lastOpeningMove = openingMoves[openingMoves.length - 1];
  const evalAfterOpening = lastOpeningMove ? lastOpeningMove.evalAfter : 0;

  const heroMiddlegameMoves = moves.filter(m => m.isHeroMove && m.phase === 'middlegame');
  
  const firstMistake = heroMiddlegameMoves.find(m => m.classification === 'mistake' || m.classification === 'blunder');
  const firstBlunder = heroMiddlegameMoves.find(m => m.classification === 'blunder');

  const heroEvalAfterOpening = heroColor === 'w' ? evalAfterOpening : -evalAfterOpening;

  let openingVerdict: 'excellent' | 'solid' | 'shaky' | 'disastrous' = 'solid';
  if (heroEvalAfterOpening >= 80) openingVerdict = 'excellent';
  else if (heroEvalAfterOpening >= -60) openingVerdict = 'solid';
  else if (heroEvalAfterOpening >= -200) openingVerdict = 'shaky';
  else openingVerdict = 'disastrous';

  let summary = '';
  if (openingVerdict === 'excellent' && firstBlunder) {
    summary = `You emerged from the opening with a great position (${(heroEvalAfterOpening / 100).toFixed(1)}), but lost the thread in the middlegame around Move ${firstBlunder.moveNumber}.`;
  } else if (firstMistake) {
    summary = `Solid opening transition. The first strategic crack appeared at Move ${firstMistake.moveNumber} with ${firstMistake.san}.`;
  } else {
    summary = `Consistent play through the transition phase with solid piece development.`;
  }

  return {
    openingEndMove,
    evalAfterOpening,
    firstStrategicMistakeMove: firstMistake?.moveNumber,
    gameDecidingBlunderMove: firstBlunder?.moveNumber,
    openingVerdict,
    summary,
  };
}
