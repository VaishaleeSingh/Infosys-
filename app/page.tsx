"use client";

/**
 * Top-level page — composes everything into the Infosys two-column
 * Coding Hands-on layout:
 *
 *   ┌──────────────────────────────────────────────────────────────────────┐
 *   │  Header (breadcrumb + progress + user)                               │
 *   ├────┬──────────────────────────────┬──────────────────────────────────┤
 *   │    │                              │  [ Python 3 ▾ ]                  │
 *   │ ▒  │   Problem Description        │  Code Editor (Monaco, dark)      │
 *   │ ▒  │   (scrollable)               │                                  │
 *   │ ▒  │                              │  ── Toggle Console ──            │
 *   │ ▒  │                              ├──────────────────────────────────┤
 *   │    │                              │  Test case | Custom | Result     │
 *   │    │                              │  [ Execute ] [ Submit ]   9/20   │
 *   └────┴──────────────────────────────┴──────────────────────────────────┘
 *
 * Both the vertical split (Problem | Code+Test) and the horizontal split
 * (Code Editor / Test Panel) are **draggable** — see `<Splitter />`.
 * The positions are persisted in the store so resizing survives problem
 * switches within a session.
 *
 * Execute / Submit semantics:
 *   - Execute on the "Test case" tab → runs the currently-selected sample.
 *   - Execute on the "Custom Input" tab → runs against the textarea input.
 *   - Submit (either tab) → runs ALL samples, switches to the "Result"
 *     tab, and on full pass marks the problem as completed.
 *
 * Auto-solve: `useAutoSolve()` watches the currently-selected (problem,
 * language) pair. After AUTO_SOLVE_DELAY_MS (5 min) of elapsed time since
 * the candidate first typed, the canonical reference solution is dropped
 * into the editor. Subsequent Execute/Submit short-circuits to a
 * guaranteed pass via `lib/runner#runCode`.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { ProblemSelector } from "@/components/ProblemSelector";
import { ProblemDescription } from "@/components/ProblemDescription";
import { CodeEditor } from "@/components/CodeEditor";
import { TestCasePanel } from "@/components/TestCasePanel";
import { Splitter } from "@/components/Splitter";
import { useAutoSolve } from "@/components/useAutoSolve";
import {
  useStore,
  selectCurrentCode,
  type RunResult,
  type Language,
} from "@/store/useStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getProblemById, problems } from "@/lib/problems";
import { runCode } from "@/lib/runner";
import clsx from "clsx";

export default function Page() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const termsAccepted = useAuthStore((s) => s.termsAccepted);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
    else if (!termsAccepted) router.replace("/terms");
  }, [hydrated, user, termsAccepted, router]);

  // 5-minute reference-solution timer — lives here so it's always mounted
  // during an active coding session.
  useAutoSolve();

  // Splitter positions from the store.
  const splitH = useStore((s) => s.splitHorizontal);
  const splitV = useStore((s) => s.splitVertical);
  const setSplitH = useStore((s) => s.setSplitHorizontal);
  const setSplitV = useStore((s) => s.setSplitVertical);
  // Controls whether the bottom-right frame shows test cases or the console.
  const consoleOpen = useStore((s) => s.consoleOpen);

  // Preferred-language picker — shown once when the candidate first
  // lands on the workspace. Save commits the choice into the global
  // store and dismisses the modal. The header dropdown still lets them
  // change it at any time afterwards.
  const setLanguage = useStore((s) => s.setLanguage);
  const currentLanguage = useStore((s) => s.language);
  const [showLangModal, setShowLangModal] = useState(false);
  const [pendingLang, setPendingLang] = useState<Language>(currentLanguage);
  useEffect(() => {
    if (!hydrated || !user || !termsAccepted) return;
    setShowLangModal(true);
  }, [hydrated, user, termsAccepted]);

  /** Run ALL sample cases for the selected problem. */
  const runAllSamples = useCallback(async (): Promise<RunResult[]> => {
    const state = useStore.getState();
    const problem = getProblemById(state.selectedProblemId);
    if (!problem) return [];
    const code = selectCurrentCode(state);
    const autoSolved =
      !!state.autoSolvedByProblem[problem.id]?.[state.language];

    state.setIsRunning(true);
    state.setSubmitMessage(null);

    const results: RunResult[] = [];
    for (let i = 0; i < problem.samples.length; i++) {
      const s = problem.samples[i];
      try {
        const outcome = await runCode({
          code,
          stdin: s.input,
          language: state.language,
          expected: s.output,
          autoSolved,
        });
        const actual = (outcome.output ?? "").replace(/\s+$/, "");
        const expected = s.output?.replace(/\s+$/, "");
        results.push({
          caseIndex: i,
          passed: outcome.error
            ? false
            : expected !== undefined
            ? actual === expected
            : null,
          actual,
          expected,
          error: outcome.error,
          timeMs: outcome.timeMs,
        });
      } catch (e: unknown) {
        results.push({
          caseIndex: i,
          passed: false,
          actual: "",
          error: e instanceof Error ? e.message : String(e),
          timeMs: 0,
        });
      }
    }

    state.setRunResults(problem.id, results);
    state.setIsRunning(false);
    return results;
  }, []);

  /** Run just the currently-selected sample. */
  const runSingleSample = useCallback(async () => {
    const state = useStore.getState();
    const problem = getProblemById(state.selectedProblemId);
    if (!problem) return;
    const idx = state.activeCaseIndex;
    const s = problem.samples[idx];
    if (!s) return;
    const code = selectCurrentCode(state);
    const autoSolved =
      !!state.autoSolvedByProblem[problem.id]?.[state.language];

    state.setIsRunning(true);
    state.setSubmitMessage(null);
    const outcome = await runCode({
      code,
      stdin: s.input,
      language: state.language,
      expected: s.output,
      autoSolved,
    });
    const actual = (outcome.output ?? "").replace(/\s+$/, "");
    const expected = s.output?.replace(/\s+$/, "");
    const newResult: RunResult = {
      caseIndex: idx,
      passed: outcome.error
        ? false
        : expected !== undefined
        ? actual === expected
        : null,
      actual,
      expected,
      error: outcome.error,
      timeMs: outcome.timeMs,
    };

    // Merge into any existing results so the Result tab stays coherent.
    const prev = state.runResultsByProblem[problem.id] ?? [];
    const next = prev
      .filter((r) => r.caseIndex !== idx)
      .concat(newResult)
      .sort((a, b) => a.caseIndex - b.caseIndex);
    state.setRunResults(problem.id, next);
    state.setIsRunning(false);
  }, []);

  /** Run against the custom input textarea. */
  const runCustom = useCallback(async () => {
    const state = useStore.getState();
    const problem = getProblemById(state.selectedProblemId);
    if (!problem) return;
    const code = selectCurrentCode(state);
    const stdin = state.customInputByProblem[problem.id] ?? "";
    const autoSolved =
      !!state.autoSolvedByProblem[problem.id]?.[state.language];

    state.setIsRunning(true);
    // On auto-solve, run the canonical Python solution against the
    // candidate's custom stdin so the output is meaningful regardless
    // of which display language is active.
    const outcome = autoSolved
      ? await runCode({
          code: problem.solutionCode.python,
          stdin,
          language: "python",
          autoSolved: false,
        })
      : await runCode({
          code,
          stdin,
          language: state.language,
          autoSolved: false,
        });
    state.setCustomRunResult(problem.id, {
      caseIndex: -1,
      passed: null,
      actual: (outcome.output ?? "").replace(/\s+$/, ""),
      error: outcome.error,
      timeMs: outcome.timeMs,
    });
    state.setIsRunning(false);
  }, []);

  /** Route Execute based on the active top-tab.
   *  - Test case / Result tab → runs ALL samples so the candidate sees
   *    every sample pass (or fail) at once, switches to the Result tab,
   *    and pops the console open below the test cases.
   *  - Custom Input tab → runs against the custom stdin; also pops the
   *    console open so the output is visible below. */
  const handleExecute = useCallback(async () => {
    const state = useStore.getState();
    if (state.activeTestTab === "custom") {
      await runCustom();
      useStore.getState().setActiveTestTab("result");
      return;
    }

    // Execute runs the visible sample cases and pads the Result tab
    // out to 3 rows so the table always shows Case 1 / Case 2 / Case 3
    // in the Result view (matches the reference screenshot).
    state.setRunResults(state.selectedProblemId, []);
    const visible = await runAllSamples();
    const allPass =
      visible.length > 0 && visible.every((r) => r.passed === true);

    const VISIBLE_CASES = 3;
    const padded = [...visible];
    for (let i = visible.length; i < VISIBLE_CASES; i++) {
      padded.push({
        caseIndex: i,
        passed: allPass,
        actual: "",
        expected: "",
        error: undefined,
        timeMs: 4 + Math.random() * 12,
      });
    }
    useStore.getState().setRunResults(state.selectedProblemId, padded);
    useStore.getState().setActiveTestTab("result");
  }, [runCustom, runAllSamples]);

  const handleSubmit = useCallback(async () => {
    const visible = await runAllSamples();
    const state = useStore.getState();
    const allVisiblePass =
      visible.length > 0 && visible.every((r) => r.passed === true);

    // Submit should display ALL cases including hidden ones — typical
    // assessment platforms show 12 cases total. Pad the visible
    // results with synthetic "hidden" cases so the Result tab pill
    // grid matches the reference (Case 1..12). If every visible case
    // passed, the hidden cases pass too; otherwise they're marked
    // failed.
    const TOTAL_CASES = 12;
    const padded = [...visible];
    for (let i = visible.length; i < TOTAL_CASES; i++) {
      padded.push({
        caseIndex: i,
        passed: allVisiblePass,
        actual: "",
        expected: "",
        error: undefined,
        timeMs: 4 + Math.random() * 12,
      });
    }
    state.setRunResults(state.selectedProblemId, padded);

    state.setSubmitMessage(
      allVisiblePass
        ? "Submitted successfully! All sample cases passed."
        : "Submission recorded. Some sample cases did not pass — review your code."
    );
    if (allVisiblePass) {
      state.markCompleted(state.selectedProblemId);
    }
    state.setActiveTestTab("result");
  }, [runAllSamples]);

  // Auth gate — loading, signed-out, or pending T&C.
  if (!hydrated || !user || !termsAccepted) {
    return (
      <div className="h-screen flex items-center justify-center bg-white text-gray-500 text-sm">
        {!hydrated
          ? "Loading…"
          : !user
          ? "Redirecting to sign in…"
          : "Redirecting to Terms & Conditions…"}
      </div>
    );
  }

  const leftPct = (splitH * 100).toFixed(2) + "%";
  const rightPct = ((1 - splitH) * 100).toFixed(2) + "%";
  const topPct = (splitV * 100).toFixed(2) + "%";
  const bottomPct = ((1 - splitV) * 100).toFixed(2) + "%";

  return (
    <div className="h-screen flex flex-col bg-[#06091F] overflow-x-auto relative">
      <Header />

      <div className="flex-1 flex min-h-0 min-w-[860px]">
        <ProblemSelector />

        {/* Main two-column area — the vertical splitter sits between
            ProblemDescription and the CodeEditor/TestCasePanel stack. */}
        <div className="flex-1 flex min-h-0" style={{ minWidth: 0 }}>
          {/* LEFT: problem description. `min-w-0` on this flex child
              stops it from forcing a horizontal scrollbar when the
              problem text or sample boxes are wider than the left
              column — the description handles its own wrapping/
              scrolling internally. */}
          <div
            className="min-h-0 min-w-0 overflow-hidden flex"
            style={{ width: leftPct }}
          >
            <div className="flex-1 min-h-0 min-w-0 overflow-hidden bg-white border border-panelBorder shadow-panel rounded-md m-1">
              <ProblemDescription />
            </div>
          </div>

          {/* Vertical splitter — drag to resize the problem panel
              vs the code editor area. Visually a thin dark navy strip
              with three dots in the middle (matches the horizontal
              splitter style). */}
          <Splitter
            orientation="vertical"
            title="Drag to resize problem / code panes"
            onDrag={setSplitH}
          />

          {/* RIGHT: editor (always) + an optional bottom pane (test
              cases + console) controlled by Toggle Console + a
              PERSISTENT action bar pinned to the bottom corner that
              stays visible no matter which tab is open and whether
              the console pane is shown or hidden. */}
          <div
            className="flex flex-col min-h-0 min-w-0"
            style={{ width: rightPct }}
          >
            {/* Inner splittable area — editor + (optional) test cases
                frame. The action bar lives OUTSIDE this so it is never
                covered by the splitter or tabs. */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* FRAME 1 — Code editor card (always visible, top) */}
              <div
                className="min-h-0 overflow-hidden bg-white border border-panelBorder shadow-panel rounded-md m-1"
                style={{ height: `calc(${topPct} - 12px)`, marginBottom: 0 }}
              >
                <CodeEditor />
              </div>

              <Splitter
                orientation="horizontal"
                title="Drag to resize editor / test panes"
                onDrag={setSplitV}
              />

              {/* Bottom region — Test cases panel is ALWAYS visible.
                  Toggle Console is a separate concept that opens an
                  optional console area BELOW this card (see further
                  down). */}
              <div
                className="min-h-0 m-1 flex-1"
                style={{ marginTop: 0 }}
              >
                <div className="h-full min-h-0 overflow-hidden bg-white border border-panelBorder shadow-panel rounded-md flex flex-col">
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <TestCasePanel />
                  </div>
                  {/* Above the Toggle Console row:
                      - Before Submit: a black partition line
                      - After Submit (>=12 results): a decorative teal
                        "scrollbar" strip. Both are purely visual. */}
                  <DividerOrScrollbar />
                  <ActionBar
                    onExecute={handleExecute}
                    onSubmit={handleSubmit}
                  />
                </div>
              </div>

              {/* Optional console output area — toggled by the Toggle
                  Console button in the action bar above. Independent
                  from the test case tabs; just shows the latest stdout /
                  stderr stream from the most recent Execute / Submit. */}
              {consoleOpen && (
                <ConsolePane onClose={() => useStore.getState().setConsoleOpen(false)} />
              )}
            </div>
          </div>
        </div>
      </div>

      <StatusBar />

      <PreferredLanguageModal
        open={showLangModal}
        value={pendingLang}
        onChange={setPendingLang}
        onSave={() => {
          setLanguage(pendingLang);
          setShowLangModal(false);
        }}
      />
    </div>
  );
}

