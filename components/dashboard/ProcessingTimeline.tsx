import React from 'react';

interface TimelineEvent {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  timestamp?: string;
}

interface ProcessingTimelineProps {
  className?: string;
  events?: TimelineEvent[];
}

const defaultEvents: TimelineEvent[] = [
  { id: '1', label: 'File Upload', status: 'pending' },
  { id: '2', label: 'Preprocessing', status: 'pending' },
  { id: '3', label: 'AI Analysis', status: 'pending' },
  { id: '4', label: 'Result Generation', status: 'pending' },
];

const ProcessingTimeline: React.FC<ProcessingTimelineProps> = ({ 
  className = '', 
  events = defaultEvents 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-cyber-success text-cyber-success';
      case 'active':
        return 'bg-cyber-accent text-cyber-accent animate-pulse';
      case 'error':
        return 'bg-cyber-danger text-cyber-danger';
      default:
        return 'bg-cyber-border text-cyber-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'active':
        return (
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return <span className="w-3 h-3 rounded-full border border-current"></span>;
    }
  };

  return (
    <div className={`glass rounded-lg border border-cyber-border ${className}`}>
      <div className="p-4 border-b border-cyber-border">
        <h2 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
          <svg className="w-4 h-4 text-cyber-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Processing Timeline
        </h2>
      </div>

      <div className="p-4">
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="flex items-center gap-3">
              {/* Status Indicator */}
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${getStatusColor(event.status)}`}>
                {getStatusIcon(event.status)}
              </div>

              {/* Connector Line */}
              {index < events.length - 1 && (
                <div className={`absolute left-3 top-10 w-0.5 h-6 ${event.status === 'complete' ? 'bg-cyber-success' : 'bg-cyber-border'}`} style={{ marginTop: '8px' }}></div>
              )}

              {/* Label */}
              <div className="flex-1">
                <p className={`text-sm ${event.status === 'pending' ? 'text-cyber-muted' : 'text-cyber-text'}`}>
                  {event.label}
                </p>
                {event.timestamp && (
                  <p className="text-xs text-cyber-muted font-mono">{event.timestamp}</p>
                )}
              </div>

              {/* Status Badge */}
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                event.status === 'complete' ? 'bg-cyber-success/10 text-cyber-success' :
                event.status === 'active' ? 'bg-cyber-accent/10 text-cyber-accent' :
                event.status === 'error' ? 'bg-cyber-danger/10 text-cyber-danger' :
                'bg-cyber-border text-cyber-muted'
              }`}>
                {event.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-cyber-muted mb-2">
            <span>Progress</span>
            <span>{Math.round((events.filter(e => e.status === 'complete').length / events.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyber-accent rounded-full transition-all duration-500"
              style={{ width: `${(events.filter(e => e.status === 'complete').length / events.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingTimeline;
