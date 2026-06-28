import { useEffect, useState } from 'react';

export default function StatCard({ title, value, color = '#0F4C81', icon: Icon }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const numValue = parseInt(value) || 0;
    if (numValue === 0) {
      setDisplayValue(0);
      return;
    }

    let current = 0;
    const increment = Math.max(1, Math.floor(numValue / 20));
    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setDisplayValue(numValue);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="card flex items-center gap-4" style={{ borderLeft: `4px solid ${color}` }}>
      {Icon && (
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      )}
      <div>
        <p className="text-text-muted text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-text-primary">{displayValue}</p>
      </div>
    </div>
  );
}
