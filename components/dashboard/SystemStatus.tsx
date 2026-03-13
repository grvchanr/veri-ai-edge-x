import React, { useEffect, useState, useCallback, memo } from 'react';
import { checkHealth, HealthResponse } from '@/lib/api';

/**
 * SystemStatus
 *
 * - Polls the backend `/health` endpoint every 5 seconds.
 * - Displays API health, edge‑mode flag, inference device, and latency.
 * - Uses the shared `checkHealth` helper (Axios‑based) for consistent error handling.
 * - UI mirrors the style of other dashboard cards (glass, border, Tailwind).
 *
 * The component is deliberately simple to keep CPU usage low on edge devices
 * such as a Raspberry Pi.
 */
const SystemStatus: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await checkHealth();
      setHealth(data);
      setError(null);
    } catch (err) {
      console.error('Health check failed:', err);
      setError('Unable to reach backend');
      setHealth(null);
    }
  }, []);

  // Initial fetch + polling every 5 seconds
  useEffect(() => {
    fetchHealth();
    const intervalId = setInterval(fetchHealth, 5000);
    return () => clearInterval(intervalId);
  }, [fetchHealth]);

  // Helper to render a label/value pair
  const renderItem = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between py-1">
      <span className="text-sm text-cyber-muted">{label}</span>
      <span className="text-sm font-medium text-cyber-text">{value}</span>
    </div>
  );

  // Border color based on health status
  const borderClass =
    health?.status === 'ok' ? 'border-cyber-success' : 'border-cyber-danger';

  return (
    <div
      className={`
        glass rounded-lg ${borderClass} border-2 p-4
        transition transform hover:scale-[1.02]
        hover:shadow-[0_0_12px_rgba(0,255,255,0.3)]
      `}
    >
      {/* Header */}
      <h2 className="text-sm font-semibold text-cyber-text flex items-center gap-2 mb-2">
        <svg
          className="w-4 h-4 text-cyber-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2z"
          />
        </svg>
        System Status
      </h2>

      {/* Content */}
      {error ? (
        <p className="text-xs text-cyber-danger">{error}</p>
      ) : health ? (
        <div className="text-xs">
          {renderItem('API status', health.status === 'ok' ? 'Healthy' : 'Error')}
          {renderItem('Edge mode', health.edgeMode)}
          {renderItem('Inference device', health.inferenceDevice)}
          {renderItem('Latency', `${health.latency} ms`)}
        </div>
      ) : (
        <p className="text-xs text-cyber-muted">Loading…</p>
      )}
    </div>
  );
};

export default memo(SystemStatus);
