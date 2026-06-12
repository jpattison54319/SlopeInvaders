import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { fadeIn } from './animation';

interface LaunchTransitionProps {
  reducedMotion: boolean;
  onDone: () => void;
}

/**
 * Simple, smooth transition when entering a level from the galaxy.
 * Just a clean fade-in that feels crisp and responsive.
 */
export function LaunchTransition({ reducedMotion, onDone }: LaunchTransitionProps) {
  useEffect(() => {
    const ms = reducedMotion ? 90 : 200;
    const id = window.setTimeout(onDone, ms);
    return () => window.clearTimeout(id);
  }, [onDone, reducedMotion]);

  return (
    <motion.div
      className="launch-transition"
      aria-hidden="true"
      variants={fadeIn}
      initial="initial"
      animate="animate"
      transition={{ duration: reducedMotion ? 0.05 : 0.15, ease: 'easeOut' }}
    />
  );
}