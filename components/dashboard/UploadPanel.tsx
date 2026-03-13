import React, { useState, useCallback } from 'react';
import { analysisApi, AnalysisResult } from '@/lib/api';

interface UploadPanelProps {
  className?: string;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

type TabType = 'video' | 'text';

const UploadPanel: React.FC<UploadPanelProps> = ({ className = '', onAnalysisComplete }) => {
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleVideoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    
    if ('dataTransfer' in e) {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        file = e.dataTransfer.files[0];
      }
    } else {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        file = target.files[0];
      }
    }

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please upload a valid video file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analysisApi.analyzeVideo(file);
      onAnalysisComplete?.(result);
    } catch (err) {
      setError('Video analysis failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [onAnalysisComplete]);

  const handleTextAnalyze = useCallback(async () => {
    if (!textInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await analysisApi.analyzeText(textInput);
      onAnalysisComplete?.(result);
    } catch (err) {
      setError('Text analysis failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [textInput, onAnalysisComplete]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  return (
    <div className={`glass rounded-lg border border-cyber-border ${className}`}>
      <div className="p-4 border-b border-cyber-border">
        <h2 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
          <svg className="w-4 h-4 text-cyber-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload & Analyze
        </h2>
      </div>

      <div className="p-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'video' 
                ? 'bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30' 
                : 'bg-cyber-card text-cyber-muted border border-cyber-border hover:border-cyber-muted'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Video
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'text' 
                ? 'bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30' 
                : 'bg-cyber-card text-cyber-muted border border-cyber-border hover:border-cyber-muted'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Text
          </button>
        </div>

        {/* Upload Area */}
        {activeTab === 'video' ? (
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
              dragActive 
                ? 'border-cyber-accent bg-cyber-accent/5' 
                : 'border-cyber-border hover:border-cyber-muted'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleVideoUpload}
          >
            {loading ? (
              <div className="py-8">
                <div className="inline-block w-10 h-10 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-cyber-muted font-mono">ANALYZING VIDEO...</p>
              </div>
            ) : (
              <>
                <svg className="w-10 h-10 mx-auto text-cyber-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-cyber-text mb-2">Drag & drop video file</p>
                <p className="text-xs text-cyber-muted mb-3">or click to browse</p>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="inline-block px-4 py-2 bg-cyber-accent/10 text-cyber-accent text-xs font-medium rounded-lg border border-cyber-accent/30">
                  SELECT FILE
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste text content for phishing detection..."
              disabled={loading}
              rows={5}
              className="w-full bg-cyber-card border border-cyber-border rounded-lg p-3 text-cyber-text placeholder-cyber-muted/50 focus:outline-none focus:border-cyber-accent/50 focus:ring-1 focus:ring-cyber-accent/20 transition-all resize-none font-mono text-sm"
            />
            <button
              onClick={handleTextAnalyze}
              disabled={loading || !textInput.trim()}
              className="w-full bg-cyber-accent/10 hover:bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30 rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ANALYZING...' : 'ANALYZE TEXT'}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-3 p-3 bg-cyber-danger/10 border border-cyber-danger/30 rounded-lg">
            <p className="text-xs text-cyber-danger">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPanel;
