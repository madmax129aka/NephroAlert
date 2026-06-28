import { TrendingUp, TrendingDown, Minus, ChevronsDown } from 'lucide-react';

export default function TrendArrow({ pctChange, showValue = true }) {
  let icon, color, label;

  if (pctChange === null || pctChange === undefined) {
    return <span className="text-text-muted text-sm">—</span>;
  }

  if (pctChange > 5) {
    // Improving (for eGFR going up is good, but for creatinine going up is bad)
    icon = <TrendingUp className="w-4 h-4" />;
    color = 'text-risk-low';
    label = 'Improving';
  } else if (pctChange > -10) {
    icon = <Minus className="w-4 h-4" />;
    color = 'text-text-muted';
    label = 'Stable';
  } else if (pctChange > -25) {
    icon = <TrendingDown className="w-4 h-4" />;
    color = 'text-risk-high';
    label = 'Declining';
  } else {
    icon = <ChevronsDown className="w-4 h-4" />;
    color = 'text-risk-critical';
    label = 'Rapid decline';
  }

  return (
    <div className={`flex items-center gap-1.5 ${color}`}>
      {icon}
      {showValue && (
        <span className="text-sm font-medium">
          {pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

/**
 * Inverted trend arrow for metrics where increase is bad (creatinine, urea, ACR)
 */
export function InverseTrendArrow({ pctChange, showValue = true }) {
  let icon, color;

  if (pctChange === null || pctChange === undefined) {
    return <span className="text-text-muted text-sm">—</span>;
  }

  if (pctChange < -5) {
    icon = <TrendingDown className="w-4 h-4" />;
    color = 'text-risk-low';
  } else if (pctChange < 10) {
    icon = <Minus className="w-4 h-4" />;
    color = 'text-text-muted';
  } else if (pctChange < 50) {
    icon = <TrendingUp className="w-4 h-4" />;
    color = 'text-risk-high';
  } else {
    icon = <ChevronsDown className="w-4 h-4 rotate-180" />;
    color = 'text-risk-critical';
  }

  return (
    <div className={`flex items-center gap-1.5 ${color}`}>
      {icon}
      {showValue && (
        <span className="text-sm font-medium">
          {pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
