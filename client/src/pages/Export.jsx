import { useState } from 'react';
import { Download, Database, Shield } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Export() {
  const [downloading, setDownloading] = useState(false);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'nephroalert_research_data.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Dataset downloaded successfully');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Research Data Export</h1>
      <p className="text-text-muted mb-8">Anonymized patient dataset for research analysis</p>

      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary mb-1">Anonymized Dataset</h3>
            <p className="text-sm text-text-muted mb-4">
              This export contains all patient visit data with personal identifiers removed. 
              Patient names are replaced with anonymized IDs (Patient_001, Patient_002, etc.) 
              for research compliance.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-sm">
                <p className="font-medium text-text-primary">Included Fields:</p>
                <ul className="text-text-muted mt-1 space-y-0.5">
                  <li>- Age, Gender</li>
                  <li>- Diabetes Duration</li>
                  <li>- HbA1c, Creatinine, eGFR</li>
                  <li>- Blood Urea, Urine ACR</li>
                  <li>- Blood Pressure</li>
                  <li>- CKD Stage, Risk Score</li>
                </ul>
              </div>
              <div className="text-sm">
                <p className="font-medium text-text-primary">Excluded (Privacy):</p>
                <ul className="text-text-muted mt-1 space-y-0.5">
                  <li>- Patient Names</li>
                  <li>- Phone Numbers</li>
                  <li>- Village Names</li>
                  <li>- PHC Details</li>
                  <li>- Doctor Info</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary mb-1">Research Use Notice</h3>
            <p className="text-sm text-text-muted">
              This anonymized dataset is available for research purposes under the 
              <span className="font-medium text-text-primary"> ACS-AMRI Seed Grant Project</span> at 
              Dr. MGR Educational & Research Institute. Data usage must comply with 
              institutional ethics committee guidelines.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={downloading}
        className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50"
      >
        <Download className="w-5 h-5" />
        {downloading ? 'Generating CSV...' : 'Download Research Dataset (CSV)'}
      </button>
    </div>
  );
}
