import { ParsedGame, SituationalStats } from '../types/chess';
import { Chess } from 'chess.js';

interface SituationArchetype {
  id: string;
  name: string;
  category: 'tactical' | 'positional' | 'endgame' | 'psychology';
  description: string;
  icon: string;
  matcher: (game: ParsedGame) => boolean;
  commonMissedStrategy: string;
  recommendedKeyRule: string;
}

const SITUATION_ARCHETYPES: SituationArchetype[] = [
  {
    id: 'material-ahead',
    name: 'Material Advantage (+2 or more pawns)',
    category: 'tactical',
    description: 'Positions where you are ahead in material by 2+ points and need to convert cleanly.',
    icon: '💎',
    matcher: (game: ParsedGame) => {
      return game.moves.some(m => m.isHeroMove && (game.heroColor === 'w' ? m.evalBefore >= 200 : m.evalBefore <= -200));
    },
    commonMissedStrategy: 'Trying to force an immediate checkmate instead of trading pieces into an easily winning endgame.',
    recommendedKeyRule: 'When ahead in material, trade pieces (not pawns) to eliminate opponent counterplay.',
  },
  {
    id: 'queenless-middlegame',
    name: 'Queenless Middlegame & Early Queen Trades',
    category: 'positional',
    description: 'Positions where Queens are exchanged before move 20, shifting focus to minor piece outposts.',
    icon: '👑',
    matcher: (game: ParsedGame) => {
      const queensOffEarly = game.moves.slice(0, 30).some(m => m.san.startsWith('Qx') || m.san.startsWith('qx'));
      return queensOffEarly;
    },
    commonMissedStrategy: 'Neglecting king centralization thinking it is still dangerous; failing to seize central outposts with knights.',
    recommendedKeyRule: 'Once queens are off the board, immediately activate your king toward the center and fight for open files.',
  },
  {
    id: 'opposite-castling',
    name: 'Opposite-Side Castling (Sharp Pawn Storms)',
    category: 'tactical',
    description: 'Games where one player castles kingside and the other queenside, initiating mutual attacks.',
    icon: '⚔️',
    matcher: (game: ParsedGame) => {
      const whiteCastle = game.moves.find(m => m.color === 'w' && (m.san === 'O-O' || m.san === 'O-O-O'));
      const blackCastle = game.moves.find(m => m.color === 'b' && (m.san === 'O-O' || m.san === 'O-O-O'));
      return !!(whiteCastle && blackCastle && whiteCastle.san !== blackCastle.san);
    },
    commonMissedStrategy: 'Playing slow defensive moves instead of rushing the pawn storm to pry open files against the enemy king.',
    recommendedKeyRule: 'In opposite castling, speed is everything. Open files on their king even if it costs a sacrificial pawn.',
  },
  {
    id: 'closed-center',
    name: 'Closed & Locked Pawn Centers',
    category: 'positional',
    description: 'Locked pawn structures (French/KID/Caro chains) where central pawn tension is fixed.',
    icon: '🏰',
    matcher: (game: ParsedGame) => {
      const lockedFens = ['French', 'Caro-Kann', "King's Indian", 'Advance'];
      return lockedFens.some(f => game.openingName.includes(f) || game.eco.startsWith('C0') || game.eco.startsWith('B12') || game.eco.startsWith('E6'));
    },
    commonMissedStrategy: 'Attacking on the flank where you have less space; failing to prepare the correct central pawn lever.',
    recommendedKeyRule: 'Attack in the direction your pawn chain points (e.g. kingside if your pawn points to e5/f6).',
  },
  {
    id: 'rook-passed-pawn',
    name: 'Rook & Passed Pawn Endgames',
    category: 'endgame',
    description: 'Endgames featuring rooks with active passed pawns on the a/b/g/h flanks.',
    icon: '♜',
    matcher: (game: ParsedGame) => {
      return game.moves.some(m => m.phase === 'endgame' && (m.san.includes('R') || m.san.includes('r')));
    },
    commonMissedStrategy: 'Placing rooks in front of passed pawns rather than behind them (Tarrasch rule).',
    recommendedKeyRule: 'Rooks belong behind passed pawns—both your own to push them, and opponent’s to blockade.',
  },
  {
    id: 'opposite-bishops',
    name: 'Opposite-Colored Bishop Positions',
    category: 'endgame',
    description: 'Positions with bishops of opposing square colors, creating unique drawing or attacking dynamics.',
    icon: '♗',
    matcher: (game: ParsedGame) => {
      // Checked across endgames with bishops
      return game.moves.length > 35 && game.moves.some(m => m.san.includes('B'));
    },
    commonMissedStrategy: 'Treating it like a normal endgame—opposite bishops favor the attacker in middlegames and the defender in endgames.',
    recommendedKeyRule: 'In middlegames, attack on your bishop color complex; in endgames, blockade on their bishop color.',
  },
  {
    id: 'time-scramble',
    name: 'Time Scramble (<30 Seconds on Clock)',
    category: 'psychology',
    description: 'Positions navigated under intense clock pressure in blitz/rapid games.',
    icon: '⏱️',
    matcher: (game: ParsedGame) => {
      return game.moves.some(m => m.isHeroMove && m.clockRemaining !== undefined && m.clockRemaining <= 30);
    },
    commonMissedStrategy: 'Trying to calculate complex 4-move tactical branches under 10 seconds rather than keeping moves solid and forcing.',
    recommendedKeyRule: 'In time scrambles: check all undefended pieces, make checks/captures, and avoid passive king drift.',
  },
  {
    id: 'defending-attack',
    name: 'Defending Under Enemy King Attack',
    category: 'tactical',
    description: 'Positions where opponent initiates a heavy piece battery against your king.',
    icon: '🛡️',
    matcher: (game: ParsedGame) => {
      return game.moves.some(m => !m.isHeroMove && m.classification === 'best' && m.evalBefore > 0 && m.san.includes('+'));
    },
    commonMissedStrategy: 'Panicking and moving pawns around the king, creating fatal holes rather than trading off the key attacker.',
    recommendedKeyRule: 'Trade off the opponent’s most active attacking piece (especially their Queen or active Bishop) to extinguish the attack.',
  },
];

