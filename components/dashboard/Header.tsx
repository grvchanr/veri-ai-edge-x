import React from 'react';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  return (
    <header className={`bg-cyber-dark border-b border-cyber-border ${className}`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <svg 
              className="w-10 h-10 text-cyber-accent" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <h1 className="text-xl font-bold text-cyber-text tracking-tight">
                VERI-AI <span className="text-cyber-accent">EDGE</span>
              </h1>
              <p className="text-xs text-cyber-muted">Autonomous Multimodal Deepfake Detection</p>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyber-accent/10 border border-cyber-accent/30 rounded-full">
            <span className="w-2 h-2 rounded-full bg-cyber-accent animate-pulse"></span>
            <span className="text-xs font-mono text-cyber-accent">Edge AI Active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyber-blue/10 border border-cyber-blue/30 rounded-full">
            <svg className="w-3 h-3 text-cyber-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span className="text-xs font-mono text-cyber-blue">CPU Inference</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
