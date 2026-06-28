import { motion } from 'framer-motion';

export default function RiskGauge({ score = 0, size = 200 }) {
  const radius = size * 0.38;
  const cx = size / 2;
  const cy = size * 0.55;
  const strokeWidth = size * 0.08;

  // Arc from 180 degrees to 0 degrees (left to right semicircle)
  const startAngle = 180;
  const endAngle = 0;
  const totalAngle = startAngle - endAngle;

  // Calculate needle angle
  const needleAngle = startAngle - (score / 100) * totalAngle;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = radius * 0.75;
  const needleX = cx + needleLength * Math.cos(needleRad);
  const needleY = cy - needleLength * Math.sin(needleRad);

  // Create arc paths for each zone
  const createArc = (startPct, endPct) => {
    const sAngle = startAngle - startPct * totalAngle;
    const eAngle = startAngle - endPct * totalAngle;
    const sRad = (sAngle * Math.PI) / 180;
    const eRad = (eAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(sRad);
    const y1 = cy - radius * Math.sin(sRad);
    const x2 = cx + radius * Math.cos(eRad);
    const y2 = cy - radius * Math.sin(eRad);

    const largeArcFlag = Math.abs(sAngle - eAngle) > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  const zones = [
    { start: 0, end: 0.25, color: '#16A34A' },
    { start: 0.25, end: 0.5, color: '#D97706' },
    { start: 0.5, end: 0.75, color: '#EA580C' },
    { start: 0.75, end: 1, color: '#DC2626' }
  ];

  const getScoreColor = () => {
    if (score < 25) return '#16A34A';
    if (score < 50) return '#D97706';
    if (score < 75) return '#EA580C';
    return '#DC2626';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Background arcs */}
        {zones.map((zone, i) => (
          <path
            key={i}
            d={createArc(zone.start, zone.end)}
            fill="none"
            stroke={zone.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.25}
          />
        ))}

        {/* Active arc up to score */}
        {zones.map((zone, i) => {
          const scorePct = score / 100;
          if (scorePct <= zone.start) return null;
          const end = Math.min(scorePct, zone.end);
          return (
            <motion.path
              key={`active-${i}`}
              d={createArc(zone.start, end)}
              fill="none"
              stroke={zone.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: i * 0.2 }}
            />
          );
        })}

        {/* Needle */}
        <motion.line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#0F172A"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ x2: cx - needleLength, y2: cy }}
          animate={{ x2: needleX, y2: needleY }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={6} fill="#0F172A" />
      </svg>

      {/* Score display */}
      <div className="text-center -mt-2">
        <motion.span 
          className="text-3xl font-bold"
          style={{ color: getScoreColor() }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {score}
        </motion.span>
        <span className="text-text-muted text-sm">/100</span>
      </div>
    </div>
  );
}
