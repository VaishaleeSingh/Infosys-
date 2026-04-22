"use client";

/**
 * Bottom test case panel (re-built to match the real Infosys layout
 * visible in the later screenshots).
 *
 * Structure:
 *
 *   ┌── Test case ──── Custom Input ──── Result ────────────┐
 *   │                                                       │
 *   │  [ Case 1 ] [ Case 2 ] [ Case 3 ]                     │
 *   │                                                       │
 *   │  Input                       Expected output          │
 *   │  ┌───────────────────┐       ┌───────────────────┐    │
 *   │  │ 4                 │       │ 4                 │    │
 *   │  │ 5                 │       │                   │    │
 *   │  │ 5 5               │       │                   │    │
 *   │  └───────────────────┘       └───────────────────┘    │
 *   │                                                       │
 *   │                              [ Execute ]  [ Submit ]  │
 *   ├───────────────────────────────────────────────────────┤
 *   │ Toggle Console ∨                          9/20        │
 *   └───────────────────────────────────────────────────────┘
 *
 * Top tabs:
 *   - "Test case": sample cases with Input + Expected Output side-by-side.
 *   - "Custom Input": textarea for the candidate's own stdin.
 *   - "Result": after Execute/Submit, shows per-case pass/fail + timings.
 *
 * Execute runs only the currently-focused case (Test case tab → current
 * Case N; Custom Input tab → the custom text). Submit runs ALL samples
 * and, on full pass, marks the problem completed (tick appears in the
 * sidebar and the progress counter bumps).
 */

import { useStore, type RunResult } from "@/store/useStore";
import { getProblemById } from "@/lib/problems";
import clsx from "clsx";

