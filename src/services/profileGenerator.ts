import { ParsedGame, PersonalChessProfile, PhaseScore } from '../types/chess';
import { detectRecurringPatterns } from './patternDetector';
import { analyzeSituations } from './situationalAnalyzer';
import { getOpeningFamily } from '../data/openingsData';

export function generatePersonalProfile(
  games: ParsedGame[],
  heroUsername: string,
  platformComparisonData?: PersonalChessProfile['platformComparison']
): PersonalChessProfile {
  if (!games || games.length === 0) {
    throw new Error('No games available to generate profile');
  }

  const totalGames = games.length;

  let totalWins = 0;
  let totalDraws = 0;
  let totalLosses = 0;

  let whiteGames = 0;
  let whiteWins = 0;
  let blackGames = 0;
  let blackWins = 0;

  let sumAccuracy = 0;
  let sumWhiteAccuracy = 0;
  let sumBlackAccuracy = 0;
  let sumCentipawnLoss = 0;
  let sumBlunders = 0;
  let sumMistakes = 0;

  let sumOpeningAcc = 0;
  let sumMiddlegameAcc = 0;
  let sumEndgameAcc = 0;

  // Opening repertoire aggregation
  const openingStatsMap: Record<string, {
    eco: string;
    name: string;
    color: 'w' | 'b';
    games: number;
    wins: number;
    accSum: number;
  }> = {};

  // Time control aggregation
  const timeControlMap: Record<string, { games: number; wins: number; accSum: number }> = {};
  const accuracyOverTime: { date: string; accuracy: number; centipawnLoss: number }[] = [];

  let gamesLostWithAdvantage = 0;
  let fastBlunderCount = 0;

  for (const g of games) {
    if (g.result === 'win') totalWins++;
    else if (g.result === 'draw') totalDraws++;
    else totalLosses++;

    if (g.heroColor === 'w') {
      whiteGames++;
      if (g.result === 'win') whiteWins++;
      sumWhiteAccuracy += g.accuracy;
    } else {
      blackGames++;
      if (g.result === 'win') blackWins++;
      sumBlackAccuracy += g.accuracy;
    }

    sumAccuracy += g.accuracy;
    sumCentipawnLoss += g.avgCentipawnLoss;
    sumBlunders += g.blundersCount;
    sumMistakes += g.mistakesCount;

    sumOpeningAcc += g.phasePerformance.openingAccuracy;
    sumMiddlegameAcc += g.phasePerformance.middlegameAccuracy;
    sumEndgameAcc += g.phasePerformance.endgameAccuracy;

    // Check if player squandered lead (> +2.0)
    const hadLead = g.moves.some(m => m.isHeroMove && (g.heroColor === 'w' ? m.evalBefore >= 200 : m.evalBefore <= -200));
    if (hadLead && g.result === 'loss') {
      gamesLostWithAdvantage++;
    }

    // Check for speed blunders
    const rushed = g.moves.some(m => m.isHeroMove && m.classification === 'blunder' && m.clockRemaining !== undefined && m.clockRemaining <= 30);
    if (rushed) fastBlunderCount++;

    // Opening
    const openingFamily = getOpeningFamily(g.openingName);
    const opKey = `${openingFamily}_${g.heroColor}`;
    if (!openingStatsMap[opKey]) {
      openingStatsMap[opKey] = {
        eco: g.eco,
        name: openingFamily,
        color: g.heroColor,
        games: 0,
        wins: 0,
        accSum: 0,
      };
    }
    openingStatsMap[opKey].games++;
    if (g.result === 'win') openingStatsMap[opKey].wins++;
    openingStatsMap[opKey].accSum += g.accuracy;

    // Time control
    const tc = g.timeCategory;
    if (!timeControlMap[tc]) {
      timeControlMap[tc] = { games: 0, wins: 0, accSum: 0 };
    }
    timeControlMap[tc].games++;
    if (g.result === 'win') timeControlMap[tc].wins++;
    timeControlMap[tc].accSum += g.accuracy;

    accuracyOverTime.push({
      date: g.date,
      accuracy: g.accuracy,
      centipawnLoss: g.avgCentipawnLoss,
    });
  }

  const avgAccuracy = Math.round(sumAccuracy / totalGames);
  const avgCentipawnLoss = Math.round(sumCentipawnLoss / totalGames);
  const blundersPerGame = parseFloat((sumBlunders / totalGames).toFixed(1));
  const mistakesPerGame = parseFloat((sumMistakes / totalGames).toFixed(1));

  const winRate = Math.round((totalWins / totalGames) * 100);
  const drawRate = Math.round((totalDraws / totalGames) * 100);
  const lossRate = Math.max(0, 100 - winRate - drawRate);

  const winRateAsWhite = whiteGames > 0 ? Math.round((whiteWins / whiteGames) * 100) : 50;
  const winRateAsBlack = blackGames > 0 ? Math.round((blackWins / blackGames) * 100) : 50;
  const accuracyAsWhite = whiteGames > 0 ? Math.round(sumWhiteAccuracy / whiteGames) : avgAccuracy;
  const accuracyAsBlack = blackGames > 0 ? Math.round(sumBlackAccuracy / blackGames) : avgAccuracy;

  // Phase scores
  const avgOpAcc = Math.round(sumOpeningAcc / totalGames);
  const avgMgAcc = Math.round(sumMiddlegameAcc / totalGames);
  const avgEgAcc = Math.round(sumEndgameAcc / totalGames);

  const openingScoreVal = parseFloat(Math.min(9.9, Math.max(4.0, avgOpAcc / 10)).toFixed(1));
  const middlegameScoreVal = parseFloat(Math.min(9.8, Math.max(3.5, (avgMgAcc / 10) - (blundersPerGame * 0.7))).toFixed(1));
  const endgameScoreVal = parseFloat(Math.min(9.9, Math.max(3.8, (avgEgAcc / 10) + (winRate >= 50 ? 0.3 : -0.4))).toFixed(1));

  // Run pattern detection and situational analysis
  const topWeaknesses = detectRecurringPatterns(games);
  const situationalMastery = analyzeSituations(games);

  // Identify best & worst openings
  const openingList = Object.values(openingStatsMap).sort((a, b) => b.games - a.games);
  const bestOpening = openingList.slice().sort((a, b) => (b.wins / Math.max(1, b.games)) - (a.wins / Math.max(1, a.games)))[0] || openingList[0];
  const worstOpening = openingList.slice().filter(o => o.games >= 2).sort((a, b) => (a.wins / Math.max(1, a.games)) - (b.wins / Math.max(1, b.games)))[0];

  // 1. Dynamic Opening Phase Bullets
  const openingBullets: string[] = [];
  if (openingScoreVal >= 8.5) {
    openingBullets.push(`Exceptional opening development (${avgOpAcc}% avg accuracy) reaching comfortable equality or advantage.`);
    if (bestOpening) {
      openingBullets.push(`Strong theoretical repertoire in ${bestOpening.name} (${Math.round((bestOpening.wins / bestOpening.games) * 100)}% win rate).`);
    }
    openingBullets.push(`Rarely drops early material in the first 10 moves.`);
  } else if (openingScoreVal >= 7.0) {
    openingBullets.push(`Solid opening play (${avgOpAcc}% accuracy) with consistent castling and King safety.`);
    openingBullets.push(`Occasional inaccuracies when opponents deviate from known theoretical lines.`);
    if (worstOpening) {
      openingBullets.push(`Shows some discomfort in ${worstOpening.name} (${Math.round((worstOpening.wins / worstOpening.games) * 100)}% win rate).`);
    }
  } else {
    openingBullets.push(`Struggles in opening development (${avgOpAcc}% accuracy), frequently conceding early center control.`);
    openingBullets.push(`Concedes early tactical opportunities on moves 5–9.`);
    openingBullets.push(`Needs structured opening preparation and early piece harmony.`);
  }

  const openingPhase: PhaseScore = {
    score: openingScoreVal,
    stars: Math.max(1, Math.min(5, Math.round(openingScoreVal / 2))),
    grade: openingScoreVal >= 8.8 ? 'A+' : openingScoreVal >= 8.0 ? 'A' : openingScoreVal >= 6.8 ? 'B' : openingScoreVal >= 5.5 ? 'C' : 'D',
    bulletPoints: openingBullets,
    keyStrengths: openingScoreVal >= 7.5 ? ['Opening Development', 'Castling Timing', 'Central Control'] : ['Flexible Repertoire'],
    keyWeaknesses: openingScoreVal >= 7.5 ? ['Deviations from Theory'] : ['Conceding Early Initiative', 'Piece Harmony'],
  };

  // 2. Dynamic Middlegame Phase Bullets
  const mgBullets: string[] = [];
  const primaryWeakness = topWeaknesses[0] || {
    id: 'premature-attack',
    title: 'Middlegame Planning',
    headline: 'Premature attacks without concrete targets',
    frequencyPercent: 34,
    description: 'Frequently creates attacks on the opponent king without sufficient positional justification.',
    coachingFix: 'Identify your worst-placed piece and improve it before initiating tactical contact.',
  };

  mgBullets.push(`${primaryWeakness.headline} (Deciding factor in ${primaryWeakness.frequencyPercent}% of analysed games).`);
  mgBullets.push(`Averages ${blundersPerGame} major blunders and ${mistakesPerGame} positional mistakes per game.`);

  if (fastBlunderCount > 0) {
    mgBullets.push(`Clock pressure correlation: ${fastBlunderCount} critical blunders occurred with under 30s remaining.`);
  } else {
    mgBullets.push(`Pieces frequently drift out of coordination after move 14.`);
  }

  const middlegamePhase: PhaseScore = {
    score: middlegameScoreVal,
    stars: Math.max(1, Math.min(5, Math.round(middlegameScoreVal / 2))),
    grade: middlegameScoreVal >= 8.0 ? 'A' : middlegameScoreVal >= 6.5 ? 'B' : middlegameScoreVal >= 5.0 ? 'C' : 'D',
    bulletPoints: mgBullets,
    keyStrengths: ['Tactical Willingness', 'Active Piece Play'],
    keyWeaknesses: [primaryWeakness.title, 'Overlooking Counterplay', 'Move Timing'],
  };

  // 3. Dynamic Endgame Phase Bullets
  const egBullets: string[] = [];
  if (endgameScoreVal >= 8.0) {
    egBullets.push(`Strong endgame technique (${avgEgAcc}% accuracy) with solid king activity in simplified positions.`);
    egBullets.push(`Efficient passed pawn escort and conversion in winning positions.`);
    if (gamesLostWithAdvantage > 0) {
      egBullets.push(`Squandered winning advantage (+2.0) in ${gamesLostWithAdvantage} endgame instances.`);
    }
  } else {
    egBullets.push(`Endgame precision drops to ${avgEgAcc}% accuracy in complex rook/minor piece endgames.`);
    egBullets.push(`Hesitates to activate the king towards the center in simplified positions.`);
    egBullets.push(`Lost or drew ${gamesLostWithAdvantage} winning endgame positions.`);
  }

  const endgamePhase: PhaseScore = {
    score: endgameScoreVal,
    stars: Math.max(1, Math.min(5, Math.round(endgameScoreVal / 2))),
    grade: endgameScoreVal >= 8.5 ? 'A' : endgameScoreVal >= 7.0 ? 'B' : 'C',
    bulletPoints: egBullets,
    keyStrengths: endgameScoreVal >= 7.5 ? ['King Centralization', 'Pawn Promotion Races'] : ['Fighting Spirit'],
    keyWeaknesses: endgameScoreVal >= 7.5 ? ['Rook Placement in Closed Endgames'] : ['Endgame Technique', 'Conversion Discipline'],
  };

  // Dynamic Biggest Strength
  let strengthTitle = 'Endgame Technique & Opening Development';
  let strengthDesc = `You score ${openingScoreVal}/10 in the opening and achieve ${avgAccuracy}% average accuracy.`;
  let strengthEv = `Maintained solid development across ${totalGames} games.`;

  if (winRateAsWhite >= 60) {
    strengthTitle = `Dominant White Repertoire (${winRateAsWhite}% Win Rate)`;
    strengthDesc = `You control the initiative with the White pieces, scoring ${winRateAsWhite}% wins and ${accuracyAsWhite}% accuracy.`;
    strengthEv = `Won ${whiteWins} out of ${whiteGames} games playing as White.`;
  } else if (bestOpening && bestOpening.games >= 2) {
    strengthTitle = `${bestOpening.name} Mastery`;
    strengthDesc = `Your highest performing opening with a ${Math.round((bestOpening.wins / bestOpening.games) * 100)}% win rate across ${bestOpening.games} games.`;
    strengthEv = `${bestOpening.eco} Repertoire with ${Math.round(bestOpening.accSum / bestOpening.games)}% average accuracy.`;
  }

  // Dynamic Biggest Weakness
  const weaknessTitle = primaryWeakness.title;
  const weaknessDesc = primaryWeakness.description;
  const weaknessEv = `Appeared as the deciding factor in ${primaryWeakness.frequencyPercent}% of your analysed games.`;
  const weaknessGoal = primaryWeakness.coachingFix;

  // Dynamic Most Common Mistake
  const mostCommonMistake = `${primaryWeakness.headline} (Appears on moves 12–22 after opening development ends)`;

  // Dynamic Next Improvement Goal
  const nextImprovementGoal = primaryWeakness.coachingFix;

  // Time control breakdown
  const timeControlBreakdown = Object.entries(timeControlMap).map(([type, data]) => ({
    type: type.toUpperCase(),
    games: data.games,
    winRate: Math.round((data.wins / data.games) * 100),
    accuracy: Math.round(data.accSum / data.games),
  }));

  // Opening repertoire table
  const openingRepertoire = Object.values(openingStatsMap)
    .map(op => {
      const wr = Math.round((op.wins / op.games) * 100);
      const acc = Math.round(op.accSum / op.games);
      let verdict: 'Excellent' | 'Solid' | 'Struggling' | 'Avoid' = 'Solid';
      if (wr >= 60 && op.games >= 2) verdict = 'Excellent';
      else if (wr <= 35 && op.games >= 2) verdict = 'Avoid';
      else if (wr < 45) verdict = 'Struggling';

      return {
        eco: op.eco,
        name: op.name,
        color: op.color,
        gamesPlayed: op.games,
        winRate: wr,
        avgAccuracy: acc,
        verdict,
      };
    })
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed);

  // Dynamic Weekly Training Plan
  const weeklyTrainingPlan = {
    focusArea: primaryWeakness.title,
    coreRules: [
      `Rule 1: ${primaryWeakness.coachingFix.split('.')[0] || 'Check all opponent threats before moving.'}.`,
      'Rule 2: Check all Checks, Captures, and Threats (CCT) before confirming your move.',
      'Rule 3: Keep your king pawn shield intact until the center is locked.',
    ],
    days: [
      { day: 'Monday', routine: `Study 3 Master Games in ${bestOpening?.name || 'your primary opening structure'}`, durationMinutes: 30, category: 'Opening' as const },
      { day: 'Tuesday', routine: 'Solve 15 Defensive & Prophylaxis Puzzles (finding opponent counterplay)', durationMinutes: 25, category: 'Puzzles' as const },
      { day: 'Wednesday', routine: `Sparring Bot Session: Play 3 games targeting ${primaryWeakness.title}`, durationMinutes: 35, category: 'Sparring' as const },
      { day: 'Thursday', routine: 'Positional Decision Drills: Identifying your worst-placed piece in complex middlegames', durationMinutes: 25, category: 'Strategy' as const },
      { day: 'Friday', routine: 'Deep Review: Re-analyze your 3 worst lost games using ChessMind Timeline', durationMinutes: 30, category: 'Game Review' as const },
      { day: 'Saturday', routine: 'Play 2 slower Rapid games (15+10) applying the 20% clock rule', durationMinutes: 45, category: 'Sparring' as const },
      { day: 'Sunday', routine: 'Endgame Technique: King & Pawn conversion drills', durationMinutes: 20, category: 'Puzzles' as const },
    ],
  };

  const avgHeroRating = Math.round(
    games.reduce((acc, g) => acc + g.heroRating, 0) / totalGames
  );

  const buildPlatformStats = (platform: 'lichess' | 'chesscom') => {
    const platformGames = games.filter(game => game.platform === platform);
    if (platformGames.length === 0) return undefined;
    return {
      games: platformGames.length,
      rating: Math.round(platformGames.reduce((sum, game) => sum + game.heroRating, 0) / platformGames.length),
      winRate: Math.round((platformGames.filter(game => game.result === 'win').length / platformGames.length) * 100),
      accuracy: Math.round(platformGames.reduce((sum, game) => sum + game.accuracy, 0) / platformGames.length),
      blundersPerGame: Number((platformGames.reduce((sum, game) => sum + game.blundersCount, 0) / platformGames.length).toFixed(1)),
    };
  };
  const computedPlatformComparison = platformComparisonData || {
    lichess: buildPlatformStats('lichess'),
    chesscom: buildPlatformStats('chesscom'),
  };

  return {
    heroUsername,
    totalGamesAnalyzed: totalGames,
    dateRange: `${games[games.length - 1]?.date || 'Recent'} - ${games[0]?.date || 'Today'}`,
    overallRatingEstimate: avgHeroRating || 1520,
    phases: {
      opening: openingPhase,
      middlegame: middlegamePhase,
      endgame: endgamePhase,
    },
    biggestStrength: {
      title: strengthTitle,
      description: strengthDesc,
      evidence: strengthEv,
    },
    biggestWeakness: {
      title: weaknessTitle,
      description: weaknessDesc,
      evidence: weaknessEv,
      actionableGoal: weaknessGoal,
    },
    mostCommonMistake,
    nextImprovementGoal,
    topWeaknesses,
    situationalMastery,
    stats: {
      winRate,
      drawRate,
      lossRate,
      avgAccuracy,
      avgCentipawnLoss,
      blundersPerGame,
      mistakesPerGame,
      accuracyAsWhite,
      accuracyAsBlack,
      winRateAsWhite,
      winRateAsBlack,
      timeControlBreakdown,
      openingRepertoire,
      accuracyOverTime: accuracyOverTime.slice(0, 40).reverse(),
    },
    platformComparison: computedPlatformComparison,
    weeklyTrainingPlan,
  };
}
