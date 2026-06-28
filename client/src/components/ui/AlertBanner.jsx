import { AlertTriangle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AlertBanner({ level, explanation, recommendation, patientId }) {
  const navigate = useNavigate();
  const isCritical = level === 'Critical';

  return (
    <div className={`rounded-xl p-4 border-l-4 ${
      isCritical 
        ? 'bg-red-50 border-l-risk-critical' 
        : 'bg-orange-50 border-l-risk-high'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-100' : 'bg-orange-100'}`}>
          {isCritical 
            ? <AlertCircle className="w-5 h-5 text-risk-critical" />
            : <AlertTriangle className="w-5 h-5 text-risk-high" />
          }
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold text-sm ${isCritical ? 'text-red-900' : 'text-orange-900'}`}>
            {isCritical ? 'CRITICAL RISK ALERT' : 'HIGH RISK ALERT'}
          </h4>
          <p className={`text-sm mt-1 ${isCritical ? 'text-red-800' : 'text-orange-800'}`}>
            {explanation}
          </p>
          {recommendation && (
            <p className={`text-sm font-medium mt-2 ${isCritical ? 'text-red-900' : 'text-orange-900'}`}>
              Recommendation: {recommendation}
            </p>
          )}
        </div>
        {patientId && (
          <button 
            onClick={() => navigate(`/patients/${patientId}`)}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg ${
              isCritical 
                ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
            }`}
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
}
