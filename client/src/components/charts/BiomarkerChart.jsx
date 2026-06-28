import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

export default function BiomarkerChart({ data, field, label, normalMin, normalMax, color = '#0F4C81', unit = '' }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map(visit => ({
    date: new Date(visit.visitDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    value: visit[field],
    fullDate: new Date(visit.visitDate).toLocaleDateString('en-IN')
  }));

  const lastValue = chartData[chartData.length - 1]?.value;
  const isOutOfRange = normalMax && lastValue > normalMax || normalMin && lastValue < normalMin;
  const lineColor = isOutOfRange ? '#DC2626' : color;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white border border-border rounded-lg shadow-lg p-3">
          <p className="text-xs text-text-muted">{d.fullDate}</p>
          <p className="text-sm font-semibold" style={{ color: lineColor }}>
            {d.value} {unit}
          </p>
          {normalMin !== undefined && normalMax !== undefined && (
            <p className="text-xs text-text-muted mt-1">
              Normal: {normalMin}–{normalMax} {unit}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-text-primary">{label}</h3>
        <span className={`text-lg font-bold ${isOutOfRange ? 'text-risk-critical' : 'text-text-primary'}`}>
          {lastValue} {unit}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
          <Tooltip content={<CustomTooltip />} />
          {normalMax && (
            <ReferenceLine y={normalMax} stroke="#D97706" strokeDasharray="5 5" label={{ value: `High: ${normalMax}`, position: 'right', fontSize: 10, fill: '#D97706' }} />
          )}
          {normalMin && (
            <ReferenceLine y={normalMin} stroke="#D97706" strokeDasharray="5 5" label={{ value: `Low: ${normalMin}`, position: 'right', fontSize: 10, fill: '#D97706' }} />
          )}
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={lineColor} 
            strokeWidth={2.5}
            dot={{ r: 4, fill: lineColor, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
