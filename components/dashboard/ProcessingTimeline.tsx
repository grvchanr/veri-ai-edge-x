import React, { memo } from 'react';
import { motion, Variants } from 'framer-motion';

interface TimelineEvent {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  timestamp?: string;
}

interface ProcessingTimelineProps {
  className?: string;
  /** 
   * If omitted the component will render the default AI‑inference steps:
   * Extracting frames → Detecting faces → Artifact analysis → Aggregating results
   */
  events?: TimelineEvent[];
}

/* -------------------------------------------------------------------------- */
/* Default AI‑inference steps (the four steps you asked for)                 */
/* -------------------------------------------------------------------------- */
const defaultEvents: TimelineEvent[] = [
  { id: '1', label: 'Extracting frames', status: 'pending' },
  { id: '2', label: 'Detecting faces', status: 'pending' },
  { id: '3', label: 'Artifact analysis', status: 'pending' },
  { id: '4', label: 'Aggregating results', status: 'pending' },
];

/* -------------------------------------------------------------------------- */
/* Framer Motion variants – keep them lightweight for low‑power devices      */
/* -------------------------------------------------------------------------- */
const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.25, // each step appears 250 ms after the previous
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

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

const ProcessingTimeline: React.FC<ProcessingTimelineProps> = ({
  className = '',
  events = defaultEvents,
}) => {
  // Calculate progress percentage (completed steps / total steps)
  const completedCount = events.filter((e) => e.status === 'complete').length;
  const progressPercent = Math.round((completedCount / events.length) * 100);

  return (
    <motion.div
      className={`
        glass rounded-lg border border-cyber-border
        transition transform hover:scale-[1.02]
        hover:shadow-[0_0_12px_rgba(0,255,255,0.3)]
        ${className}
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-cyber-border">
        <h2 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
          <svg className="w-4 h-4 text-cyber-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Processing Timeline
        </h2>
      </div>

      {/* Timeline items – animated with Framer Motion */}
      <motion.div
        className="p-4"
        variants={listVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-4">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              className="flex items-center gap-3 relative group hover:bg-cyber-accent/10 rounded-md p-1"
              variants={itemVariants}
            >
              {/* Status Indicator */}
              <div className={`
                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                ${getStatusColor(event.status)}
              `}>
                {getStatusIcon(event.status)}
              </div>

              {/* Connector Line (only between items) */}
              {index < events.length - 1 && (
                <div
                  className={`
                    absolute left-3 top-10 w-0.5 h-6
                    ${event.status === 'complete' ? 'bg-cyber-success' : 'bg-cyber-border'}
                  `}
                  style={{ marginTop: '8px' }}
                />
              )}

              {/* Label & optional timestamp */}
              <div className="flex-1">
                <p className={`
                  text-sm
                  ${event.status === 'pending' ? 'text-cyber-muted' : 'text-cyber-text'}
                `}>
                  {event.label}
                </p>
                {event.timestamp && (
                  <p className="text-xs text-cyber-muted font-mono">{event.timestamp}</p>
                )}
              </div>

              {/* Status Badge */}
              <span
                className={`
                  text-xs font-mono px-2 py-0.5 rounded
                  ${event.status === 'complete'
                    ? 'bg-cyber-success/10 text-cyber-success'
                    : event.status === 'active'
                    ? 'bg-cyber-accent/10 text-cyber-accent'
                    : event.status === 'error'
                    ? 'bg-cyber-danger/10 text-cyber-danger'
                    : 'bg-cyber-border text-cyber-muted'}
                `}
              >
                {event.status.toUpperCase()}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-cyber-muted mb-2">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-cyber-accent rounded-full"
              style={{ width: `${progressPercent}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default memo(ProcessingTimeline);
