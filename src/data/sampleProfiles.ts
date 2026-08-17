import { ParsedGame, PersonalChessProfile } from '../types/chess';
import { parsePgnGame } from '../services/pgnParser';
import { generatePersonalProfile } from '../services/profileGenerator';

const SAMPLE_PGNS_ALEX: string[] = [
  // Game 1: Italian Game - Premature attack blunder on move 18
  `[Event "Rated Blitz game"]
[Site "https://lichess.org/sampleGame01"]
[Date "2026.08.10"]
[White "Alex_Tactics"]
[WhiteElo "1545"]
[Black "GrandmasterHopeful"]
[BlackElo "1530"]
[Result "0-1"]
[ECO "C50"]
[Opening "Italian Game: Giuoco Piano"]
[TimeControl "300+0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 Nf6 5. O-O d6 6. c3 a6 7. Bb3 Ba7 8. Nbd2 O-O 9. Re1 h6 10. Nf1 Re8 11. Ng3 Be6 12. Bc2 d5 13. exd5 Bxd5 14. h3 Qd7 15. Nh4 Rad8 16. Nhf5 Be6 17. Qf3 Bd5 18. Nxh6+ gxh6 19. Qxf6 Re6 20. Qh4 Rg6 21. Bxh6 Qe6 22. Bg5 Re8 23. d4 e4 24. Nxe4 0-1`,

  // Game 2: Sicilian Defense - Good opening, thrown in middlegame
  `[Event "Rated Rapid game"]
[Site "https://lichess.org/sampleGame02"]
[Date "2026.08.11"]
[White "EndgameMaster99"]
[WhiteElo "1560"]
[Black "Alex_Tactics"]
[BlackElo "1538"]
[Result "1-0"]
[ECO "B20"]
[Opening "Sicilian Defense"]
[TimeControl "600+0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. O-O-O Nbd7 11. g4 b5 12. g5 b4 13. Ne2 Ne8 14. f4 a5 15. f5 a4 16. Nbd4 exd4 17. Nxd4 b3 18. Kb1 bxc2+ 19. Nxc2 Bb3 20. axb3 axb3 21. Na3 Ne5 22. h4 d5 23. Qxd5 Bxa3 24. Qxd8 Rxd8 25. Rxd8 1-0`,

  // Game 3: French Defense - Closed center, missed pawn break
  `[Event "Rated Blitz game"]
[Site "https://lichess.org/sampleGame03"]
[Date "2026.08.12"]
[White "Alex_Tactics"]
[WhiteElo "1550"]
[Black "TacticalBeast"]
[BlackElo "1525"]
[Result "0-1"]
[ECO "C02"]
[Opening "French Defense: Advance Variation"]
[TimeControl "180+2"]

1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. a3 Nh6 7. b4 cxd4 8. cxd4 Nf5 9. Bb2 Bd7 10. g4 Nfe7 11. Nc3 Na5 12. Na4 Qc6 13. Nc5 Nc4 14. Bc1 b6 15. Nxd7 Qxd7 16. Bd3 a5 17. Rb1 axb4 18. axb4 b5 19. O-O Nc6 20. g5 Be7 21. h4 g6 22. h5 Qa7 23. Kg2 Nxd4 24. Nxd4 Qxd4 0-1`,

  // Game 4: Queen's Gambit Declined - Solid win with endgame conversion
  `[Event "Rated Rapid game"]
[Site "https://lichess.org/sampleGame04"]
[Date "2026.08.13"]
[White "Alex_Tactics"]
[WhiteElo "1540"]
[Black "ChessLover44"]
[BlackElo "1510"]
[Result "1-0"]
[ECO "D30"]
[Opening "Queen's Gambit Declined"]
[TimeControl "600+5"]

1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nc3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7 17. Be2 c4 18. Qxe7 Rxe7 19. Rfd1 Rb7 20. Rd2 Nc6 21. Nd4 Nxd4 22. exd4 Rcb8 23. Rcc2 Bf5 24. Rc3 Rxb2 25. Rxb2 Rxb2 26. Bf1 Rxa2 1-0`,

  // Game 5: Caro-Kann - Winning endgame conversion
  `[Event "Rated Blitz game"]
[Site "https://lichess.org/sampleGame05"]
[Date "2026.08.14"]
[White "PassivePawn"]
[WhiteElo "1495"]
[Black "Alex_Tactics"]
[BlackElo "1542"]
[Result "0-1"]
[ECO "B12"]
[Opening "Caro-Kann Defense"]
[TimeControl "300+0"]

1. e4 c6 2. d4 d5 3. e5 Bf5 4. Nf3 e6 5. Be2 c5 6. Be3 Qb6 7. Nc3 Qxb2 8. Qb1 Qxb1+ 9. Rxb1 b6 10. dxc5 Bxc5 11. Bxc5 bxc5 12. Nb5 Kd7 13. Nd6 Nh6 14. Rb7+ Kc6 15. Bb5# 0-1`,

  // Game 6: London System - Flank attack blunder
  `[Event "Rated Blitz game"]
[Site "https://lichess.org/sampleGame06"]
[Date "2026.08.15"]
[White "Alex_Tactics"]
[WhiteElo "1535"]
[Black "KnightRider"]
[BlackElo "1550"]
[Result "0-1"]
[ECO "D00"]
[Opening "Queen's Pawn Game: London System"]
[TimeControl "300+0"]

1. d4 d5 2. Bf4 Nf6 3. e3 c5 4. c3 Nc6 5. Nd2 Bf5 6. Ngf3 e6 7. Be2 Be7 8. O-O O-O 9. h3 h6 10. Ne5 Rc8 11. g4 Bh7 12. Bg3 Nxe5 13. dxe5 Nd7 14. f4 f6 15. exf6 Bxf6 16. Nf3 Qb6 17. Qd2 c4 18. g5 hxg5 19. fxg5 Be7 20. h4 Nc5 21. Nd4 Ne4 22. Qe1 Rxf1+ 23. Bxf1 Qxb2 0-1`,

  // Game 7: Scandinavian - Solid tactical victory
  `[Event "Rated Rapid game"]
[Site "https://lichess.org/sampleGame07"]
[Date "2026.08.15"]
[White "Alex_Tactics"]
[WhiteElo "1540"]
[Black "OpenCenterPlayer"]
[BlackElo "1520"]
[Result "1-0"]
[ECO "B01"]
[Opening "Scandinavian Defense"]
[TimeControl "600+0"]

1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 Nf6 5. Nf3 c6 6. Bc4 Bf5 7. Bd2 e6 8. Nd5 Qd8 9. Nxf6+ Qxf6 10. Qe2 Bg4 11. O-O-O Nd7 12. d5 cxd5 13. Bxd5 Be7 14. Bc3 Qf4+ 15. Bd2 Qc7 16. Bb3 O-O 17. h3 Bxf3 18. Qxf3 Nc5 19. Bc3 Nxb3+ 20. axb3 Rad8 21. Qg4 g6 22. h4 Rxd1+ 23. Rxd1 Rd8 24. Rxd8+ Qxd8 25. h5 Bf6 26. hxg6 hxg6 27. Qf3 Bg5+ 28. Kb1 Qd5 29. Qh3 e5 30. Qc8+ Kg7 31. f3 Bf6 32. Qc4 Qxc4 33. bxc4 1-0`,

  // Game 8: Ruy Lopez - Time trouble error
  `[Event "Rated Blitz game"]
[Site "https://lichess.org/sampleGame08"]
[Date "2026.08.16"]
[White "MasterTactician"]
[WhiteElo "1580"]
[Black "Alex_Tactics"]
[BlackElo "1530"]
[Result "1-0"]
[ECO "C70"]
[Opening "Ruy Lopez"]
[TimeControl "180+0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4 Nc6 14. d5 Nb4 15. Bb1 a5 16. a3 Na6 17. Nf1 Bd7 18. Ng3 g6 19. Bh6 Rfc8 20. Qd2 Nc5 21. Bc2 a4 22. Rac1 Qb7 23. Nf5 Bxf5 24. exf5 Bf8 25. Bxf8 Rxf8 26. Qh6 e4 27. Ng5 Qxd5 28. Bxe4 Ncxe4 29. Rxe4 Qxf5 30. Rh4 1-0`
];

export function getSampleProfileAlex(): { profile: PersonalChessProfile; games: ParsedGame[] } {
  const games: ParsedGame[] = [];
  for (let i = 0; i < SAMPLE_PGNS_ALEX.length; i++) {
    const parsed = parsePgnGame(SAMPLE_PGNS_ALEX[i], 'Alex_Tactics', 'lichess', `alex_game_${i + 1}`);
    if (parsed) {
      games.push(parsed);
    }
  }

  const platformData: PersonalChessProfile['platformComparison'] = {
    lichess: {
      games: 5,
      rating: 1545,
      winRate: 52,
      accuracy: 78,
      blundersPerGame: 1.2,
    },
    chesscom: {
      games: 3,
      rating: 1490,
      winRate: 48,
      accuracy: 75,
      blundersPerGame: 1.5,
    },
  };

  const profile = generatePersonalProfile(games, 'Alex_Tactics', platformData);
  return { profile, games };
}
