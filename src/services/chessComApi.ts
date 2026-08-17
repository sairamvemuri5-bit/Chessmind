import { ParsedGame } from '../types/chess';
import { parsePgnGame } from './pgnParser';

interface ChessComArchiveResponse {
  archives: string[];
}

interface ChessComGamesResponse {
  games: {
    url: string;
    pgn?: string;
    time_control: string;
    end_time: number;
    rated: boolean;
    white: { username: string; rating: number; result: string };
    black: { username: string; rating: number; result: string };
  }[];
}

export async function fetchChessComGames(
  username: string,
  maxGames: number = 25,
  onProgress?: (progressText: string) => void
): Promise<ParsedGame[]> {
  onProgress?.(`Contacting Chess.com API for player @${username}...`);

  const archivesUrl = `https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}/games/archives`;
  
  const archivesRes = await fetch(archivesUrl);
  if (!archivesRes.ok) {
    if (archivesRes.status === 404) {
      throw new Error(`Chess.com player "${username}" was not found.`);
    }
    throw new Error(`Chess.com API returned status ${archivesRes.status}: ${archivesRes.statusText}`);
  }

  const archivesData: ChessComArchiveResponse = await archivesRes.json();
  if (!archivesData.archives || archivesData.archives.length === 0) {
    return [];
  }

  // maxGames of 0 means every available public archive, not an arbitrary cap.
  const loadAllGames = maxGames === 0;
  const archiveLimit = loadAllGames ? archivesData.archives.length : (maxGames >= 100 ? 24 : 4);
  const recentArchives = archivesData.archives.slice(-archiveLimit).reverse();
  const collectedPgns: string[] = [];

  for (const archiveUrl of recentArchives) {
    if (!loadAllGames && collectedPgns.length >= maxGames) break;
    const monthLabel = archiveUrl.split('/').slice(-2).join('/');
    onProgress?.(`Fetching games from ${monthLabel} (${collectedPgns.length} games gathered)...`);
    
    try {
      const monthRes = await fetch(archiveUrl);
      if (!monthRes.ok) continue;
      const monthData: ChessComGamesResponse = await monthRes.json();

      if (monthData.games && monthData.games.length > 0) {
        const reversedGames = [...monthData.games].reverse();
        for (const g of reversedGames) {
          if (g.pgn) {
            collectedPgns.push(g.pgn);
            if (!loadAllGames && collectedPgns.length >= maxGames) break;
          }
        }
      }
    } catch {
      // Continue to next archive
    }
  }

  onProgress?.(`Analyzing ${collectedPgns.length} games from Chess.com...`);

  const games: ParsedGame[] = [];
  for (let i = 0; i < collectedPgns.length; i++) {
    const pgn = collectedPgns[i];
    const parsed = parsePgnGame(pgn, username, 'chesscom');
    if (parsed) {
      games.push(parsed);
    }
  }

  return games;
}
