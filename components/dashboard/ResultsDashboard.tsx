import React from 'react';
import { AnalysisResult } from '@/lib/api';

interface ResultsDashboardProps {
  className?: string;
  result?: AnalysisResult | null;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ className = '', result }) => {
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-cyber-danger';
    if (score >= 0.5) return 'text-cyber-warning';
    return 'text-cyber-success';
  };

  const getConfidenceBg = (score: number) => {
    if (score >= 0.8) return 'bg-cyber-danger';
    if (score >= 0.5) return 'bg-cyber-warning';
    return 'bg-cyber-success';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 0.8) return 'HIGH RISK';
    if (score >= 0.5) return 'MEDIUM RISK';
    return 'LOW RISK';
  };

  if (!result) {
    return (
      <div className={`glass rounded-lg border border-cyber-border ${className}`}>
        <div className="p-4 border-b border-cyber-border">
          <h2 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
            <svg className="w-4 h-4 text-cyber-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analysis Results
          </h2>
        </div>
        <div className="p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-cyber-border mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-cyber-muted">No analysis results yet</p>
          <p className="text-xs text-cyber-muted mt-1">Upload a file to begin analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass rounded-lg border border-cyber-border ${className}`}>
      <div className="p-4 border-b border-cyber-border">
        <h2 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
          <svg className="w-4 h-4 text-cyber-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Analysis Results
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Main Result */}
        <div className={`p-4 rounded-lg border ${
          result.is_fake 
            ? 'bg-cyber-danger/5 border-cyber-danger/30' 
            : 'bg-cyber-success/5 border-cyber-success/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                result.is_fake ? 'bg-cyber-danger/20' : 'bg-cyber-success/20'
              }`}>
                {result.is_fake ? (
                  <svg className="w-5 h-5 text-cyber-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-cyber-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-lg font-bold ${result.is_fake ? 'text-cyber-danger' : 'text-cyber-success'}`}>
                  {result.is_fake ? 'DEEPFAKE DETECTED' : 'AUTHENTIC'}
                </p>
                <p className="text-xs text-cyber-muted">
                  {result.is_fake ? 'Manipulated content identified' : 'Content appears genuine'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-cyber-card rounded-lg p-3 border border-cyber-border">
            <p className="text-xs text-cyber-muted mb-1">Confidence Score</p>
            <p className={`text-2xl font-bold font-mono ${getConfidenceColor(result.confidence)}`}>
              {(result.confidence * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-cyber-card rounded-lg p-3 border border-cyber-border">
            <p className="text-xs text-cyber-muted mb-1">Risk Level</p>
            <p className={`text-lg font-bold ${getConfidenceColor(result.confidence)}`}>
              {getRiskLabel(result.confidence)}
            </p>
          </div>
        </div>

        {/* Risk Meter */}
        <div className="bg-cyber-card rounded-lg p-3 border border-cyber-border">
          <div className="flex justify-between text-xs text-cyber-muted mb-2">
            <span>Risk Assessment</span>
            <span className="font-mono">{getRiskLabel(result.confidence)}</span>
          </div>
          <div className="h-2 bg-cyber-border rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getConfidenceBg(result.confidence)}`}
              style={{ width: `${result.confidence * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-cyber-muted mt-2">
            <span>Authentic</span>
            <span>Deepfake</span>
          </div>
        </div>

        {/* Additional Details */}
        {result.details && (
          <div className="bg-cyber-card rounded-lg p-3 border border-cyber-border">
            <p className="text-xs text-cyber-muted mb-2">Analysis Details</p>
            <pre className="text-xs text-cyber-text font-mono overflow-x-auto">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsDashboard;