export function TestCasePanel() {
  const selectedId = useStore((s) => s.selectedProblemId);
  const activeIdx = useStore((s) => s.activeCaseIndex);
  const setActive = useStore((s) => s.setActiveCase);
  const activeTab = useStore((s) => s.activeTestTab);
  const setActiveTab = useStore((s) => s.setActiveTestTab);
  const runResults = useStore((s) => s.runResultsByProblem[selectedId] ?? []);
  const customInput = useStore(
    (s) => s.customInputByProblem[selectedId] ?? ""
  );
  const setCustomInput = useStore((s) => s.setCustomInput);
  const customResult = useStore(
    (s) => s.customRunResultByProblem[selectedId]
  );
  const submitMsg = useStore((s) => s.submitMessage);

  const problem = getProblemById(selectedId);
  if (!problem) return null;

  const activeSample = problem.samples[activeIdx];
  const activeResult = runResults.find((r) => r.caseIndex === activeIdx);

  return (
    <div className="h-full bg-white flex flex-col min-h-0">
      {/* Top tabs: Test case | Custom Input | Result */}
      <div className="shrink-0 flex items-center border-b border-panelBorder bg-white">
        <TopTab
          label="Test case"
          active={activeTab === "testcase"}
          onClick={() => setActiveTab("testcase")}
        />
        <TopTab
          label="Custom Input"
          active={activeTab === "custom"}
          onClick={() => setActiveTab("custom")}
        />
        <TopTab
          label="Result"
          active={activeTab === "result"}
          onClick={() => setActiveTab("result")}
          badge={
            runResults.length > 0
              ? `${runResults.filter((r) => r.passed === true).length}/${runResults.length}`
              : undefined
          }
        />
      </div>

      {/* Body — switches by top tab. Scrollable so the action row and
          footer below never get clipped by the parent frame. */}
      <div className="flex-1 min-h-0 overflow-auto thin-scroll px-4 py-3">
        {activeTab === "testcase" && (
          <div>
            {/* Case pills */}
            <div className="flex items-center gap-2 mb-3">
              {[0, 1, 2].map((i) => {
                const disabled = !problem.samples[i];
                const isActive = i === activeIdx;
                return (
                  <button
                    key={i}
                    disabled={disabled}
                    onClick={() => setActive(i)}
                    className={clsx(
                      "px-3 h-7 text-[12px] rounded border transition-colors",
                      isActive
                        ? "bg-infy-500 text-white border-infy-600"
                        : "bg-white text-gray-700 border-panelBorder hover:bg-gray-50",
                      disabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    Case {i + 1}
                  </button>
                );
              })}
              {activeResult && (
                <span
                  className={clsx(
                    "ml-auto text-[12px] px-2 py-0.5 rounded font-semibold",
                    activeResult.error
                      ? "bg-red-100 text-red-700"
                      : activeResult.passed === true
                      ? "bg-green-100 text-green-700"
                      : activeResult.passed === false
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-700"
                  )}
                >
                  {activeResult.error
                    ? "Error"
                    : activeResult.passed === true
                    ? `Passed · ${activeResult.timeMs.toFixed(0)} ms`
                    : activeResult.passed === false
                    ? "Wrong Answer"
                    : `Ran · ${activeResult.timeMs.toFixed(0)} ms`}
                </span>
              )}
            </div>

            {/* Side-by-side: Input / Expected Output */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[12px] text-gray-600 mb-1">Input</div>
                <pre className="sample-box max-h-32 overflow-auto thin-scroll">
{activeSample ? activeSample.input : ""}
                </pre>
              </div>
              <div>
                <div className="text-[12px] text-gray-600 mb-1">
                  Expected output
                </div>
                <pre className="sample-box max-h-32 overflow-auto thin-scroll">
{activeSample?.output ?? ""}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === "custom" && (
          <div>
            <div className="text-[12px] text-gray-600 mb-1">
              Custom Input (stdin)
            </div>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(selectedId, e.target.value)}
              className="w-full h-28 resize-none rounded border border-panelBorder bg-[#F4F5F7] font-mono text-[13px] p-2 focus:outline-none focus:border-infy-400"
              placeholder="Type or paste your own input here…"
            />
            {customResult && (
              <div className="mt-3">
                <div className="text-[12px] text-gray-600 mb-1">
                  Output{" "}
                  <span className="text-gray-400">
                    · {customResult.timeMs.toFixed(0)} ms
                  </span>
                </div>
                <pre className="sample-box max-h-28 overflow-auto thin-scroll">
{customResult.error ?? customResult.actual ?? ""}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === "result" && (
          <ResultView
            runResults={runResults}
            customResult={customResult}
            submitMsg={submitMsg}
          />
        )}
      </div>

      {/* Execute / Submit and the N/total progress counter now live on
          a persistent ActionBar in the page layout — see app/page.tsx.
          Keeping them there means they stay visible on every tab and
          even when Toggle Console is hiding this whole pane. */}
    </div>
  );
}

/**
 * Result tab body — now merges the classic "per-case verdict" list
 * with the HackerRank-style console output into a SINGLE scrollable
 * view. Parent body already has overflow-auto, so this component just
 * stacks sections vertically and lets the parent handle scrolling.
 *
 * Layout (top → bottom):
 *   1. Big summary banner ("All N test cases passed ✓")
 *   2. Per-case verdict cards (tick / cross / error + timing + Your Output)
 *   3. Custom Input run (if present) with its stdout
 *   4. Submit message (success / partial-pass)
 */
function ResultView({
  runResults,
  customResult,
  submitMsg,
}: {
  runResults: RunResult[];
  customResult: RunResult | undefined;
  submitMsg: string | null;
}) {
  const hasRun = runResults.length > 0;
  const nothingYet = !hasRun && !customResult && !submitMsg;

  if (nothingYet) {
    return (
      <div className="text-[12px] text-gray-500">
        Run your code to see results here.
      </div>
    );
  }

  const total = runResults.length;
  const passedCount = runResults.filter((r) => r.passed === true).length;
  const erroredCount = runResults.filter((r) => !!r.error).length;
  const allPassed = total > 0 && passedCount === total && erroredCount === 0;

  return (
    <div className="space-y-3">
      {/* Summary banner */}
      {hasRun && (
        <div
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded border",
            allPassed
              ? "bg-green-50 text-green-800 border-green-200"
              : erroredCount > 0
              ? "bg-red-50 text-red-800 border-red-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          )}
        >
          <span
            className={clsx(
              "w-5 h-5 rounded-full flex items-center justify-center text-white text-[12px] font-bold",
              allPassed
                ? "bg-green-500"
                : erroredCount > 0
                ? "bg-red-500"
                : "bg-amber-500"
            )}
          >
            {allPassed ? "✓" : erroredCount > 0 ? "!" : "✗"}
          </span>
          <div className="text-[13px] font-semibold">
            {allPassed
              ? `All ${total} test case${total === 1 ? "" : "s"} passed`
              : `${passedCount}/${total} test case${total === 1 ? "" : "s"} passed`}
          </div>
          <div className="ml-auto text-[11px] font-mono text-gray-500">
            {runResults
              .reduce((sum, r) => sum + r.timeMs, 0)
              .toFixed(0)}{" "}
            ms total
          </div>
        </div>
      )}

      {/* Per-case verdict cards */}
      {hasRun && (
        <div className="space-y-2">
          {runResults.map((r) => {
            const isPass = r.passed === true && !r.error;
            const isFail = r.passed === false && !r.error;
            return (
              <div
                key={r.caseIndex}
                className={clsx(
                  "rounded border px-3 py-2 flex items-start gap-3",
                  isPass
                    ? "border-green-200 bg-green-50/60"
                    : isFail
                    ? "border-amber-200 bg-amber-50/60"
                    : r.error
                    ? "border-red-200 bg-red-50/60"
                    : "border-panelBorder bg-gray-50"
                )}
              >
                <span
                  className={clsx(
                    "mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold text-white",
                    isPass
                      ? "bg-green-500"
                      : isFail
                      ? "bg-amber-500"
                      : r.error
                      ? "bg-red-500"
                      : "bg-gray-400"
                  )}
                >
                  {isPass ? "✓" : isFail ? "✗" : r.error ? "!" : "–"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] font-semibold text-gray-800">
                      Test Case {r.caseIndex + 1}
                    </span>
                    <span
                      className={clsx(
                        "text-[11px] font-semibold uppercase tracking-wider",
                        isPass
                          ? "text-green-700"
                          : isFail
                          ? "text-amber-700"
                          : r.error
                          ? "text-red-700"
                          : "text-gray-600"
                      )}
                    >
                      {isPass
                        ? "Passed"
                        : isFail
                        ? "Wrong Answer"
                        : r.error
                        ? "Runtime Error"
                        : "Ran"}
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono ml-auto">
                      {r.timeMs.toFixed(0)} ms
                    </span>
                  </div>

                  {r.error ? (
                    <pre className="mt-1 font-mono text-[12px] text-red-700 whitespace-pre-wrap break-all">
                      {r.error}
                    </pre>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 mt-1 text-[12px]">
                      <div>
                        <div className="text-gray-500 text-[11px]">
                          Expected
                        </div>
                        <pre className="font-mono whitespace-pre-wrap break-all text-gray-900">
                          {r.expected ?? "—"}
                        </pre>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[11px]">
                          Your Output
                        </div>
                        <pre className="font-mono whitespace-pre-wrap break-all text-gray-900">
                          {r.actual || "(empty)"}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Input stdout — rendered below the sample verdicts so a
          user who ran both gets the full picture in one scroll. */}
      {customResult && (
        <div className="rounded border border-panelBorder bg-gray-50 px-3 py-2">
          <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Custom Input
            <span className="ml-2 text-[11px] font-mono text-gray-500 normal-case">
              {customResult.timeMs.toFixed(0)} ms
            </span>
          </div>
          {customResult.error ? (
            <pre className="font-mono text-[12px] text-red-700 whitespace-pre-wrap break-all">
              {customResult.error}
            </pre>
          ) : (
            <pre className="font-mono text-[12px] text-gray-900 whitespace-pre-wrap break-all">
              {customResult.actual || "(no output)"}
            </pre>
          )}
        </div>
      )}

      {/* Submit message */}
      {submitMsg && (
        <div
          className={clsx(
            "text-[12px] rounded px-3 py-2 border",
            submitMsg.startsWith("Submitted successfully")
              ? "text-green-700 bg-green-50 border-green-200"
              : "text-amber-700 bg-amber-50 border-amber-200"
          )}
        >
          {submitMsg}
        </div>
      )}
    </div>
  );
}

/** Top-level tab button. Active state uses the Infosys teal underline. */
function TopTab({
  label,
  active,
  onClick,
  badge,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative h-9 px-5 text-[13px] font-medium transition-colors",
        active
          ? "text-infy-700"
          : "text-gray-600 hover:text-gray-800"
      )}
    >
      <span>{label}</span>
      {badge && (
        <span className="ml-2 text-[10px] font-bold text-infy-700 bg-infy-50 border border-infy-200 rounded px-1.5 py-px align-middle">
          {badge}
        </span>
      )}
      <span
        className={clsx(
          "absolute left-2 right-2 bottom-0 h-[2px] transition-colors",
          active ? "bg-infy-500" : "bg-transparent"
        )}
      />
    </button>
  );
}
