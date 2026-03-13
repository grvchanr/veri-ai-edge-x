import React, { useState, useEffect } from 'react';
import { healthApi, HealthResponse } from '@/lib/api';

interface SystemStatusProps {
  className?: string;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ className = '' }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await healthApi.check();
      setHealth(response);
    } catch (err) {
      setError('Failed to connect to backend');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const systemMetrics = [
    { label: 'Backend API', status: health ? 'online' : 'offline', color: health ? 'text-cyber-success' : 'text-cyber-danger' },
    { label: 'Inference Engine', status: 'ready', color: 'text-cyber-success' },
    { label: 'Model Status', status: 'loaded', color: 'text-cyber-success' },
    { label: 'CPU Usage', status: '12%', color: 'text-cyber-muted' },
    { label: 'Memory', status: '256MB', color: 'text-cyber-muted' },
  ];

  return (
    <div className={`glass rounded-lg border border-cyber-border ${className}`}>
      <div className="p-4 border-b border-cyber-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
          <svg className="w-4 h-4 text-cyber-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          System Status
        </h2>
        <button 
          onClick={checkHealth}
          disabled={loading}
          className="text-xs text-cyber-muted hover:text-cyber-accent transition-colors disabled:opacity-50"
        >
          {loading ? 'CHECKING...' : 'REFRESH'}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Connection Status */}
        <div className={`p-3 rounded-lg border ${
          health 
            ? 'bg-cyber-success/5 border-cyber-success/30' 
            : 'bg-cyber-danger/5 border-cyber-danger/30'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${health ? 'bg-cyber-success animate-pulse' : 'bg-cyber-danger'}`}></div>
            <span className={`text-sm font-medium ${health ? 'text-cyber-success' : 'text-cyber-danger'}`}>
              {health ? 'Backend Connected' : 'Backend Offline'}
            </span>
          </div>
          {health?.timestamp && (
            <p className="text-xs text-cyber-muted mt-1 ml-4 font-mono">
              Last check: {new Date(health.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 rounded-lg">
            <p className="text-xs text-cyber-danger">{error}</p>
          </div>
        )}

        {/* System Metrics */}
        <div className="space-y-2">
          {systemMetrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-cyber-border/50 last:border-0">
              <span className="text-sm text-cyber-muted">{metric.label}</span>
              <span className={`text-sm font-mono ${metric.color}`}>
                {metric.status === 'online' || metric.status === 'ready' || metric.status === 'loaded' ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {metric.status.toUpperCase()}
                  </span>
                ) : (
                  metric.status
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Device Info */}
        <div className="mt-4 pt-3 border-t border-cyber-border">
          <p className="text-xs text-cyber-muted mb-2">Device Information</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-cyber-card p-2 rounded border border-cyber-border">
              <p className="text-cyber-muted">Platform</p>
              <p className="text-cyber-text font-mono">Edge Device</p>
            </div>
            <div className="bg-cyber-card p-2 rounded border border-cyber-border">
              <p className="text-cyber-muted">Inference</p>
              <p className="text-cyber-text font-mono">CPU Only</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
