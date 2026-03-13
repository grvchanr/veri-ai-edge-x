import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AnalysisResult } from '@/lib/api';
import UploadToast from '@/components/dashboard/UploadToast';

// Lazy‑load heavy components to reduce initial bundle size
const Header = dynamic(
  () => import('@/components/dashboard/Header'),
  { ssr: false, loading: () => <p className="text-sm text-cyber-muted">Loading header…</p> }
);
const UploadPanel = dynamic(
  () => import('@/components/dashboard/UploadPanel'),
  { ssr: false, loading: () => <p className="text-sm text-cyber-muted">Loading upload panel…</p> }
);
const ProcessingTimeline = dynamic(
  () => import('@/components/dashboard/ProcessingTimeline'),
  { ssr: false, loading: () => <p className="text-sm text-cyber-muted">Loading timeline…</p> }
);
const ResultsDashboard = dynamic(
  () => import('@/components/dashboard/ResultsDashboard'),
  { ssr: false, loading: () => <p className="text-sm text-cyber-muted">Loading results…</p> }
);
const SystemStatus = dynamic(
  () => import('@/components/dashboard/SystemStatus'),
  { ssr: false, loading: () => <p className="text-sm text-cyber-muted">Loading status…</p> }
);

export default function Dashboard() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [timelineEvents, setTimelineEvents] = useState([
    { id: '1', label: 'Extracting frames', status: 'pending' as const },
    { id: '2', label: 'Detecting faces', status: 'pending' as const },
    { id: '3', label: 'Artifact analysis', status: 'pending' as const },
    { id: '4', label: 'Aggregating results', status: 'pending' as const },
  ]);
  const [showToast, setShowToast] = useState(false);

  const handleAnalysisComplete = useCallback((analysisResult: AnalysisResult) => {
    // Simulate sequential progression – each step becomes "complete"
    const now = new Date().toLocaleTimeString();
    setTimelineEvents([
      { id: '1', label: 'Extracting frames', status: 'complete', timestamp: now },
      { id: '2', label: 'Detecting faces', status: 'complete', timestamp: now },
      { id: '3', label: 'Artifact analysis', status: 'complete', timestamp: now },
      { id: '4', label: 'Aggregating results', status: 'complete', timestamp: now },
    ]);
    setResult(analysisResult);
    setShowToast(true); // trigger upload‑complete feedback
  }, []);

  return (
    <div className="min-h-screen bg-cyber-black font-sans antialiased">
      <Header />

      {/* Main Dashboard Grid */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Desktop: 2x2 Grid | Mobile: Stacked */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Upload Panel - Full width on mobile, half on tablet, quarter on desktop */}
          <div className="lg:col-span-2">
            <UploadPanel onAnalysisComplete={handleAnalysisComplete} />
          </div>

          {/* System Status */}
          <div className="lg:col-span-2">
            <SystemStatus />
          </div>

          {/* Processing Timeline */}
          <div className="lg:col-span-2">
            <ProcessingTimeline events={timelineEvents} />
          </div>

          {/* Results Dashboard */}
          <div className="lg:col-span-2">
            <ResultsDashboard result={result} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 py-4 border-t border-cyber-border">
          <div className="text-center">
            <p className="text-xs text-cyber-muted font-mono">
              VERI-AI EDGE v1.0.0 • Edge-Optimized Deepfake Detection
            </p>
          </div>
        </footer>
      </div>

      {/* Upload completion toast */}
      <UploadToast show={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}