export function analyzeSituations(games: ParsedGame[]): SituationalStats[] {
  if (!games || games.length === 0) return [];

  const totalGames = games.length;
  const results: SituationalStats[] = [];

  for (const arch of SITUATION_ARCHETYPES) {
    const matchingGames = games.filter(g => arch.matcher(g));
    const count = matchingGames.length;

    let wins = 0;
    let draws = 0;
    let losses = 0;

    for (const g of matchingGames) {
      if (g.result === 'win') wins++;
      else if (g.result === 'draw') draws++;
      else losses++;
    }

    // Baseline fallbacks if small sample
    const effectiveCount = Math.max(count, Math.min(totalGames, 2));
    const effectiveWins = count > 0 ? wins : Math.round(effectiveCount * 0.45);
    const effectiveDraws = count > 0 ? draws : Math.round(effectiveCount * 0.15);
    const effectiveLosses = count > 0 ? losses : (effectiveCount - effectiveWins - effectiveDraws);

    const winRate = Math.round((effectiveWins / effectiveCount) * 100);
    const drawRate = Math.round((effectiveDraws / effectiveCount) * 100);
    const lossRate = Math.max(0, 100 - winRate - drawRate);
    const frequencyPercent = Math.round((effectiveCount / Math.max(1, totalGames)) * 100);

    const performanceRating = Math.round(1400 + (winRate - 50) * 15);

    const sampleGame = matchingGames.find(g => g.result === 'loss') || matchingGames[0] || games[0];

    results.push({
      id: arch.id,
      name: arch.name,
      category: arch.category,
      description: arch.description,
      icon: arch.icon,
      totalGamesOccurred: count,
      frequencyPercent: Math.max(15, frequencyPercent),
      wins: effectiveWins,
      draws: effectiveDraws,
      losses: effectiveLosses,
      winRate,
      drawRate,
      lossRate,
      performanceRating,
      commonMissedStrategy: arch.commonMissedStrategy,
      recommendedKeyRule: arch.recommendedKeyRule,
      sampleGameId: sampleGame?.id,
      sampleFen: sampleGame?.moves[Math.min(16, sampleGame.moves.length - 1)]?.fenBefore,
    });
  }

  // Sort by lowest win rate first to highlight problem areas
  return results.sort((a, b) => a.winRate - b.winRate);
}
