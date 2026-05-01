/**
 * Global UI state for the assessment platform.
 *
 * Kept in one small Zustand store rather than Context because:
 *   - We read/write from deeply nested components (editor, test tabs,
 *     run button, sidebar) without wanting to thread props through.
 *   - Updates to "activeCaseIndex" or "runResults" should not re-render
 *     the entire tree — Zustand's selectors give us fine-grained reads.
 *
 * Code is keyed by **(problem, language)** so each problem keeps a
 * separate buffer per language (swapping language does not destroy the
 * Python work, and the Java buffer is a fresh Java starter by default).
 *
 * Completion tracking (`completedProblems`) drives the green-tick state
 * in the sidebar and the "N/total" progress counter.
 *
 * Auto-solve support:
 *   - `editStartedAt[problem][lang]` is stamped on the first keystroke
 *     for a (problem, lang) pair. A 5-minute timer (see `useAutoSolve`)
 *     fires once that window elapses and calls `triggerAutoSolve`.
 *   - `autoSolvedByProblem[problem][lang]` marks that the buffer is the
 *     canonical reference solution. The runner uses this flag to short-
 *     circuit Execute into a guaranteed-pass result, which keeps the
 *     Java / C++ / JS demos honest (Pyodide can't actually run them).
 */

import { create } from "zustand";
import {
  getProblemById,
  problems,
  type Language,
  type ProblemCodeOverride,
  type ProblemContentOverride,
} from "@/lib/problems";

export type { Language };

export type RunResult = {
  caseIndex: number;
  /** true = passed, false = wrong answer, null = executed (no expected). */
  passed: boolean | null;
  actual: string;
  expected?: string;
  error?: string;
  timeMs: number;
};

/** Which of the three top-level tabs in the test panel is active. */
export type TestPanelTab = "testcase" | "custom" | "result";

/** How long to wait before auto-filling the reference solution. */
export const AUTO_SOLVE_DELAY_MS = 5 * 1000;

type Store = {
  selectedProblemId: string;
  /** Code buffer keyed by problem → language. */
  codeByProblemAndLanguage: Record<string, Partial<Record<Language, string>>>;
  /** Currently-selected language for the editor. */
  language: Language;

  activeCaseIndex: number;
  /** Which top-tab is selected inside TestCasePanel. */
  activeTestTab: TestPanelTab;
  /** Custom stdin the user types in the "Custom Input" tab, per problem. */
  customInputByProblem: Record<string, string>;
  /** Last result of running against custom input, per problem. */
  customRunResultByProblem: Record<string, RunResult | undefined>;

  runResultsByProblem: Record<string, RunResult[]>;
  /** Problem IDs the candidate has successfully submitted. */
  completedProblems: Record<string, true>;

  consoleOpen: boolean;
  /** Questions dashboard sidebar — toggleable overlay. */
  sidebarOpen: boolean;
  /** Whether the camera/recording pill in the header is visible. */
  cameraVisible: boolean;
  /** Drawer chat panel — toggled with Ctrl/Cmd + Alt + Shift + M.
   *  Persisted in the store so the shortcut works whether the sidebar
   *  is open or closed; the chat reappears with the same on/off state
   *  the next time the drawer opens. */
  chatVisible: boolean;
  /** Per-problem content overrides loaded from Supabase. Keyed by
   *  `problem.id`; fields present here replace the hardcoded ones in
   *  `lib/problems.ts`. Empty by default — populated once the loader
   *  effect (in `app/page.tsx`) finishes its fetch. */
  problemContentOverrides: Record<string, ProblemContentOverride>;
  /** Per-problem starter/solution code overrides loaded from the
   *  separate `problem_code` Supabase table. Keyed by `problem.id`;
   *  per-language partial maps inside fall back to the hardcoded
   *  `starterCode` / `solutionCode` for any missing language. */
  problemCodeOverrides: Record<string, ProblemCodeOverride>;
  isRunning: boolean;
  submitMessage: string | null;

  /** Timestamp (ms) of the first edit for a given (problem, language). */
  editStartedAt: Record<string, Partial<Record<Language, number>>>;
  /** True once the auto-solver has dropped the reference solution in. */
  autoSolvedByProblem: Record<string, Partial<Record<Language, true>>>;

  /** Draggable splitter positions, 0–1. */
  splitHorizontal: number; // width share of the LEFT column (problem)
  splitVertical: number; // height share of the TOP row (code editor)

  // ---- actions ----
  selectProblem: (id: string) => void;
  setCode: (id: string, code: string) => void;
  setLanguage: (lang: Language) => void;
  setActiveCase: (idx: number) => void;
  setActiveTestTab: (tab: TestPanelTab) => void;
  setCustomInput: (id: string, text: string) => void;
  setCustomRunResult: (id: string, r: RunResult | undefined) => void;
  setRunResults: (id: string, results: RunResult[]) => void;
  markCompleted: (id: string) => void;
  setIsRunning: (running: boolean) => void;
  toggleConsole: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleCamera: () => void;
  toggleChat: () => void;
  setChatVisible: (open: boolean) => void;
  setProblemContentOverrides: (
    overrides: Record<string, ProblemContentOverride>,
  ) => void;
  upsertProblemContentOverride: (
    id: string,
    override: ProblemContentOverride,
  ) => void;
  removeProblemContentOverride: (id: string) => void;
  setProblemCodeOverrides: (
    overrides: Record<string, ProblemCodeOverride>,
  ) => void;
  upsertProblemCodeOverride: (
    problemId: string,
    language: Language,
    starter: string | null,
    solution: string | null,
  ) => void;
  removeProblemCodeOverride: (problemId: string, language: Language) => void;
  setConsoleOpen: (open: boolean) => void;
  setSubmitMessage: (msg: string | null) => void;
  triggerAutoSolve: (id: string, lang: Language) => void;
  /** Stamp the auto-solve countdown's start time if not already set for
   *  this (problem, language) pair. Called on mount / selection change
   *  so the 5-second timer fires purely from picking a question and a
   *  language — no typing required. */
  ensureEditStart: (id: string, lang: Language) => void;
  setSplitHorizontal: (v: number) => void;
  setSplitVertical: (v: number) => void;
};

