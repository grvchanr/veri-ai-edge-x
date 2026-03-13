import React, { useEffect, memo } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface ConfidenceMeterProps {
  /** Confidence score as a percentage (0‑100). */
  confidence: number;
  /** Diameter of the gauge in pixels. */
  size?: number;
  /** Width of the gauge stroke. */
  strokeWidth?: number;
}

/**
 * Circular confidence gauge.
 *
 * - SVG‑based radial meter (no external chart libraries).
 * - Uses Framer Motion for a lightweight animated stroke.
 * - Large numeric percentage displayed in the centre.
 * - Designed to stay smooth on low‑power devices (e.g., Raspberry Pi).
 */
const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  confidence,
  size = 120,
  strokeWidth = 12,
}) => {
  // Clamp confidence between 0 and 100
  const clamped = Math.min(100, Math.max(0, confidence));

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  const controls = useAnimation();

  // Animate the stroke offset whenever confidence changes
  useEffect(() => {
    controls.start({
      strokeDashoffset: offset,
      transition: { duration: 0.6, ease: 'easeOut' },
    });
  }, [offset, controls]);

  return (
    <div className="flex items-center justify-center relative">
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-cyber-border, #2d2d2d)"
          strokeWidth={strokeWidth}
          className="opacity-30"
        />

        {/* Animated progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-cyber-accent, #00bcd4)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={controls}
        />
      </motion.svg>

      {/* Centered percentage text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-cyber-text">{Math.round(clamped)}%</span>
      </div>
    </div>
  );
};

export default memo(ConfidenceMeter);
