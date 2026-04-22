"use client";

/**
 * Left panel: the rendered problem statement.
 *
 * Layout follows the screenshots exactly:
 *   1. Optional compact title strip ("Coding Hands-on   2: Medium : MSS With Swap")
 *   2. Problem statement paragraphs
 *   3. "Note:" / rules bullets (optional)
 *   4. Input Format
 *   5. Constraints
 *   6. Sample Test Cases (Case 1, Case 2, …) with Input/Output/Explanation boxes
 *
 * A subtle diagonal watermark overlay is rendered behind the text to
 * recreate the candidate-ID stamp visible in the original screenshots.
 */

import { useStore } from "@/store/useStore";
import { getProblemById } from "@/lib/problems";

export function ProblemDescription() {
  const selectedId = useStore((s) => s.selectedProblemId);
  const problem = getProblemById(selectedId);
  if (!problem) return null;

  return (
    // `min-w-0` is critical here: it lets this flex/grid child shrink
    // below the intrinsic width of its content so the sample boxes
    // wrap rather than overflow the left column (which is `overflow-
    // hidden` in page.tsx). `break-words` ensures long URLs/tokens in
    // the statement paragraphs break instead of punching a hole to
    // the right of the visible area.
    <div className="h-full w-full min-w-0 overflow-y-auto thin-scroll bg-panel">
      <div className="watermark relative px-4 sm:px-6 py-5 problem-prose break-words">
        <div className="relative z-10 w-full max-w-3xl">
          {/* Breadcrumb inside the panel (faint copy — mirrors the screenshots) */}
          <div className="text-[12px] text-gray-500 mb-4">
            <span className="font-semibold text-gray-700">Coding Hands-on</span>
            <span className="mx-2">›</span>
            <span>
              {problem.number}: {problem.difficulty} : {problem.title}
            </span>
          </div>

          {/* Problem statement */}
          <div className="space-y-3">
            {problem.statement.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* Notes */}
          {problem.notes && problem.notes.length > 0 && (
            <>
              <h2>Note{problem.notes.length > 1 ? "s" : ""}:</h2>
              <ul>
                {problem.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </>
          )}

          {/* Rules block (e.g. "Rules for Cooking:") */}
          {problem.rules && (
            <>
              <h2>{problem.rules.heading}</h2>
              <ul>
                {problem.rules.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </>
          )}

          {/* Input Format */}
          <h2>Input Format</h2>
          <div className="space-y-3">
            {problem.inputFormat.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>

          {/* Constraints */}
          <h2>Constraints</h2>
          <ul>
            {problem.constraints.map((c, i) => (
              <li key={i}>
                <code className="inline-code">{c}</code>
              </li>
            ))}
          </ul>

          {/* Sample Test Cases */}
          <h2>Sample Test Cases</h2>
          <div className="space-y-4">
            {problem.samples.map((s, i) => (
              <div key={i} className="space-y-2">
                <div className="text-[13px] font-semibold text-gray-800">
                  Case {i + 1}
                </div>
                <div>
                  <div className="text-[12px] text-gray-600 mb-1">Input:</div>
                  <div className="sample-box">{s.input}</div>
                </div>
                {s.output !== undefined && (
                  <div>
                    <div className="text-[12px] text-gray-600 mb-1">Output:</div>
                    <div className="sample-box">{s.output}</div>
                  </div>
                )}
                {s.explanation && (
                  <div>
                    <div className="text-[12px] text-gray-600 mb-1">
                      Explanation:
                    </div>
                    <div className="sample-box whitespace-pre-wrap">
                      {s.explanation}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Padding at the bottom so the last box isn't flush with the test panel overlay */}
          <div className="h-40" />
        </div>
      </div>
    </div>
  );
}
