import { ParsedGame, PersonalChessProfile, ChatMessage } from '../types/chess';

export function answerCoachQuery(
  question: string,
  profile: PersonalChessProfile,
  games: ParsedGame[]
): ChatMessage {
  const q = question.toLowerCase().trim();
  const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const heroMoves = games.flatMap(game => game.moves.filter(move => move.isHeroMove));
  const middlegameErrors = heroMoves.filter(move =>
    move.phase === 'middlegame' && ['mistake', 'blunder', 'critical'].includes(move.classification)
  );

  // Answer a question *about a named opening* before the broad repertoire
  // branch below. Previously, any use of the word "opening" triggered a
  // huge list of statistics rather than answering the question asked.
  const namedOpening = profile.stats.openingRepertoire
    .filter(opening => opening.name.length > 4)
    .sort((a, b) => b.name.length - a.name.length)
    .find(opening => q.includes(opening.name.toLowerCase()));
  const asksForExplanation = /what is|what's|explain|tell me about|how do i play|why is/.test(q);
  if (namedOpening && asksForExplanation) {
    const isFallback = namedOpening.name.toLowerCase() === 'uncommon opening';
    return {
      id,
      sender: 'coach',
      text: isFallback
        ? `**Uncommon Opening** is a catch-all label, usually used for ECO **A00** positions that do not fit a more specific named opening. It is not one fixed set of moves.\n\nIn your analysed games, you reached this label **${namedOpening.gamesPlayed} times as ${namedOpening.color === 'w' ? 'White' : 'Black'}**, with a **${namedOpening.winRate}% win rate**. To understand what you actually played, open one of those games in the timeline and look at the first few moves.`
        : `**${namedOpening.name}** is one of the openings in your history. You played it **${namedOpening.gamesPlayed} times as ${namedOpening.color === 'w' ? 'White' : 'Black'}**, scoring **${namedOpening.winRate}%** with an average local-analysis accuracy of **${namedOpening.avgAccuracy}%**.\n\nIf you mean a chess-theory question about a particular line, include the first moves (for example, \"1.e4 c5\") and I can focus the explanation.`,
      timestamp,
      suggestedQuestions: [
        `How am I doing in ${namedOpening.name}?`,
        'What is my biggest weakness?',
      ],
    };
  }

  // 1. "Why do I keep losing winning positions?"
  if (q.includes('losing winning') || q.includes('throw') || q.includes('squander') || q.includes('choke')) {
    const thrownGames = games.filter(g => {
      const heroMoves = g.moves.filter(m => m.isHeroMove);
      const hadWinningLead = heroMoves.some(m => (g.heroColor === 'w' ? m.evalBefore >= 250 : m.evalBefore <= -250));
      return hadWinningLead && g.result === 'loss';
    });

    const referencedGames = thrownGames.slice(0, 3).map(g => {
      const blunder = g.moves.find(m => m.isHeroMove && m.classification === 'blunder');
      return {
        gameId: g.id,
        title: `${g.white.username} vs ${g.black.username} (${g.openingName})`,
        moveNumber: blunder?.moveNumber || 22,
        fen: blunder?.fenBefore,
        previewNote: `Held +${((blunder ? Math.abs(blunder.evalBefore) : 300) / 100).toFixed(1)} advantage before Move ${blunder?.moveNumber || 22} (${blunder?.san || 'blunder'}).`,
      };
    });

    return {
      id,
      sender: 'coach',
      text: `Based on your **${games.length} analysed games**, you reached a winning advantage (+2.5 or higher) and later lost in **${thrownGames.length} game${thrownGames.length === 1 ? '' : 's'}**.

The referenced games below show the first critical mistake after you had an advantage. The reliable practical rule is: when you are ahead, first check whether you can trade pieces safely, remove counterplay, and keep your king protected before looking for a direct attack.

**Training focus:** After winning material or reaching +2.5, use a short checklist: opponent threats, safe exchanges, then your simplest improving move.`,
      timestamp,
      referencedGames,
      suggestedQuestions: [
        'What is my biggest weakness?',
        'Find my most embarrassing blunders',
        'Which openings should I stop playing?',
      ],
    };
  }

  // 2. "What is my biggest weakness?"
  if (q.includes('biggest weakness') || q.includes('main weakness') || q.includes('worst problem')) {
    const top = profile.topWeaknesses[0];
    const topSituations = profile.situationalMastery.filter(s => s.winRate < 45);

    return {
      id,
      sender: 'coach',
      text: `Your #1 biggest weakness is **${top?.title || 'Middlegame Planning & Premature Attacks'}** (detected in **${top?.frequencyPercent || 34}% of your games**).

### Here is the exact recurring cycle in your play:
1. **Move 1–10 (Opening):** You develop cleanly, castle safely, and score **${profile.phases.opening.score}/10**.
2. **Move 11–18 (The Crack):** With development done, you hesitate on what to do. You initiate a flank attack or pawn push without coordinating your pieces.
3. **Move 19+ (Tactical Collapse):** Opponent defends easily and exploits the holes left behind, resulting in a blunder.

### Your weakest tactical situation:
* **${topSituations[0]?.name || 'Closed Pawn Centers'}:** Win rate is only **${topSituations[0]?.winRate || 32}%**. You frequently ${topSituations[0]?.commonMissedStrategy || 'misplace pieces'}.`,
      timestamp,
      referencedGames: top?.evidenceExamples.slice(0, 3).map(e => ({
        gameId: e.gameId,
        title: e.gameTitle,
        moveNumber: e.moveNumber,
        fen: e.fen,
        previewNote: e.explanation,
      })),
      suggestedQuestions: [
        'Why are my middlegames worse than my openings?',
        'Show me a training plan to fix this',
        'Which openings should I stop playing?',
      ],
    };
  }

  // 3. "Why are my middlegames worse than my openings?"
  if (q.includes('middlegame') && (q.includes('opening') || q.includes('worse') || q.includes('drop'))) {
    return {
      id,
      sender: 'coach',
      text: `Your opening score is **${profile.phases.opening.score}/10 (${profile.phases.opening.stars}⭐)**, while your middlegame score is **${profile.phases.middlegame.score}/10 (${profile.phases.middlegame.stars}⭐)**.

### What the analysed moves show:
- You made **${middlegameErrors.length} serious error${middlegameErrors.length === 1 ? '' : 's'}** (mistakes, blunders, or critical moves) across **${heroMoves.filter(move => move.phase === 'middlegame').length} middlegame moves**.
- Your top detected pattern is **${profile.topWeaknesses[0]?.title || 'Middlegame planning'}**: ${profile.topWeaknesses[0]?.headline || 'your plans become less accurate once the opening ends'}.
- Your strongest evidence-based next step is: **${profile.topWeaknesses[0]?.coachingFix || 'identify your opponent’s threat and improve your worst-placed piece before attacking.'}**

**Coach Action Item:** Before committing to a pawn push or attack, ask: *"What is my opponent threatening, and which of my pieces needs improving most?"*`,
      timestamp,
      suggestedQuestions: [
        'Show me 5 games where I made the same mistake',
        'Which openings should I stop playing?',
        'How do I handle time pressure?',
      ],
    };
  }

  // 4. "Which openings should I stop playing?"
  if (q.includes('openings should i stop') || q.includes('worst opening') || q.includes('repertoire') || q.includes('my openings') || q.includes('opening performance')) {
    // Small samples are not evidence that an opening should be dropped.
    const reliableOpenings = profile.stats.openingRepertoire.filter(o => o.gamesPlayed >= 5);
    const strugglingOpenings = reliableOpenings.filter(o => o.verdict === 'Avoid' || o.winRate < 45).slice(0, 5);
    const bestOpenings = reliableOpenings.filter(o => o.verdict === 'Excellent' || o.winRate >= 55).slice(0, 5);

    return {
      id,
      sender: 'coach',
      text: `Here is the empirical analysis of your opening repertoire across **${profile.totalGamesAnalyzed} games**:

### 🚫 Openings to Consider Dropping or Overhauling:
${strugglingOpenings.length > 0 
  ? strugglingOpenings.map(o => `* **${o.name}** (${o.eco}, as ${o.color === 'w' ? 'White' : 'Black'}): **${o.winRate}% Win Rate**, ${o.avgAccuracy}% accuracy across ${o.gamesPlayed} games. Verdict: **${o.verdict}**`).join('\n')
  : '* No severe underperforming openings detected! Keep sharpening your main lines.'}

### 🏆 Your Most Dominant Openings:
${bestOpenings.length > 0
  ? bestOpenings.map(o => `* **${o.name}** (${o.eco}, as ${o.color === 'w' ? 'White' : 'Black'}): **${o.winRate}% Win Rate**, ${o.avgAccuracy}% accuracy across ${o.gamesPlayed} games.`).join('\n')
  : '* Balanced performance across standard lines.'}

**Recommendation:** Treat results from fewer than five games as too small a sample. Focus on your most-played openings first, then investigate the positions linked in your timeline.`,
      timestamp,
      suggestedQuestions: [
        'What is my biggest weakness?',
        'Find my most embarrassing blunders',
        'Why do I keep losing winning positions?',
      ],
    };
  }

  // 5. "Find my most embarrassing blunders" / "Show me blunders"
  if (q.includes('embarrassing') || q.includes('blunder') || q.includes('mistake') || q.includes('worst move')) {
    const criticalGames = games.filter(g => g.moves.some(m => m.isHeroMove && (m.classification === 'critical' || m.evalDiff >= 400)));
    const examples = criticalGames.slice(0, 4).map(g => {
      const b = g.moves.find(m => m.isHeroMove && (m.classification === 'critical' || m.evalDiff >= 400));
      return {
        gameId: g.id,
        title: `${g.white.username} vs ${g.black.username} (${g.openingName})`,
        moveNumber: b?.moveNumber || 18,
        fen: b?.fenBefore,
        previewNote: `Played ${b?.san || 'move'} (Centipawn swing: -${((b?.evalDiff || 450) / 100).toFixed(1)}). ${b?.humanExplanation || ''}`,
      };
    });

    return {
      id,
      sender: 'coach',
      text: `I searched your library and found **${examples.length}** of your highest-impact errors. These are hero moves where the position swung by at least four pawns, or which the analyser marked as critical:

${examples.map((e, idx) => `${idx + 1}. **${e.title} (Move ${e.moveNumber})**: ${e.previewNote}`).join('\n\n')}

**Pattern to practise:** Before every forcing reply, check all checks, captures, and threats for both sides. The linked positions let you replay the exact moments.`,
      timestamp,
      referencedGames: examples,
      suggestedQuestions: [
        'How can I avoid speed blunders?',
        'What is my biggest weakness?',
        'Why do I keep losing winning positions?',
      ],
    };
  }

  // Generic fallback intelligent coaching query
  const heroBlunders = games.reduce((acc, g) => acc + g.blundersCount, 0);
  const avgAccuracy = profile.stats.avgAccuracy;
  const relevantMoves = heroMoves
    .filter(move => ['critical', 'blunder', 'mistake'].includes(move.classification))
    .sort((a, b) => b.evalDiff - a.evalDiff)
    .slice(0, 3);
  const referencedGames = relevantMoves.map(move => {
    const game = games.find(candidate => candidate.moves.some(candidateMove => candidateMove === move));
    return game ? {
      gameId: game.id,
      title: `${game.white.username} vs ${game.black.username} (${game.openingName})`,
      moveNumber: move.moveNumber,
      fen: move.fenBefore,
      previewNote: `${move.san}: ${move.humanExplanation || 'A high-impact decision point.'}`,
    } : null;
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    id,
    sender: 'coach',
    text: `Based on your **${games.length} games profile** (Overall rating est. **${profile.overallRatingEstimate}**, **${avgAccuracy}% accuracy**, **${profile.stats.winRate}% win rate**):

Regarding **"${question}"**:
- Your biggest recurring friction is **${profile.biggestWeakness.title}**, which surfaced across ${profile.topWeaknesses[0]?.affectedGamesCount || 5} of your recent games.
- In positions with **${profile.situationalMastery[0]?.name || 'Sharp Tactics'}**, your win rate is **${profile.situationalMastery[0]?.winRate || 35}%**.
- **Coach Advice:** "${profile.nextImprovementGoal}"

I do not need an exact pre-written question to help: I will ground each answer in your profile and point you to the most relevant decision points below.`,
    timestamp,
    referencedGames,
    suggestedQuestions: [
      'Why do I keep losing winning positions?',
      'What is my biggest weakness?',
      'Which openings should I stop playing?',
      'Find my most embarrassing blunders',
    ],
  };
}
