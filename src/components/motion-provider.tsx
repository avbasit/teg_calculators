"use client";

import { MotionConfig } from "motion/react";

/** Honour the OS "reduce motion" setting for every animation in the app. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 260, damping: 28 }}>
      {children}
    </MotionConfig>
  );
}
