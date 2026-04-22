"use client";

/**
 * 5-second auto-solve hook.
 *
 * The moment the candidate lands on a (problem, language) pair we stamp
 * the countdown's start time via `ensureEditStart`. Once
 * AUTO_SOLVE_DELAY_MS has elapsed since that stamp we replace the buffer
 * with the canonical reference solution for that language.
 *
 * The hook runs inside a single top-level mount (`app/page.tsx`) so only
 * one timer is alive at a time; switching problem or language reschedules
 * the timer for the new pair (its own `editStartedAt` governs firing).
 */

import { useEffect, useRef } from "react";
import {
  useStore,
  AUTO_SOLVE_DELAY_MS,
  type Language,
} from "@/store/useStore";

export function useAutoSolve() {
  const problemId = useStore((s) => s.selectedProblemId);
  const language = useStore((s) => s.language);
  const editStartedAt = useStore(
    (s) => s.editStartedAt[problemId]?.[language as Language]
  );
  const alreadySolved = useStore(
    (s) => !!s.autoSolvedByProblem[problemId]?.[language as Language]
  );
  const trigger = useStore((s) => s.triggerAutoSolve);
  const ensureEditStart = useStore((s) => s.ensureEditStart);

  // Keep the latest trigger reference without re-scheduling on every render.
  const triggerRef = useRef(trigger);
  triggerRef.current = trigger;

  // Stamp the start time as soon as the (problem, lang) becomes active
  // if not already stamped. That lets the 5-second timer fire just
  // from selecting the problem + language — no keystroke required.
  useEffect(() => {
    if (alreadySolved) return;
    ensureEditStart(problemId, language);
  }, [problemId, language, alreadySolved, ensureEditStart]);

  useEffect(() => {
    if (alreadySolved) return;
    if (!editStartedAt) return;
    const remaining = AUTO_SOLVE_DELAY_MS - (Date.now() - editStartedAt);
    if (remaining <= 0) {
      // Past due — fire immediately on the next tick to avoid setState-
      // during-render warnings from React.
      const t = setTimeout(
        () => triggerRef.current(problemId, language),
        0
      );
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => triggerRef.current(problemId, language),
      remaining
    );
    return () => clearTimeout(t);
  }, [problemId, language, editStartedAt, alreadySolved]);
}
