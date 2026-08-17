import { ParsedGame } from '../types/chess';
import { parsePgnGame } from './pgnParser';

export async function fetchLichessGames(
  username: string,
  maxGames: number = 25,
  onProgress?: (progressText: string) => void
): Promise<ParsedGame[]> {
  onProgress?.(`Contacting Lichess API for player @${username}...`);

  const limit = maxGames > 0 ? `max=${maxGames}&` : '';
  const url = `https://lichess.org/api/games/user/${encodeURIComponent(
    username
  )}?${limit}evals=true&clocks=true&opening=true&pgnInJson=false`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/x-chess-pgn',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Lichess user "${username}" was not found.`);
    }
    throw new Error(`Lichess API returned status ${response.status}: ${response.statusText}`);
  }

  const pgnData = await response.text();
  if (!pgnData || pgnData.trim().length === 0) {
    return [];
  }

  // Split multi-game PGN string into individual games
  const pgnBlocks = pgnData
    .split(/\n\n(?=\[Event )/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  onProgress?.(`Found ${pgnBlocks.length} game${pgnBlocks.length === 1 ? '' : 's'}. Parsing and analyzing...`);

  const games: ParsedGame[] = [];
  for (let i = 0; i < pgnBlocks.length; i++) {
    if (i > 0 && i % 25 === 0) {
      onProgress?.(`Analyzed ${i} of ${pgnBlocks.length} games...`);
    }
    const block = pgnBlocks[i];
    const parsed = parsePgnGame(block, username, 'lichess');
    if (parsed) {
      games.push(parsed);
    }
  }

  return games;
}
