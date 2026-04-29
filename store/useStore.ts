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
import { problems, type Language } from "@/lib/problems";

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
    const p = problems.find((x) => x.id === id);
    if (!p) return;
    const solution = p.solutionCode[lang];
    const s = get();
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
 *  exists yet. */
export function selectCurrentCode(s: {
  selectedProblemId: string;
  language: Language;
  codeByProblemAndLanguage: Record<string, Partial<Record<Language, string>>>;
}): string {
  const buf = s.codeByProblemAndLanguage[s.selectedProblemId]?.[s.language];
  if (buf !== undefined) return buf;
  const p = problems.find((x) => x.id === s.selectedProblemId);
  return p?.starterCode[s.language] ?? "";
}
