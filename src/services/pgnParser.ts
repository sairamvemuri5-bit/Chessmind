import { Chess, Move } from 'chess.js';
import { ParsedGame, MoveAnalysis, Platform, GameResult } from '../types/chess';
import { detectOpening } from '../data/openingsData';
import { evaluatePositionStatic, classifyMove, generateHumanExplanation, getGamePhase, analyzeGameTransition } from './engineEvaluator';

export function parsePgnGame(
  pgnText: string,
  heroUsernameTarget?: string,
  platform: Platform = 'lichess',
  gameIdFallback?: string
): ParsedGame | null {
  try {
    // Parse headers
    const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
    const headers: Record<string, string> = {};
    let match;
    while ((match = headerRegex.exec(pgnText)) !== null) {
      headers[match[1]] = match[2];
    }

    const whiteName = headers['White'] || 'White Player';
    const blackName = headers['Black'] || 'Black Player';
    const whiteElo = parseInt(headers['WhiteElo'] || '1500', 10) || 1500;
    const blackElo = parseInt(headers['BlackElo'] || '1500', 10) || 1500;
    const date = headers['Date'] || headers['UTCDate'] || new Date().toISOString().split('T')[0];
    const timeControl = headers['TimeControl'] || '300+0';
    const rawResult = headers['Result'] || '*';
    const ecoHeader = headers['ECO'] || '';
    const openingHeader = headers['Opening'] || '';
    const termination = headers['Termination'] || '';

    // Determine target hero player
    let heroColor: 'w' | 'b' = 'w';
    if (heroUsernameTarget) {
      const lowerTarget = heroUsernameTarget.toLowerCase();
      if (blackName.toLowerCase().includes(lowerTarget)) {
        heroColor = 'b';
      } else {
        heroColor = 'w';
      }
    }

    let result: GameResult = 'draw';
    if (rawResult === '1-0') {
      result = heroColor === 'w' ? 'win' : 'loss';
    } else if (rawResult === '0-1') {
      result = heroColor === 'b' ? 'win' : 'loss';
    }

    const heroRating = heroColor === 'w' ? whiteElo : blackElo;
    const opponentRating = heroColor === 'w' ? blackElo : whiteElo;
    const opponentUsername = heroColor === 'w' ? blackName : whiteName;

    // Time category
    let timeCategory: 'bullet' | 'blitz' | 'rapid' | 'classical' = 'blitz';
    const firstNum = parseInt(timeControl.split('+')[0], 10);
    if (!isNaN(firstNum)) {
      if (firstNum < 180) timeCategory = 'bullet';
      else if (firstNum < 600) timeCategory = 'blitz';
      else if (firstNum < 1800) timeCategory = 'rapid';
      else timeCategory = 'classical';
    }

    // Extract eval and clock comments
    const evalMap: Record<number, number> = {};
    const clkMap: Record<number, number> = {};

    let plyCount = 0;
    const pgnClean = pgnText.replace(/\[.*?\]\n?/g, '').trim();
    const tokens = pgnClean.split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.includes('[%eval')) {
        const evalMatch = token.match(/\[%eval\s+([-\d.]+)/);
        if (evalMatch) {
          const evalNum = parseFloat(evalMatch[1]);
          evalMap[plyCount] = Math.round(evalNum * 100);
        }
      }
      if (token.includes('[%clk')) {
        const clkMatch = token.match(/\[%clk\s+([\d:]+)/);
        if (clkMatch) {
          const parts = clkMatch[1].split(':');
          const secs = parts.length === 3
            ? parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
            : parseInt(parts[0]) * 60 + parseInt(parts[1]);
          clkMap[plyCount] = secs;
        }
      }
      if (!token.startsWith('{') && !token.endsWith('}') && !token.match(/^\d+\./) && !['1-0', '0-1', '1/2-1/2', '*'].includes(token)) {
        plyCount++;
      }
    }

    // Clean move string for chess.js (strip comments, annotations, NAGs)
    const sanitizedMovesOnly = pgnClean
      .replace(/\{[^}]*\}/g, '')
      .replace(/\$\d+/g, '')
      .replace(/1-0|0-1|1\/2-1\/2|\*/g, '')
      .trim();

    // Replay moves sequentially with robust step-by-step move validation
    const replayChess = new Chess();
    const movesTokens = sanitizedMovesOnly.split(/\s+/).filter(t => !t.match(/^\d+\./) && t.length > 0);
    const movesAnalysis: MoveAnalysis[] = [];

    let runningEval = 20;
    let heroBlunders = 0;
    let heroMistakes = 0;
    let heroInaccuracies = 0;
    let heroCentipawnLossSum = 0;
    let heroMoveCount = 0;

    let openingMovesHero = 0;
    let openingCpLossHero = 0;
    let middlegameMovesHero = 0;
    let middlegameCpLossHero = 0;
    let endgameMovesHero = 0;
    let endgameCpLossHero = 0;

    for (let ply = 0; ply < movesTokens.length; ply++) {
      const rawSan = movesTokens[ply].replace(/[?!+#]/g, '');
      const color = replayChess.turn();
      const isHeroMove = color === heroColor;
      const moveNumber = Math.floor(ply / 2) + 1;
      const fenBefore = replayChess.fen();
      const phase = getGamePhase(ply, fenBefore);

      let moveResult: Move | null = null;
      try {
        moveResult = replayChess.move(movesTokens[ply]);
      } catch {
        try {
          moveResult = replayChess.move(rawSan);
        } catch {
          // If a move token fails, break parsing cleanly at that ply
          break;
        }
      }

      if (!moveResult) break;

      const evalBefore = evalMap[ply] !== undefined ? evalMap[ply] : runningEval;
      const fenAfter = replayChess.fen();

      let evalAfter = evalMap[ply + 1] !== undefined ? evalMap[ply + 1] : evaluatePositionStatic(replayChess);
      runningEval = evalAfter;

      const { classification, evalDiff } = classifyMove(evalBefore, evalAfter, color, replayChess.isCheckmate(), ply + 1);

      let finalClassification = classification;
      if (Math.abs(evalBefore) <= 100 && Math.abs(evalAfter) >= 280 && isHeroMove && classification === 'blunder') {
        finalClassification = 'critical';
      }

      const explanation = generateHumanExplanation(
        moveResult.san,
        finalClassification,
        color,
        evalBefore,
        evalAfter,
        replayChess
      );

      if (isHeroMove) {
        heroMoveCount++;
        heroCentipawnLossSum += Math.max(0, evalDiff);
        if (finalClassification === 'blunder' || finalClassification === 'critical') heroBlunders++;
        else if (finalClassification === 'mistake') heroMistakes++;
        else if (finalClassification === 'inaccuracy') heroInaccuracies++;

        if (phase === 'opening') {
          openingMovesHero++;
          openingCpLossHero += Math.max(0, evalDiff);
        } else if (phase === 'middlegame') {
          middlegameMovesHero++;
          middlegameCpLossHero += Math.max(0, evalDiff);
        } else {
          endgameMovesHero++;
          endgameCpLossHero += Math.max(0, evalDiff);
        }
      }

      movesAnalysis.push({
        moveNumber,
        ply: ply + 1,
        san: moveResult.san,
        uci: `${moveResult.from}${moveResult.to}${moveResult.promotion || ''}`,
        fenBefore,
        fenAfter,
        color,
        evalBefore,
        evalAfter,
        evalDiff,
        classification: finalClassification,
        humanExplanation: explanation,
        clockRemaining: clkMap[ply + 1],
        isHeroMove,
        phase,
      });
    }

    if (movesAnalysis.length === 0) return null;

    const avgHeroCpLoss = heroMoveCount > 0 ? Math.round(heroCentipawnLossSum / heroMoveCount) : 30;
    const accuracy = Math.max(45, Math.min(99, Math.round(100 / (1 + Math.pow(avgHeroCpLoss / 45, 1.4)))));
    const opponentAccuracy = Math.max(42, Math.min(98, Math.round(100 / (1 + Math.pow((avgHeroCpLoss + 8) / 45, 1.4)))));

    const openingAccuracy = openingMovesHero > 0
      ? Math.max(55, Math.min(99, Math.round(100 / (1 + Math.pow((openingCpLossHero / openingMovesHero) / 40, 1.3)))))
      : 88;
    const middlegameAccuracy = middlegameMovesHero > 0
      ? Math.max(40, Math.min(98, Math.round(100 / (1 + Math.pow((middlegameCpLossHero / middlegameMovesHero) / 45, 1.4)))))
      : 74;
    const endgameAccuracy = endgameMovesHero > 0
      ? Math.max(45, Math.min(99, Math.round(100 / (1 + Math.pow((endgameCpLossHero / endgameMovesHero) / 40, 1.3)))))
      : 82;

    const openingInfo = detectOpening(ecoHeader, openingHeader);
    const transition = analyzeGameTransition(movesAnalysis, heroColor);

    return {
      id: gameIdFallback || headers['Site']?.split('/').pop() || `game_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      platform,
      url: headers['Site'] || undefined,
      white: { username: whiteName, rating: whiteElo },
      black: { username: blackName, rating: blackElo },
      heroColor,
      heroRating,
      opponentUsername,
      opponentRating,
      result,
      termination,
      date,
      timeControl,
      timeCategory,
      eco: openingInfo.eco,
      openingName: openingInfo.name,
      pgn: pgnText,
      moves: movesAnalysis,
      accuracy,
      opponentAccuracy,
      avgCentipawnLoss: avgHeroCpLoss,
      blundersCount: heroBlunders,
      mistakesCount: heroMistakes,
      inaccuraciesCount: heroInaccuracies,
      criticalMomentsCount: movesAnalysis.filter(m => m.isHeroMove && m.classification === 'critical').length,
      transition,
      phasePerformance: {
        openingAccuracy,
        middlegameAccuracy,
        endgameAccuracy,
      },
    };
  } catch (err) {
    console.error('Error parsing PGN game:', err);
    return null;
  }
}
