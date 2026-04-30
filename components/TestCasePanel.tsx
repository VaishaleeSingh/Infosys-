"use client";

/**
 * Bottom test case panel — matches the Infosys workspace reference.
 *
 * Tabs:
 *   - Test case   : sample inputs in side-by-side Input + Expected
 *                   Output boxes, with rounded "Case N" pills for
 *                   switching between samples.
 *   - Custom Input: textarea for the candidate's own stdin.
 *   - Result      : two flavours.
 *                     · After Submit (all samples), shows a grid of
 *                       "Case N ✓ / ✗" rounded pills with a legend at
 *                       the bottom (Passed / Failed / Timed Out /
 *                       Error). Errored runs show a red error box.
 *                     · After Execute on Test case or Custom Input,
 *                       shows a table view with Input | Expected
 *                       output | Output | Status columns.
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
  const isRunning = useStore((s) => s.isRunning);
  const overrides = useStore((s) => s.problemContentOverrides);

  const problem = getProblemById(selectedId, overrides);
  if (!problem) return null;

  const activeSample = problem.samples[activeIdx];

  return (
    <div className="h-full bg-[#f2f5ee] flex flex-col min-h-0">
      {/* Top tabs */}
      <div className="shrink-0 flex items-center justify-around border-b-[3px] border-panelBorder bg-[#f2f5ee]">
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
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto teal-scroll px-4 py-3">
        {activeTab === "testcase" && (
          <div>
            {/* Case pills — always show 3 (Case 1, Case 2, Case 3),
                even when the problem ships fewer sample inputs. The
                missing pills are rendered as empty placeholders so the
                layout matches the reference. */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {[0, 1, 2].map((i) => (
                <CasePill
                  key={i}
                  index={i}
                  active={i === activeIdx}
                  onClick={() => setActive(i)}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[13px] text-[#2c2d65] font-semibold mb-1.5">
                  Input
                </div>
                <pre tabIndex={0} className="sample-box sample-box-light sample-box-focus max-h-32 overflow-auto teal-scroll">
{activeSample ? activeSample.input : "(hidden test case)"}
                </pre>
              </div>
              <div>
                <div className="text-[13px] text-[#2c2d65] font-semibold mb-1.5">
                  Expected output
                </div>
                <pre tabIndex={0} className="sample-box sample-box-light sample-box-focus max-h-32 overflow-auto teal-scroll">
{activeSample?.output ?? "(hidden test case)"}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === "custom" && (
          <div>
            <div className="text-[13px] text-[#2c2d65] font-semibold mb-1.5">
              Custom Input (stdin)
            </div>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(selectedId, e.target.value)}
              className="w-full h-28 resize-none rounded border border-panelBorder bg-[#F4F5F7] font-mono text-[13px] p-2 focus:outline-none focus:border-infy-400"
              placeholder="Type or paste your own input here..."
            />
            {customResult && (
              <div className="mt-3">
                <div className="text-[12px] text-gray-700 font-medium mb-1">
                  Output{" "}
                  <span className="text-gray-400 font-normal">
                    · {customResult.timeMs.toFixed(0)} ms
                  </span>
                </div>
                {customResult.error ? (
                  <ErrorBox text={customResult.error} />
                ) : (
                  <pre tabIndex={0} className="sample-box sample-box-light sample-box-focus max-h-28 overflow-auto teal-scroll">
{customResult.actual}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "result" && (
          <ResultView
            isRunning={isRunning}
            runResults={runResults}
            customResult={customResult}
            samples={problem.samples}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Top tabs                                                           */
/* ------------------------------------------------------------------ */
function TopTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "h-10 px-6 text-[14px] font-semibold transition-colors relative",
        active
          ? "text-[#2c2d65]"
          : "text-[#2c2d65] hover:text-[#2c2d65]"
      )}
    >
      {label}
      {active && (
        <span className="absolute -left-20 -right-20 -bottom-[3px] h-[3px] bg-[#2c2d65] z-10" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Case pill                                                          */
/* ------------------------------------------------------------------ */
function CasePill({
  index,
  active,
  onClick,
}: {
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "h-6 px-2.5 text-[12px] font-semibold rounded-md border transition-colors",
        active
          ? "bg-[#64ecc7] text-[#2c2d65] border-[#64ecc7]"
          : "bg-transparent text-[#2c2d65]/85 border-[#64ecc7] hover:bg-white/40"
      )}
    >
      Case {index + 1}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Verdict pill — used in the Result tab grid                        */
/* ------------------------------------------------------------------ */
type Verdict = "passed" | "failed" | "timeout" | "error";

function ResultPill({ index, verdict }: { index: number; verdict: Verdict }) {
  const styles: Record<Verdict, string> = {
    passed: "bg-[#E8F8F1] text-[#2c2d65] border-[#A6E3CA]",
    failed: "bg-[#FBECEC] text-[#2c2d65] border-[#F0BFBF]",
    timeout: "bg-[#F2F2F2] text-[#2c2d65] border-[#D5D5D5]",
    error: "bg-[#FBECEC] text-[#2c2d65] border-[#F0BFBF]",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-between gap-2 h-7 px-3 text-[12px] rounded-full border",
        styles[verdict]
      )}
    >
      <span>Case {index + 1}</span>
      {verdict === "passed" && (
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6.5" />
          <polyline points="5 8.5 7.2 11 11 5.5" />
        </svg>
      )}
      {(verdict === "failed" || verdict === "error") && (
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6.5" />
          <line x1="5.5" y1="5.5" x2="10.5" y2="10.5" />
          <line x1="10.5" y1="5.5" x2="5.5" y2="10.5" />
        </svg>
      )}
      {verdict === "timeout" && (
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6.5" />
          <polyline points="8 5 8 8 10 9.5" />
        </svg>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Error box                                                          */
/* ------------------------------------------------------------------ */
function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-md bg-[#FBECEC] border border-[#F0BFBF] p-3">
      <div className="text-[13px] font-semibold text-[#B91C1C] mb-1">Error</div>
      <pre className="text-[12px] font-mono text-[#7F1D1D] whitespace-pre-wrap break-words">
{text}
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Result tab body                                                    */
/* ------------------------------------------------------------------ */
function ResultView({
  isRunning,
  runResults,
  customResult,
  samples,
}: {
  isRunning: boolean;
  runResults: RunResult[];
  customResult: RunResult | undefined;
  samples: { input: string; output?: string }[];
}) {
  if (isRunning && runResults.length === 0 && !customResult) {
    return (
      <div className="h-full flex items-center justify-center text-[13px] text-[#2c2d65]/70">
        <span className="animate-pulse">· Fetching results...</span>
      </div>
    );
  }

  if (runResults.length === 0 && !customResult) {
    return (
      <div className="text-[12px] text-gray-500">
        Run your code to see results here.
      </div>
    );
  }

  const firstError = runResults.find((r) => r.error);

  // If there are 4+ run results, show the pill grid (Submit-style).
  // Otherwise, show the table view (Execute-style).
  const usePillGrid = runResults.length > 3;

  return (
    <div className="space-y-3">
      {firstError && firstError.error && (
        <ErrorBox text={firstError.error} />
      )}

      {usePillGrid && !firstError && (
        <>
          <div className="grid grid-cols-8 gap-2">
            {runResults.map((r) => {
              const v: Verdict = r.error
                ? "error"
                : r.passed === true
                ? "passed"
                : r.passed === false
                ? "failed"
                : "timeout";
              return <ResultPill key={r.caseIndex} index={r.caseIndex} verdict={v} />;
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-4 pt-2 text-[11px] text-[#2c2d65]/80">
            <Legend dotClass="text-emerald-500" label="Passed" />
            <Legend dotClass="text-red-500" label="Failed" cross />
            <Legend dotClass="text-gray-500" label="Timed Out" clock />
            <Legend dotClass="text-red-500" label="Error" cross />
          </div>
        </>
      )}

      {!usePillGrid && !firstError && runResults.length > 0 && (
        <ResultTable rows={runResults} samples={samples} />
      )}

      {customResult && (
        <ResultTable
          rows={[
            {
              caseIndex: 0,
              passed: customResult.passed,
              actual: customResult.actual,
              expected: undefined,
              error: customResult.error,
              timeMs: customResult.timeMs,
            },
          ]}
          samples={[{ input: "(custom input)" }]}
          customLabel
        />
      )}
    </div>
  );
}

function Legend({
  dotClass,
  label,
  cross,
  clock,
}: {
  dotClass: string;
  label: string;
  cross?: boolean;
  clock?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {cross ? (
        <svg viewBox="0 0 16 16" className={"w-3.5 h-3.5 " + dotClass} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6.5" />
          <line x1="5.5" y1="5.5" x2="10.5" y2="10.5" />
          <line x1="10.5" y1="5.5" x2="5.5" y2="10.5" />
        </svg>
      ) : clock ? (
        <svg viewBox="0 0 16 16" className={"w-3.5 h-3.5 " + dotClass} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6.5" />
          <polyline points="8 5 8 8 10 9.5" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" className={"w-3.5 h-3.5 " + dotClass} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6.5" />
          <polyline points="5 8.5 7.2 11 11 5.5" />
        </svg>
      )}
      <span>{label}</span>
    </span>
  );
}

function ResultTable({
  rows,
  samples,
  customLabel,
}: {
  rows: RunResult[];
  samples: { input: string; output?: string }[];
  customLabel?: boolean;
}) {
  return (
    <div>
      <div className="grid grid-cols-[2fr_1fr_1fr_60px] gap-3 px-1 pb-2 text-[12px] font-medium text-[#2c2d65]/80 border-b border-gray-200">
        <span>Input</span>
        <span>Expected output</span>
        <span>Output</span>
        <span>Status</span>
      </div>
      {rows.map((r) => {
        const sample = samples[r.caseIndex] ?? samples[0];
        return (
          <div
            key={r.caseIndex}
            className="grid grid-cols-[2fr_1fr_1fr_60px] gap-3 px-1 py-3 border-b border-gray-100 text-[12px] text-[#2c2d65]"
          >
            <pre className="font-mono whitespace-pre-wrap break-words">
{customLabel ? sample.input : (sample?.input ?? "")}
            </pre>
            <pre className="font-mono whitespace-pre-wrap break-words">
{r.expected ?? sample?.output ?? ""}
            </pre>
            <pre className="font-mono whitespace-pre-wrap break-words">
{r.error ? "" : r.actual}
            </pre>
            <span className="flex items-start pt-0.5">
              {r.error ? (
                <svg viewBox="0 0 16 16" className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6.5" />
                  <line x1="5.5" y1="5.5" x2="10.5" y2="10.5" />
                  <line x1="10.5" y1="5.5" x2="5.5" y2="10.5" />
                </svg>
              ) : r.passed === true ? (
                <svg viewBox="0 0 16 16" className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6.5" />
                  <polyline points="5 8.5 7.2 11 11 5.5" />
                </svg>
              ) : r.passed === false ? (
                <svg viewBox="0 0 16 16" className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6.5" />
                  <line x1="5.5" y1="5.5" x2="10.5" y2="10.5" />
                  <line x1="10.5" y1="5.5" x2="5.5" y2="10.5" />
                </svg>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
