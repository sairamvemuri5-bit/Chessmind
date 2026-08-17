export type Platform = 'lichess' | 'chesscom' | 'both' | 'custom';

export type GameResult = 'win' | 'loss' | 'draw';

export type MoveClassification = 
  | 'best'       // 🟢 Best move
  | 'good'       // 🟢 Solid move
  | 'inaccuracy' // 🟡 Inaccuracy (?!)
  | 'mistake'    // 🟠 Mistake (?)
  | 'blunder'    // 🔴 Blunder (??)
  | 'critical';  // ⭐ Critical turning point

export type ChessPhase = 'opening' | 'middlegame' | 'endgame';

export interface MoveAnalysis {
  moveNumber: number;
  ply: number;
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  color: 'w' | 'b';
  evalBefore: number; // centipawns or mate (e.g. +150 for +1.50)
  evalAfter: number;
  evalDiff: number;   // loss in centipawns for the moving player
  bestMoveSan?: string;
  bestMoveUci?: string;
  classification: MoveClassification;
  humanExplanation?: string;
  tacticalTags?: string[];
  clockRemaining?: number; // in seconds
  timeSpent?: number;     // in seconds
  isHeroMove: boolean;
  phase: ChessPhase;
}

export interface TransitionPoint {
  openingEndMove: number;
  evalAfterOpening: number;
  firstStrategicMistakeMove?: number;
  gameDecidingBlunderMove?: number;
  openingVerdict: 'excellent' | 'solid' | 'shaky' | 'disastrous';
  summary: string;
}

export interface ParsedGame {
  id: string;
  platform: Platform;
  url?: string;
  white: {
    username: string;
    rating: number;
  };
  black: {
    username: string;
    rating: number;
  };
  heroColor: 'w' | 'b';
  heroRating: number;
  opponentUsername: string;
  opponentRating: number;
  result: GameResult;
  termination: string;
  date: string;
  timeControl: string;
  timeCategory: 'bullet' | 'blitz' | 'rapid' | 'classical';
  eco: string;
  openingName: string;
  pgn: string;
  moves: MoveAnalysis[];
  accuracy: number; // 0 - 100
  opponentAccuracy: number;
  avgCentipawnLoss: number;
  blundersCount: number;
  mistakesCount: number;
  inaccuraciesCount: number;
  criticalMomentsCount: number;
  transition: TransitionPoint;
  phasePerformance: {
    openingAccuracy: number;
    middlegameAccuracy: number;
    endgameAccuracy: number;
  };
}

export interface WeaknessPattern {
  id: string;
  title: string;
  category: 'tactics' | 'positional' | 'time' | 'transition' | 'endgame';
  frequencyPercent: number; // e.g. 34%
  affectedGamesCount: number;
  severity: 'critical' | 'high' | 'medium';
  headline: string;
  description: string;
  commonTrigger: string;
  evidenceExamples: {
    gameId: string;
    gameTitle: string;
    moveNumber: number;
    fen: string;
    playedMove: string;
    betterMove: string;
    explanation: string;
  }[];
  coachingFix: string;
  recommendedDrills: string[];
}

export interface SituationalStats {
  id: string;
  name: string;
  category: 'tactical' | 'positional' | 'endgame' | 'psychology';
  description: string;
  icon: string;
  totalGamesOccurred: number;
  frequencyPercent: number; // e.g. 42% of games
  wins: number;
  draws: number;
  losses: number;
  winRate: number; // %
  drawRate: number;
  lossRate: number;
  performanceRating: number;
  commonMissedStrategy: string;
  recommendedKeyRule: string;
  sampleGameId?: string;
  sampleFen?: string;
}

export interface PhaseScore {
  score: number; // e.g. 8.7
  stars: number; // 1 to 5
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  bulletPoints: string[];
  keyStrengths: string[];
  keyWeaknesses: string[];
}

export interface PersonalChessProfile {
  heroUsername: string;
  totalGamesAnalyzed: number;
  dateRange: string;
  overallRatingEstimate: number;
  
  // Big summary
  phases: {
    opening: PhaseScore;
    middlegame: PhaseScore;
    endgame: PhaseScore;
  };
  
  biggestStrength: {
    title: string;
    description: string;
    evidence: string;
  };
  
  biggestWeakness: {
    title: string;
    description: string;
    evidence: string;
    actionableGoal: string;
  };
  
  mostCommonMistake: string;
  nextImprovementGoal: string;

  // Patterns & Situations
  topWeaknesses: WeaknessPattern[];
  situationalMastery: SituationalStats[];

  // Aggregated Stats
  stats: {
    winRate: number;
    drawRate: number;
    lossRate: number;
    avgAccuracy: number;
    avgCentipawnLoss: number;
    blundersPerGame: number;
    mistakesPerGame: number;
    accuracyAsWhite: number;
    accuracyAsBlack: number;
    winRateAsWhite: number;
    winRateAsBlack: number;
    timeControlBreakdown: {
      type: string;
      games: number;
      winRate: number;
      accuracy: number;
    }[];
    openingRepertoire: {
      eco: string;
      name: string;
      color: 'w' | 'b';
      gamesPlayed: number;
      winRate: number;
      avgAccuracy: number;
      verdict: 'Excellent' | 'Solid' | 'Struggling' | 'Avoid';
    }[];
    accuracyOverTime: {
      date: string;
      accuracy: number;
      centipawnLoss: number;
    }[];
  };

  // Platform comparison if applicable
  platformComparison?: {
    lichess?: {
      games: number;
      rating: number;
      winRate: number;
      accuracy: number;
      blundersPerGame: number;
    };
    chesscom?: {
      games: number;
      rating: number;
      winRate: number;
      accuracy: number;
      blundersPerGame: number;
    };
  };

  weeklyTrainingPlan: {
    focusArea: string;
    coreRules: string[];
    days: {
      day: string;
      routine: string;
      durationMinutes: number;
      category: 'Puzzles' | 'Opening' | 'Strategy' | 'Sparring' | 'Game Review';
    }[];
  };
}

export interface TrainingBotConfig {
  name: string;
  avatar: string;
  title: string;
  difficulty: 'adaptive' | 'easy' | 'standard' | 'punisher';
  targetWeaknessId: string;
  weaknessName: string;
  instructions: string;
  startingFen?: string;
  scenarioTitle?: string;
  scenarioDescription?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  referencedGames?: {
    gameId: string;
    title: string;
    moveNumber?: number;
    fen?: string;
    previewNote?: string;
  }[];
  suggestedQuestions?: string[];
}