/**
 * Persistent action bar pinned to the bottom-right corner of the
 * editor column. It is ALWAYS visible — regardless of which tab is
 * active in the test panel, and regardless of whether the console
 * pane is toggled open or closed. The bar hosts:
 *   - "Toggle Console" on the left (flips consoleOpen)
 *   - "Execute" (teal) + "Submit" (red) on the right
 *   - N/total problems-solved counter on the far right
 */
function ActionBar({
  onExecute,
  onSubmit,
}: {
  onExecute: () => void;
  onSubmit: () => void;
}) {
  const isRunning = useStore((s) => s.isRunning);
  const consoleOpen = useStore((s) => s.consoleOpen);
  const toggleConsole = useStore((s) => s.toggleConsole);
  const completedProblems = useStore((s) => s.completedProblems);
  const completedCount = Object.keys(completedProblems).length;
  const totalCount = problems.length;

  return (
    <div className="shrink-0 h-11 bg-white flex items-center gap-2 px-3">
      <button
        onClick={() => toggleConsole()}
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0B1B4A] hover:text-[#0B1B4A]/80 transition-colors"
        title={
          consoleOpen
            ? "Hide the console pane"
            : "Show the console pane"
        }
      >
        Toggle Console
        <svg
          viewBox="0 0 16 16"
          className={clsx(
            "w-3 h-3 transition-transform",
            consoleOpen && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>

      <div className="ml-auto" />

      <button
        onClick={onExecute}
        disabled={isRunning}
        className={clsx(
          "h-8 px-5 rounded-md text-[13px] font-semibold text-[#0B1B4A] bg-[#26D9B5] hover:bg-[#3BE6C4] transition-colors",
          isRunning && "opacity-60 cursor-not-allowed"
        )}
      >
        {isRunning ? "Running..." : "Execute"}
      </button>
      <button
        onClick={onSubmit}
        disabled={isRunning}
        className={clsx(
          "h-8 px-5 rounded-md text-[13px] font-semibold text-white bg-[#FF5C5C] hover:bg-[#E74848] transition-colors",
          isRunning && "opacity-60 cursor-not-allowed"
        )}
      >
        Submit
      </button>
    </div>
  );
}

/**
 * Preferred-language selection modal.
 *
 * Displayed once when the candidate first lands on the workspace.
 * Lets them pick from Python 3 / Java / C++ / JavaScript and writes
 * the choice into the global store via onSave. The note matches the
 * reference: "You can still change the preferred programming language
 * anytime by using the drop down in editor pane."
 */
function PreferredLanguageModal({
  open,
  value,
  onChange,
  onSave,
}: {
  open: boolean;
  value: Language;
  onChange: (v: Language) => void;
  onSave: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[#0B1B4A] text-[20px] font-bold tracking-tight">
            &lt;/&gt;
          </span>
          <h2 className="text-[18px] font-semibold text-[#0B1B4A]">
            Preferred Language
          </h2>
        </div>
        <p className="text-[13px] text-[#0B1B4A] mb-3">
          Select your preferred programming language
        </p>
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value as Language)}
            className="w-full h-10 px-3 pr-9 rounded-md border border-gray-300 bg-white text-[14px] text-[#0B1B4A] appearance-none focus:outline-none focus:border-[#26D9B5]"
          >
            <option value="python">Python 3</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="javascript">JavaScript</option>
          </select>
          <svg
            viewBox="0 0 16 16"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#0B1B4A] pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="4 6 8 10 12 6" />
          </svg>
        </div>
        <div className="flex items-start gap-2 mt-3 mb-6 text-[12px] text-gray-600">
          <span className="inline-flex w-4 h-4 rounded-full border border-gray-400 items-center justify-center text-[10px] font-semibold text-gray-500 shrink-0 mt-0.5">
            i
          </span>
          <p>
            You can still change the preferred programming language anytime
            by using the drop down in editor pane.
          </p>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSave}
            className="h-10 px-7 rounded-md text-[14px] font-semibold bg-[#26D9B5] text-[#06091F] hover:bg-[#3BE6C4] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Persistent teal status bar across the bottom of the workspace.
 * Shows live pass / fail / flag counts derived from the current
 * problem's last run results — matches the thin teal strip visible
 * at the very bottom of the reference screenshots.
 */
function StatusBar() {
  const selectedId = useStore((s) => s.selectedProblemId);
  const runResults = useStore(
    (s) => s.runResultsByProblem[selectedId] ?? []
  );
  const passed = runResults.filter((r) => r.passed === true && !r.error).length;
  const failed = runResults.filter(
    (r) => r.error || r.passed === false
  ).length;
  const flagged = 0;

  return (
    <div
      className="shrink-0 h-5 mt-2 flex items-center justify-end gap-3 px-3 text-[11px] text-[#06091F] rounded-b-md"
      style={{ backgroundColor: "#26D9B5" }}
    >
      <span className="inline-flex items-center gap-1">
        <svg
          viewBox="0 0 16 16"
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="8" cy="8" r="6.5" />
          <polyline points="5 8.5 7.2 11 11 5.5" />
        </svg>
        {passed}
      </span>
      <span className="inline-flex items-center gap-1">
        <svg
          viewBox="0 0 16 16"
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="8" cy="8" r="6.5" />
          <line x1="5.5" y1="5.5" x2="10.5" y2="10.5" />
          <line x1="10.5" y1="5.5" x2="5.5" y2="10.5" />
        </svg>
        {failed}
      </span>
      <span className="inline-flex items-center gap-1">
        <svg
          viewBox="0 0 16 16"
          className="w-3 h-3"
          fill="currentColor"
          aria-hidden
        >
          <path d="M3.5 2 L3.5 14 L4.5 14 L4.5 9 L12 9 L9.5 5 L12 1 L4.5 1 L4.5 2 Z" />
        </svg>
        {flagged}
      </span>
    </div>
  );
}

/**
 * Optional console output pane — toggled by the Toggle Console button
 * inside the test panel's action bar. This area is INDEPENDENT of the
 * test case tabs; it just shows the latest stdout/stderr captured by
 * the runner.
 */
function ConsolePane({ onClose }: { onClose: () => void }) {
  const selectedId = useStore((s) => s.selectedProblemId);
  const runResults = useStore((s) => s.runResultsByProblem[selectedId] ?? []);
  const customResult = useStore((s) => s.customRunResultByProblem[selectedId]);
  const last = customResult ?? runResults[runResults.length - 1];
  return (
    <div className="m-1.5 mt-0">
      <div className="bg-[#0B1B4A] text-white rounded-md shadow-panel overflow-hidden flex flex-col" style={{ minHeight: 120 }}>
        <div className="flex items-center justify-between px-3 h-8 border-b border-white/10 text-[12px] font-semibold">
          <span>Console</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close console"
            className="text-white/70 hover:text-white"
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <line x1="3.5" y1="3.5" x2="12.5" y2="12.5" />
              <line x1="12.5" y1="3.5" x2="3.5" y2="12.5" />
            </svg>
          </button>
        </div>
        <pre className="flex-1 min-h-0 overflow-auto p-3 text-[12px] font-mono text-white/90 whitespace-pre-wrap">
{last ? (last.error ? last.error : last.actual || "(no output)") : "Run your code to see console output here."}
        </pre>
      </div>
    </div>
  );
}

/**
 * Partition divider that switches between a thin black line (before
 * Submit) and a decorative teal scrollbar strip (after Submit). The
 * teal version is purely visual — it doesn't actually scroll.
 */
function DividerOrScrollbar() {
  const selectedId = useStore((s) => s.selectedProblemId);
  const runResults = useStore(
    (s) => s.runResultsByProblem[selectedId] ?? []
  );
  const submitted = runResults.length >= 12;
  if (!submitted) {
    return (
      <div className="shrink-0 px-0 bg-white">
        <div className="h-px w-full" style={{ background: "#0B1B4A" }} />
      </div>
    );
  }
  return (
    <div className="shrink-0 px-4 py-1.5 bg-white">
      <div className="h-1.5 w-full rounded-full" style={{ background: "#14C9A4" }} />
    </div>
  );
}

