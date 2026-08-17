import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { formatEval } from '../utils/formatters';

interface ChessboardViewProps {
  fen: string;
  orientation?: 'w' | 'b';
  lastMove?: { from: string; to: string } | null;
  bestMove?: { from: string; to: string } | null;
  threatSquare?: string | null;
  interactive?: boolean;
  evalCp?: number;
  onMove?: (move: { from: Square; to: Square; promotion?: string }) => void;
  height?: number | string;
}

// Standard SVG piece renderers
const PIECE_SYMBOLS: Record<string, string> = {
  'wp': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wp.png',
  'wn': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wn.png',
  'wb': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wb.png',
  'wr': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wr.png',
  'wq': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wq.png',
  'wk': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wk.png',
  'bp': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bp.png',
  'bn': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bn.png',
  'bb': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bb.png',
  'br': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/br.png',
  'bq': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bq.png',
  'bk': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bk.png',
};

export const ChessboardView: React.FC<ChessboardViewProps> = ({
  fen,
  orientation = 'w',
  lastMove,
  bestMove,
  threatSquare,
  interactive = false,
  evalCp,
  onMove,
}) => {
  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);

  // Clear selection on FEN change
  useEffect(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [fen]);

  const handleSquareClick = useCallback((square: Square) => {
    if (!interactive) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Check if clicked square is a valid target
      const matchMove = legalMoves.find(m => m.to === square);
      if (matchMove) {
        onMove?.({
          from: selectedSquare,
          to: square,
          promotion: 'q',
        });
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }

    // Select piece
    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [chess, interactive, legalMoves, onMove, selectedSquare]);

  const ranks = orientation === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = orientation === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

  // Calculate eval bar height
  const whiteEvalPct = useMemo(() => {
    if (evalCp === undefined) return 50;
    // Map -800 to +800 into 5% to 95%
    const clamped = Math.max(-800, Math.min(800, evalCp));
    return Math.round(50 + (clamped / 800) * 45);
  }, [evalCp]);

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Eval Bar */}
      {evalCp !== undefined && (
        <div className="flex flex-col items-center">
          <div className="w-5 h-80 sm:h-96 bg-[#262421] rounded-md overflow-hidden flex flex-col justify-end border border-slate-700/60 relative shadow-inner">
            {/* White side */}
            <div
              className="w-full bg-slate-100 transition-all duration-300 ease-out"
              style={{ height: `${orientation === 'w' ? whiteEvalPct : 100 - whiteEvalPct}%` }}
            />
            {/* Overlay value */}
            <div className="absolute inset-x-0 bottom-1 flex items-center justify-center">
              <span className="text-[10px] font-bold text-slate-800 bg-white/80 px-0.5 rounded shadow-sm">
                {formatEval(evalCp)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Board */}
      <div className="relative rounded-lg overflow-hidden border-2 border-[#363f52] shadow-2xl bg-[#2b3342] p-1">
        <div className="grid grid-cols-8 grid-rows-8 w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px]">
          {ranks.map((rank, rIdx) =>
            files.map((file, fIdx) => {
              const square = `${file}${rank}` as Square;
              const isLight = (rIdx + fIdx) % 2 === 0;
              const piece = chess.get(square);

              const isSelected = selectedSquare === square;
              const isLastMoveFrom = lastMove?.from === square;
              const isLastMoveTo = lastMove?.to === square;
              const isBestMoveTo = bestMove?.to === square;
              const isThreat = threatSquare === square;
              const isLegalTarget = legalMoves.some(m => m.to === square);

              let squareBg = isLight ? 'bg-[#EADECA]' : 'bg-[#769656]'; // Classic wood / lichess olive
              if (isSelected) squareBg = 'bg-[#BBCB2B]';
              else if (isLastMoveFrom || isLastMoveTo) squareBg = isLight ? 'bg-[#CED787]' : 'bg-[#A8B744]';
              else if (isThreat) squareBg = 'bg-red-500/60';

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors ${squareBg}`}
                >
                  {/* Rank / File Coordinate Labels */}
                  {fIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-0.5 text-[9px] font-bold ${
                        isLight ? 'text-[#769656]' : 'text-[#EADECA]'
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                  {rIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-0.5 text-[9px] font-bold ${
                        isLight ? 'text-[#769656]' : 'text-[#EADECA]'
                      }`}
                    >
                      {file}
                    </span>
                  )}

                  {/* Piece */}
                  {piece && (
                    <img
                      src={PIECE_SYMBOLS[`${piece.color}${piece.type}`]}
                      alt={`${piece.color} ${piece.type}`}
                      className="w-[86%] h-[86%] object-contain pointer-events-none drop-shadow-md z-10"
                    />
                  )}

                  {/* Legal Move Dot */}
                  {isLegalTarget && !piece && (
                    <div className="w-3.5 h-3.5 bg-black/25 rounded-full z-20" />
                  )}
                  {isLegalTarget && piece && (
                    <div className="absolute inset-0 rounded-full border-4 border-black/25 z-20" />
                  )}

                  {/* Best Move Suggestion Highlight */}
                  {isBestMoveTo && !isLastMoveTo && (
                    <div className="absolute inset-0 border-2 border-emerald-400 bg-emerald-400/20 z-10 rounded-sm" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
