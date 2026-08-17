export interface OpeningInfo {
  eco: string;
  name: string;
  moves: string;
  category: 'e4' | 'd4' | 'Flank' | 'Other';
  structureName: string;
}

export const OPENINGS_DATABASE: Record<string, OpeningInfo> = {
  'B01': { eco: 'B01', name: 'Scandinavian Defense', moves: '1. e4 d5', category: 'e4', structureName: 'Open Central' },
  'B10': { eco: 'B10', name: 'Caro-Kann Defense', moves: '1. e4 c6', category: 'e4', structureName: 'Caro-Slav Chain' },
  'B12': { eco: 'B12', name: 'Caro-Kann: Advance Variation', moves: '1. e4 c6 2. d4 d5 3. e5', category: 'e4', structureName: 'Locked Advance Chain' },
  'C00': { eco: 'C00', name: 'French Defense', moves: '1. e4 e6', category: 'e4', structureName: 'French Wedge' },
  'C02': { eco: 'C02', name: 'French: Advance Variation', moves: '1. e4 e6 2. d4 d5 3. e5', category: 'e4', structureName: 'French Chain (e5/d4)' },
  'B20': { eco: 'B20', name: 'Sicilian Defense', moves: '1. e4 c5', category: 'e4', structureName: 'Asymmetrical Semi-Open' },
  'B33': { eco: 'B33', name: 'Sicilian: Sveshnikov Variation', moves: '1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5', category: 'e4', structureName: 'd5 Hole / e5 Outpost' },
  'B90': { eco: 'B90', name: 'Sicilian: Najdorf Variation', moves: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6', category: 'e4', structureName: 'Scheveningen/Najdorf Center' },
  'C50': { eco: 'C50', name: 'Italian Game / Giuoco Piano', moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5', category: 'e4', structureName: 'Classical Open Center' },
  'C65': { eco: 'C65', name: 'Ruy Lopez: Berlin Defense', moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6', category: 'e4', structureName: 'Berlin Wall Endgame' },
  'C70': { eco: 'C70', name: 'Ruy Lopez', moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6', category: 'e4', structureName: 'Spanish Center' },
  'D00': { eco: 'D00', name: "Queen's Pawn Game: London System", moves: '1. d4 d5 2. Bf4', category: 'd4', structureName: 'London Pyramid (c3-d4-e3)' },
  'D02': { eco: 'D02', name: "Queen's Pawn Game", moves: '1. d4 d5 2. Nf3 Nf6', category: 'd4', structureName: 'Symmetrical d4' },
  'D30': { eco: 'D30', name: "Queen's Gambit Declined", moves: '1. d4 d5 2. c4 e6', category: 'd4', structureName: 'Orthodox QGD Structure' },
  'D37': { eco: 'D37', name: "Queen's Gambit Declined: Traditional", moves: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3', category: 'd4', structureName: 'QGD Central Tension' },
  'E60': { eco: 'E60', name: "King's Indian Defense", moves: '1. d4 Nf6 2. c4 g6', category: 'd4', structureName: 'KID Clashing Chains (e5 vs c5)' },
  'E10': { eco: 'E10', name: "Queen's Indian Defense", moves: '1. d4 Nf6 2. c4 e6 3. Nf3 b6', category: 'd4', structureName: 'Hypermodern Hanging Pawns' },
  'A00': { eco: 'A00', name: 'Uncommon Opening', moves: '1. g3 / 1. b3', category: 'Other', structureName: 'Flexible Fianchetto' },
  'A04': { eco: 'A04', name: 'Reti Opening', moves: '1. Nf3', category: 'Flank', structureName: 'Reti Complex' },
  'A10': { eco: 'A10', name: 'English Opening', moves: '1. c4', category: 'Flank', structureName: 'English Asymmetrical' },
};

export function detectOpening(ecoOrPgn: string, openingNameHeader?: string): { eco: string; name: string } {
  if (openingNameHeader && openingNameHeader.length > 2) {
    return {
      eco: ecoOrPgn || 'C00',
      name: openingNameHeader.replace(/:.*/, ''),
    };
  }

  if (OPENINGS_DATABASE[ecoOrPgn]) {
    return {
      eco: ecoOrPgn,
      name: OPENINGS_DATABASE[ecoOrPgn].name,
    };
  }

  return {
    eco: ecoOrPgn || 'C50',
    name: 'Italian / Open Game',
  };
}

// PGN providers often use a different label for every variation.  Repertoire
// statistics are more useful when the French, Sicilian, etc. are counted as a
// single family instead of appearing as several near-duplicate rows.
export function getOpeningFamily(name: string): string {
  const cleaned = name.replace(/:.*/, '').trim();
  const families = [
    'Sicilian Defense', 'French Defense', 'Caro-Kann Defense', 'Scandinavian Defense',
    "Queen's Gambit Declined", "King's Indian Defense", "Queen's Indian Defense",
    'Ruy Lopez', 'Italian Game', 'English Opening', 'Reti Opening', 'London System',
  ];
  return families.find(family => cleaned.toLowerCase().startsWith(family.toLowerCase())) || cleaned;
}
