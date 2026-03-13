import { useState } from 'react';
import { 
  Header, 
  UploadPanel, 
  ProcessingTimeline, 
  ResultsDashboard, 
  SystemStatus 
} from '@/components/dashboard';
import { AnalysisResult } from '@/lib/api';

export default function Dashboard() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [timelineEvents, setTimelineEvents] = useState([
    { id: '1', label: 'File Upload', status: 'pending' as const },
    { id: '2', label: 'Preprocessing', status: 'pending' as const },
    { id: '3', label: 'AI Analysis', status: 'pending' as const },
    { id: '4', label: 'Result Generation', status: 'pending' as const },
  ]);

  const handleAnalysisComplete = (analysisResult: AnalysisResult) => {
    // Simulate timeline progression
    setTimelineEvents([
      { id: '1', label: 'File Upload', status: 'complete', timestamp: new Date().toLocaleTimeString() },
      { id: '2', label: 'Preprocessing', status: 'complete', timestamp: new Date().toLocaleTimeString() },
      { id: '3', label: 'AI Analysis', status: 'complete', timestamp: new Date().toLocaleTimeString() },
      { id: '4', label: 'Result Generation', status: 'complete', timestamp: new Date().toLocaleTimeString() },
    ]);
    setResult(analysisResult);
  };

  return (
    <div className="min-h-screen bg-cyber-black">
      <Header />

      {/* Main Dashboard Grid */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Desktop: 2x2 Grid | Mobile: Stacked */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
  );
}