const initialCustomInputs: Record<string, string> = problems.reduce(
  (acc, p) => {
    // Seed with the first sample's input so "Custom Input" starts useful.
    acc[p.id] = p.samples[0]?.input ?? "";
    return acc;
  },
  {} as Record<string, string>
);

/**
 * After a `problem_code` override change, replace the active editor
 * buffer if it currently holds a known code blob (the previous merged
 * starter or the previous merged solution). That keeps Monaco in sync
 * with live admin edits while leaving any actual candidate edits
 * untouched — if the buffer doesn't match either previous code, we
 * assume the candidate has typed and don't overwrite their work.
 */
function syncBufferAfterCodeOverrides(
  prev: {
    selectedProblemId: string;
    language: Language;
    codeByProblemAndLanguage: Record<string, Partial<Record<Language, string>>>;
    problemCodeOverrides: Record<string, ProblemCodeOverride>;
  },
  patch: { problemCodeOverrides: Record<string, ProblemCodeOverride> },
): {
  problemCodeOverrides: Record<string, ProblemCodeOverride>;
  codeByProblemAndLanguage?: Record<
    string,
    Partial<Record<Language, string>>
  >;
} {
  const id = prev.selectedProblemId;
  const lang = prev.language;
  const buf = prev.codeByProblemAndLanguage[id]?.[lang];
  if (buf === undefined) return patch; // nothing to overwrite

  const base = problems.find((p) => p.id === id);
  if (!base) return patch;

  const prevOv = prev.problemCodeOverrides[id];
  const nextOv = patch.problemCodeOverrides[id];

  const prevStarter = prevOv?.starterCode?.[lang] ?? base.starterCode[lang];
  const prevSolution =
    prevOv?.solutionCode?.[lang] ?? base.solutionCode[lang];
  const nextStarter = nextOv?.starterCode?.[lang] ?? base.starterCode[lang];
  const nextSolution =
    nextOv?.solutionCode?.[lang] ?? base.solutionCode[lang];

  let replacement: string | undefined;
  if (buf === prevStarter && buf !== nextStarter) replacement = nextStarter;
  else if (buf === prevSolution && buf !== nextSolution)
    replacement = nextSolution;
  if (replacement === undefined) return patch;

  return {
    ...patch,
    codeByProblemAndLanguage: {
      ...prev.codeByProblemAndLanguage,
      [id]: {
        ...(prev.codeByProblemAndLanguage[id] ?? {}),
        [lang]: replacement,
      },
    },
  };
}

