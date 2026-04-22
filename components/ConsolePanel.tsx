"use client";

/**
 * Console panel — stacked BELOW the TestCasePanel inside the bottom
 * frame of the right column, visible only when `consoleOpen` is true
 * AND there's run output to display.
 *
 * Styled like a HackerRank / LeetCode assessment console:
 *   - Big summary banner at the top ("All 3 test cases passed ✓").
 *   - Each case on its own row with a green tick / red cross /
 *     amber warning, timing, and the actual stdout.
 *   - Custom Input run rendered at the bottom in its own block.
 *
 * Execute / Submit and the progress counter live on the TestCasePanel
 * above; this panel is intentionally slim so the two framed cards
 * read as header-over-console without duplicated actions.
 */

import { useStore } from "@/store/useStore";
import clsx from "clsx";

export function ConsolePanel() {
  const selectedId = useStore((s) => s.selectedProblemId);
  const runResults = useStore(
    (s) => s.runResultsByProblem[selectedId] ?? []
  );
  const customResult = useStore(
    (s) => s.customRunResultByProblem[selectedId]
  );
  const toggleConsole = useStore((s) => s.toggleConsole);

  const nothingYet = runResults.length === 0 && !customResult;

  // Never render the console when there's nothing to show — page.tsx
  // controls visibility via `consoleOpen`, but we also guard here so a
  // stale toggle never produces an empty-frame flash.
  if (nothingYet) return null;

  // Summary stats across all sample runs.
  const total = runResults.length;
  const passedCount = runResults.filter((r) => r.passed === true).length;
  const failedCount = runResults.filter((r) => r.passed === false).length;
  const erroredCount = runResults.filter((r) => !!r.error).length;
  const allPassed = total > 0 && passedCount === total && erroredCount === 0;
  const hasRun = total > 0;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-panelBorder bg-white px-4 h-8 shrink-0">
        <div className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
          Console
        </div>
        <button
          onClick={() => toggleConsole()}
          className="text-[11px] text-gray-500 hover:text-gray-800 inline-flex items-center gap-1"
          title="Hide the console (test cases stay visible)"
        >
          Hide <span>✕</span>
        </button>
      </div>

      {/* Summary banner — big, prominent, and colored based on outcome.
          Mirrors the "All tests passed" banner common on HackerRank /
          LeetCode / Infosys Springboard. */}
      {hasRun && (
        <div
          className={clsx(
            "shrink-0 flex items-center gap-2 px-4 py-2 border-b border-panelBorder",
            allPassed
              ? "bg-green-50 text-green-800"
              : erroredCount > 0
              ? "bg-red-50 text-red-800"
              : "bg-amber-50 text-amber-800"
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

      {/* Per-case rows */}
      <div className="flex-1 min-h-0 overflow-auto thin-scroll bg-white text-[12px] text-gray-800 px-3 py-2">
        {runResults.map((r) => {
          const isPass = r.passed === true && !r.error;
          const isFail = r.passed === false && !r.error;
          return (
            <div
              key={`s-${r.caseIndex}`}
              className={clsx(
                "mb-2 rounded border px-3 py-2 flex items-start gap-3",
                isPass
                  ? "border-green-200 bg-green-50/60"
                  : isFail
                  ? "border-amber-200 bg-amber-50/60"
                  : r.error
                  ? "border-red-200 bg-red-50/60"
                  : "border-panelBorder bg-gray-50"
              )}
            >
              {/* Status dot: green tick / amber cross / red "!" */}
              <span
                className={clsx(
                  "mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[12px] font-bold text-white",
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
                  <pre className="mt-1 font-mono text-[12px] text-gray-900 whitespace-pre-wrap break-all">
                    {r.actual || "(no output)"}
                  </pre>
                )}
              </div>
            </div>
          );
        })}

        {customResult && (
          <div className="mt-2 pt-2 border-t border-panelBorder">
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
      </div>
    </div>
  );
}
