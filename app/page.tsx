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
    state.setConsoleOpen(true); // reveal the console pane
    if (state.activeTestTab === "custom") {
      await runCustom();
    } else {
      await runAllSamples();
      useStore.getState().setActiveTestTab("result");
    }
  }, [runCustom, runAllSamples]);

  const handleSubmit = useCallback(async () => {
    useStore.getState().setConsoleOpen(true); // reveal the console pane
    const results = await runAllSamples();
    const state = useStore.getState();
    const allPass =
      results.length > 0 && results.every((r) => r.passed === true);
    state.setSubmitMessage(
      allPass
        ? "Submitted successfully! All sample cases passed."
        : "Submission recorded. Some sample cases did not pass — review your code."
    );
    if (allPass) {
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
    <div className="h-screen flex flex-col bg-white overflow-x-auto">
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
            className="border-r border-panelBorder min-h-0 min-w-0 overflow-hidden"
            style={{ width: leftPct }}
          >
            <ProblemDescription />
          </div>

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
            className="flex flex-col min-h-0 min-w-0 bg-white"
            style={{ width: rightPct }}
          >
            {/* Inner splittable area — editor + (optional) test cases
                frame. The action bar lives OUTSIDE this so it is never
                covered by the splitter or tabs. */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* FRAME 1 — Code editor card (always visible, top) */}
              <div
                className="min-h-0 overflow-hidden bg-white border border-panelBorder shadow-panel rounded-md m-1.5"
                style={
                  consoleOpen
                    ? { height: `calc(${topPct} - 12px)`, marginBottom: 0 }
                    : { flex: "1 1 0%" }
                }
              >
                <CodeEditor />
              </div>

              {consoleOpen && (
                <>
                  <Splitter
                    orientation="horizontal"
                    title="Drag to resize editor / test panes"
                    onDrag={setSplitV}
                  />

                  {/* Bottom region — a SINGLE scrollable frame that
                      contains the test case tabs AND, after a run, the
                      console verdict panel. Hidden as a whole when
                      Toggle Console is off. */}
                  <div
                    className="min-h-0 m-1.5"
                    style={{
                      height: `calc(${bottomPct} - 12px)`,
                      marginTop: 0,
                    }}
                  >
                    {/* FRAME 2 — Unified test cases + console card */}
                    <div className="h-full min-h-0 overflow-hidden bg-white border border-panelBorder shadow-panel rounded-md">
                      <TestCasePanel />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* PERSISTENT ACTION BAR — always visible in the bottom
                corner of the right column. Holds Toggle Console on the
                left, Execute + Submit on the right, plus the N/total
                progress counter. Visible whether the console pane is
                open or closed, on every tab. */}
            <ActionBar
              onExecute={handleExecute}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
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
    <div className="shrink-0 h-11 border-t border-panelBorder bg-white flex items-center gap-2 px-3">
      <button
        onClick={() => toggleConsole()}
        className={clsx(
          "inline-flex items-center gap-1 text-[12px] transition-colors",
          consoleOpen
            ? "text-infy-700 hover:text-infy-800"
            : "text-gray-700 hover:text-gray-900"
        )}
        title={
          consoleOpen
            ? "Hide the console pane (test cases + output)"
            : "Show the console pane (test cases + output)"
        }
      >
        Toggle Console <span>{consoleOpen ? "∧" : "∨"}</span>
      </button>

      <div
        className="ml-auto text-[11px] text-gray-500 font-mono hidden sm:inline mr-3"
        title={`${completedCount} of ${totalCount} problems solved`}
      >
        {completedCount}/{totalCount}
      </div>

      <button
        onClick={onExecute}
        disabled={isRunning}
        className={clsx(
          "h-8 px-4 rounded text-[12px] font-semibold text-white bg-infy-500 hover:bg-infy-600 border border-infy-600 shadow-sm",
          isRunning && "opacity-60 cursor-not-allowed"
        )}
      >
        {isRunning ? "Running…" : "Execute"}
      </button>
      <button
        onClick={onSubmit}
        disabled={isRunning}
        className={clsx(
          "h-8 px-4 rounded text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 border border-red-600 shadow-sm",
          isRunning && "opacity-60 cursor-not-allowed"
        )}
      >
        Submit
      </button>
    </div>
  );
}