export const useStore = create<Store>((set, get) => ({
  selectedProblemId: problems[0].id,
  codeByProblemAndLanguage: {},
  language: "python",
  activeCaseIndex: 0,
  activeTestTab: "testcase",
  customInputByProblem: initialCustomInputs,
  customRunResultByProblem: {},
  runResultsByProblem: {},
  completedProblems: {},
  // `consoleOpen` is the master switch for the whole bottom pane.
  //   true  → test cases visible; console appears below them only
  //           after Execute / Submit produces output.
  //   false → both test cases AND console hidden; editor fills the
  //           full right column.
  // Default is `true` so candidates land with the test cases visible.
  consoleOpen: false,
  sidebarOpen: false,
  cameraVisible: true,
  chatVisible: false,
  problemContentOverrides: {},
  problemCodeOverrides: {},
  isRunning: false,
  submitMessage: null,
  editStartedAt: {},
  autoSolvedByProblem: {},
  splitHorizontal: 0.35, // left (problem) gets 35% by default — matches the visual narrow proportions
  splitVertical: 0.62, // editor gets 62% of the right column's height

  selectProblem: (id) =>
    set({
      selectedProblemId: id,
      activeCaseIndex: 0,
      activeTestTab: "testcase",
      submitMessage: null,
    }),

  setCode: (id, code) =>
    set((s) => {
      const lang = s.language;
      const existing = s.codeByProblemAndLanguage[id] ?? {};
      // Stamp first-edit time the first time we see non-trivial input
      // for this (problem, language). Don't reset on every keystroke.
      const startStamp = s.editStartedAt[id]?.[lang];
      const nextStarted =
        startStamp === undefined
          ? {
              ...s.editStartedAt,
              [id]: { ...(s.editStartedAt[id] ?? {}), [lang]: Date.now() },
            }
          : s.editStartedAt;
      return {
        codeByProblemAndLanguage: {
          ...s.codeByProblemAndLanguage,
          [id]: { ...existing, [lang]: code },
        },
        editStartedAt: nextStarted,
      };
    }),

  setLanguage: (lang) => set({ language: lang }),
  setActiveCase: (idx) => set({ activeCaseIndex: idx }),
  setActiveTestTab: (tab) => set({ activeTestTab: tab }),

  setCustomInput: (id, text) =>
    set((s) => ({
      customInputByProblem: { ...s.customInputByProblem, [id]: text },
    })),

  setCustomRunResult: (id, r) =>
    set((s) => ({
      customRunResultByProblem: { ...s.customRunResultByProblem, [id]: r },
    })),

  setRunResults: (id, results) =>
    set((s) => ({
      runResultsByProblem: { ...s.runResultsByProblem, [id]: results },
    })),

  markCompleted: (id) =>
    set((s) => ({
      completedProblems: { ...s.completedProblems, [id]: true },
    })),

  setIsRunning: (running) => set({ isRunning: running }),
  toggleConsole: () => set((s) => ({ consoleOpen: !s.consoleOpen })),
  setConsoleOpen: (open) => set({ consoleOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleCamera: () => set((s) => ({ cameraVisible: !s.cameraVisible })),
  toggleChat: () => set((s) => ({ chatVisible: !s.chatVisible })),
  setChatVisible: (open) => set({ chatVisible: open }),
  setProblemContentOverrides: (overrides) =>
    set({ problemContentOverrides: overrides }),
  upsertProblemContentOverride: (id, override) =>
    set((s) => ({
      problemContentOverrides: {
        ...s.problemContentOverrides,
        [id]: override,
      },
    })),
  removeProblemContentOverride: (id) =>
    set((s) => {
      if (!(id in s.problemContentOverrides)) return s;
      const next = { ...s.problemContentOverrides };
      delete next[id];
      return { problemContentOverrides: next };
    }),
  setProblemCodeOverrides: (overrides) =>
    set((s) => syncBufferAfterCodeOverrides(s, { problemCodeOverrides: overrides })),
  upsertProblemCodeOverride: (problemId, language, starter, solution) =>
    set((s) => {
      const cur = s.problemCodeOverrides[problemId] ?? {};
      const nextStarter = { ...(cur.starterCode ?? {}) };
      if (starter !== null) nextStarter[language] = starter;
      else delete nextStarter[language];
      const nextSolution = { ...(cur.solutionCode ?? {}) };
      if (solution !== null) nextSolution[language] = solution;
      else delete nextSolution[language];
      const entry: ProblemCodeOverride = {};
      if (Object.keys(nextStarter).length) entry.starterCode = nextStarter;
      if (Object.keys(nextSolution).length) entry.solutionCode = nextSolution;
      const next = { ...s.problemCodeOverrides };
      if (Object.keys(entry).length) next[problemId] = entry;
      else delete next[problemId];
      return syncBufferAfterCodeOverrides(s, { problemCodeOverrides: next });
    }),
  removeProblemCodeOverride: (problemId, language) =>
    set((s) => {
      const cur = s.problemCodeOverrides[problemId];
      if (!cur) return s;
      const nextStarter = { ...(cur.starterCode ?? {}) };
      delete nextStarter[language];
      const nextSolution = { ...(cur.solutionCode ?? {}) };
      delete nextSolution[language];
      const entry: ProblemCodeOverride = {};
      if (Object.keys(nextStarter).length) entry.starterCode = nextStarter;
      if (Object.keys(nextSolution).length) entry.solutionCode = nextSolution;
      const next = { ...s.problemCodeOverrides };
      if (Object.keys(entry).length) next[problemId] = entry;
      else delete next[problemId];
      return syncBufferAfterCodeOverrides(s, { problemCodeOverrides: next });
    }),
  setSubmitMessage: (msg) => set({ submitMessage: msg }),

  ensureEditStart: (id, lang) => {
    const s = get();
    if (s.editStartedAt[id]?.[lang] !== undefined) return;
    if (s.autoSolvedByProblem[id]?.[lang]) return;
    set({
      editStartedAt: {
        ...s.editStartedAt,
        [id]: { ...(s.editStartedAt[id] ?? {}), [lang]: Date.now() },
      },
    });
  },

  triggerAutoSolve: (id, lang) => {
    const s = get();
    // Use the merged problem so code overrides from `problem_code`
    // are honored — auto-solve drops the live reference solution if
    // an editor has uploaded one, otherwise the hardcoded fallback.
    const p = getProblemById(
      id,
      s.problemContentOverrides,
      s.problemCodeOverrides,
    );
    if (!p) return;
    const solution = p.solutionCode[lang];
    set({
      codeByProblemAndLanguage: {
        ...s.codeByProblemAndLanguage,
        [id]: {
          ...(s.codeByProblemAndLanguage[id] ?? {}),
          [lang]: solution,
        },
      },
      autoSolvedByProblem: {
        ...s.autoSolvedByProblem,
        [id]: { ...(s.autoSolvedByProblem[id] ?? {}), [lang]: true },
      },
    });
  },

  setSplitHorizontal: (v) =>
    set({ splitHorizontal: Math.min(0.8, Math.max(0.2, v)) }),
  setSplitVertical: (v) =>
    set({ splitVertical: Math.min(0.85, Math.max(0.25, v)) }),
}));

/* ------------------------------------------------------------------ */
/*  Selectors                                                          */
/* ------------------------------------------------------------------ */

/** Pull the editor text for the currently-selected (problem, language).
 *  Falls back to the starter template for the language if no buffer
 *  exists yet — and the starter respects any `problem_code` override
 *  the editor has uploaded for that (problem, language) pair. */
export function selectCurrentCode(s: {
  selectedProblemId: string;
  language: Language;
  codeByProblemAndLanguage: Record<string, Partial<Record<Language, string>>>;
  problemContentOverrides: Record<string, ProblemContentOverride>;
  problemCodeOverrides: Record<string, ProblemCodeOverride>;
}): string {
  const buf = s.codeByProblemAndLanguage[s.selectedProblemId]?.[s.language];
  if (buf !== undefined) return buf;
  const p = getProblemById(
    s.selectedProblemId,
    s.problemContentOverrides,
    s.problemCodeOverrides,
  );
  return p?.starterCode[s.language] ?? "";
}
