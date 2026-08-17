import { MoveClassification } from '../types/chess';

export function formatEval(evalCp: number): string {
  if (Math.abs(evalCp) >= 9000) {
    const mateIn = Math.sign(evalCp) * (10000 - Math.abs(evalCp));
    return `#${mateIn > 0 ? '+' : ''}${mateIn}`;
  }
  const pawns = (evalCp / 100).toFixed(1);
  return evalCp > 0 ? `+${pawns}` : `${pawns}`;
}

export function getMoveClassificationDetails(classification: MoveClassification): {
  label: string;
  badgeClass: string;
  borderClass: string;
  icon: string;
  color: string;
} {
  switch (classification) {
    case 'best':
      return {
        label: 'Best Move',
        badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        borderClass: 'border-emerald-500',
        icon: '🟢',
        color: '#10B981',
      };
    case 'good':
      return {
        label: 'Good Move',
        badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        borderClass: 'border-emerald-400/60',
        icon: '🟢',
        color: '#34D399',
      };
    case 'inaccuracy':
      return {
        label: 'Inaccuracy',
        badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
        borderClass: 'border-yellow-500',
        icon: '🟡',
        color: '#FBBF24',
      };
    case 'mistake':
      return {
        label: 'Mistake',
        badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
        borderClass: 'border-orange-500',
        icon: '🟠',
        color: '#FB923C',
      };
    case 'blunder':
      return {
        label: 'Blunder',
        badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40',
        borderClass: 'border-red-500',
        icon: '🔴',
        color: '#F87171',
      };
    case 'critical':
      return {
        label: 'Critical Moment',
        badgeClass: 'bg-purple-500/25 text-purple-300 border-purple-500/50',
        borderClass: 'border-purple-400',
        icon: '⭐',
        color: '#C084FC',
      };
  }
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}
