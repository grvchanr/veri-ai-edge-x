import React, { memo } from 'react';
import ConfidenceMeter from '@/components/dashboard/ConfidenceMeter';

/**
 * Shape of the analysis result expected by this component.
 * Adjust the fields if your actual `AnalysisResult` type differs.
 */
export interface AnalysisResult {
  /** Confidence score as a percentage (0‑100). */
  confidence: number;
  /** Verdict string – one of: "authentic", "suspicious", "deepfake". */
  verdict: 'authentic' | 'suspicious' | 'deepfake';
  /** Additional metrics for display. */
  metrics: {
    framesAnalyzed: number;
    processingTime: number; // seconds
    modelUsed: string;
    inferenceDevice: string;
  };
}

/**
 * ResultsDashboard
 *
 * Shows the AI inference outcome:
 *   • Circular confidence gauge (re‑uses ConfidenceMeter)
 *   • Verdict card with color‑coded status
 *   • Metrics panel with technical details
 *
 * Designed to be lightweight and responsive on low‑power edge devices.
 */
const ResultsDashboard: React.FC<{ result: AnalysisResult | null }> = ({ result }) => {
  if (!result) {
    return (
      <div className="glass rounded-lg border border-cyber-border p-6 text-center text-cyber-muted">
        <p className="text-sm">No analysis result yet. Upload a file to begin.</p>
      </div>
    );
  }

  const { confidence, verdict, metrics } = result;

  // Map verdict to colors and border classes
  const verdictMap: Record<
    AnalysisResult['verdict'],
    { bg: string; text: string; border: string; label: string }
  > = {
    authentic: {
      bg: 'bg-cyber-success/10',
      text: 'text-cyber-success',
      border: 'border-cyber-success',
      label: 'Authentic',
    },
    suspicious: {
      bg: 'bg-cyber-warning/10',
      text: 'text-cyber-warning',
      border: 'border-cyber-warning',
      label: 'Suspicious',
    },
    deepfake: {
      bg: 'bg-cyber-danger/10',
      text: 'text-cyber-danger',
      border: 'border-cyber-danger',
      label: 'Likely Deepfake',
    },
  };

  const verdictStyle = verdictMap[verdict];

  return (
    <div
      className={`
        glass rounded-lg border border-cyber-border p-6 flex flex-col gap-6
        transition transform hover:scale-[1.02]
        hover:shadow-[0_0_12px_rgba(0,255,255,0.3)]
      `}
    >
      {/* Header */}
      <h2 className="text-lg font-semibold text-cyber-text flex items-center gap-2">
        <svg
          className="w-5 h-5 text-cyber-accent"
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
        Analysis Results
      </h2>

      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Confidence gauge */}
        <div className="flex flex-col items-center">
          <ConfidenceMeter confidence={confidence} size={140} strokeWidth={14} />
          <p className="mt-2 text-sm text-cyber-muted">Confidence Score</p>
        </div>

        {/* Verdict card */}
        <div
          className={`
            flex items-center justify-center rounded-md p-4
            ${verdictStyle.bg} border ${verdictStyle.border} ${verdictStyle.text}
            transition-colors hover:bg-opacity-20
          `}
        >
          <span className="text-xl font-bold">{verdictStyle.label}</span>
        </div>
      </div>

      {/* Metrics panel */}
      <div className="border-t border-cyber-border pt-4">
        <h3 className="text-sm font-medium text-cyber-text mb-2">Metrics</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-cyber-muted">
          <div className="flex justify-between">
            <dt>Frames analyzed</dt>
            <dd className="font-mono">{metrics.framesAnalyzed}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Processing time</dt>
            <dd className="font-mono">{metrics.processingTime}s</dd>
          </div>
          <div className="flex justify-between">
            <dt>Model used</dt>
            <dd className="font-mono">{metrics.modelUsed}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Inference device</dt>
            <dd className="font-mono">{metrics.inferenceDevice}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default memo(ResultsDashboard);
