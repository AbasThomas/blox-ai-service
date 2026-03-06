'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
}

const DIRECTION_OFFSETS = {
  up: { y: 28, x: 0 },
  down: { y: -28, x: 0 },
  left: { y: 0, x: 28 },
  right: { y: 0, x: -28 },
  none: { y: 0, x: 0 },
};

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = 'up',
  duration = 0.55,
}: FadeInProps) {
  const reduced = useReducedMotion();
  const { y, x } = DIRECTION_OFFSETS[direction];

  return (
    <motion.div
      className={className}
      initial={reduced ? {} : { opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-72px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Container for a group of FadeInItems — just provides layout, items animate individually */
export function FadeInGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number; // kept for API compat, unused
}) {
  return <div className={className}>{children}</div>;
}

/** Individual child for use inside FadeInGroup */
export function FadeInItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={
        reduced
          ? {}
          : {
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
            }
      }
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-48px' }}
    >
      {children}
    </motion.div>
  );
}
