"use client";

import { motion } from "motion/react";

/**
 * Trivial Motion widget — a pulsing dot. Exists only to prove the
 * `"use client"` leaf pattern and that Motion animates inside the docs app.
 * Not a real concept widget; it does not need to pass ADR-0007's
 * dynamics-shaped filter.
 */
export const MotionDemo = () => (
  <motion.span
    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
    className="inline-block size-6 rounded-full bg-sky-500"
    transition={{
      duration: 1.4,
      ease: "easeInOut",
      repeat: Number.POSITIVE_INFINITY,
    }}
  />
);
