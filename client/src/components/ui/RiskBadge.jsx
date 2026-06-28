import { motion } from 'framer-motion';

const colorMap = {
  Low: 'bg-risk-low',
  Moderate: 'bg-risk-moderate',
  High: 'bg-risk-high',
  Critical: 'bg-risk-critical'
};

export default function RiskBadge({ level, size = 'sm' }) {
  const sizeClasses = size === 'lg' 
    ? 'px-4 py-1.5 text-sm' 
    : 'px-2.5 py-0.5 text-xs';

  const badge = (
    <span className={`inline-flex items-center font-bold uppercase text-white rounded-full ${colorMap[level] || 'bg-gray-400'} ${sizeClasses}`}>
      {level}
    </span>
  );

  if (level === 'Critical') {
    return (
      <motion.span
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="inline-flex"
      >
        {badge}
      </motion.span>
    );
  }

  return badge;
}
