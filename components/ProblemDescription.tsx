"use client";

/**
 * Left panel — the rendered problem statement.
 *
 * Visual reference (from the screenshots):
 *   - Top breadcrumb "Coding Hands-on > Question N" in dark navy with
 *     a small flag icon on the right
 *   - The candidate's username/ID printed diagonally as a watermark
 *     across the entire panel
 *   - Problem statement paragraphs, then "Input Format", "Constraints",
 *     and "Sample Test Cases" sections; each Input/Output/Explanation
 *     block is shown in a light-grey rounded box.
 *   - A custom green/teal scrollbar on the right edge.
 */

import { useStore } from "@/store/useStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getProblemById } from "@/lib/problems";
import { Flag } from "lucide-react";

/** Diagonal repeating-text watermark. The text is the candidate's
 *  username/ID, tiled across the panel at -22°. Pure decorative — it
 *  sits behind everything via `pointer-events-none`. */
function Watermark({ text }: { text: string }) {
  const rows = 14;
  const cols = 4;
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(
        <span
          key={r + "-" + c}
          className="absolute select-none pointer-events-none whitespace-nowrap font-mono"
          style={{
            top: r * 90 + "px",
            left: c * 240 + (r % 2) * 120 + "px",
            transform: "rotate(-22deg)",
            color: "rgba(70, 70, 100, 0.18)",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {text}
        </span>
      );
    }
  }
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {cells}
    </div>
  );
}

export function ProblemDescription() {
  const selectedId = useStore((s) => s.selectedProblemId);
  const overrides = useStore((s) => s.problemContentOverrides);
  const problem = getProblemById(selectedId, overrides);
  const user = useAuthStore((s) => s.user);
  if (!problem) return null;

  // Watermark text — the candidate ID (e.g. adityasingh3210) tiled
  // diagonally behind the problem statement.
  const watermarkText = (user?.candidateId ?? "candidate").toLowerCase();

  return (
    <div className="h-full w-full min-w-0 flex flex-col bg-[#f2f5ee] relative">
      {/* Breadcrumb header — sits above the scroll area so the teal
          scrollbar only spans the body, not the header. */}
      <div className="shrink-0 z-20 bg-[#f2f5ee] border-b border-panelBorder px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="text-[14px] text-[#2c2d65]">
          <span className="font-bold">Coding Hands-on</span>
          <span className="mx-2 text-gray-400">›</span>
          <span className="font-bold">Question {problem.number}</span>
        </div>
        <button
          type="button"
          title="Flag this question for review"
          className="text-black hover:text-black transition-colors"
        >
          <Flag className="w-3 h-3" strokeWidth={4} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto teal-scroll relative">
        <Watermark text={watermarkText} />
        <div className="relative z-10 px-4 sm:px-6 py-5 problem-prose break-words">
        <div className="w-full max-w-3xl">
          {/* Problem statement */}
          <div className="space-y-3">
            {problem.statement.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

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

          {/* Input Format — single light-green container holding the
              heading + a flat list. Items are separated by a subtle
              horizontal rule, no individual rounded cards. */}
          <div className="mt-5 rounded-md bg-transparent border border-[#DCE5DC]">
            <h2 className="!mt-0 !mb-0 px-4 pt-3 pb-2">Input Format</h2>
            <div className="border-t border-[#DCE5DC]">
              {problem.inputFormat.map((l, i) => (
                <div
                  key={i}
                  className={
                    "px-4 py-2.5 text-[13px] leading-relaxed font-medium text-[#2c2d65]" +
                    (i < problem.inputFormat.length - 1
                      ? " border-b border-[#DCE5DC]"
                      : "")
                  }
                >
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Constraints — same flat-list treatment, mono font for
              expressions. */}
          <div className="mt-4 rounded-md bg-transparent border border-[#DCE5DC]">
            <h2 className="!mt-0 !mb-0 px-4 pt-3 pb-2">Constraints</h2>
            <div className="border-t border-[#DCE5DC]">
              {problem.constraints.map((c, i) => (
                <div
                  key={i}
                  className={
                    "px-4 py-2.5 text-[13px] font-mono font-bold text-[#2c2d65]" +
                    (i < problem.constraints.length - 1
                      ? " border-b border-[#DCE5DC]"
                      : "")
                  }
                >
                  {c}
                </div>
              ))}
            </div>
          </div>

          {/* Sample Test Cases — heading once at the top; each case is a
              flat block (no outer card) with Case label, Input, Output,
              and Explanation rendered as `.sample-box` panels. */}
          <h2 className="mt-5">Sample Test Cases</h2>
          <div className="space-y-5">
            {problem.samples.map((s, i) => (
              <div key={i} className="space-y-2.5">
                <div className="text-[14px] font-bold text-[#2c2d65]">
                  Case {i + 1}
                </div>
                <div className="pl-2 space-y-2.5">
                  <div>
                    <div className="text-[12px] font-bold text-[#2c2d65] mb-0">
                      Input:
                    </div>
                    <div className="sample-box">{s.input}</div>
                  </div>
                  {s.output !== undefined && (
                    <div>
                      <div className="text-[12px] font-bold text-[#2c2d65] mb-0">
                        Output:
                      </div>
                      <div className="sample-box">{s.output}</div>
                    </div>
                  )}
                  {s.explanation && (
                    <div>
                      <div className="text-[12px] font-bold text-[#2c2d65] mb-0">
                        Explanation:
                      </div>
                      <div className="sample-box whitespace-pre-wrap">
                        {s.explanation}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="h-40" />
        </div>
      </div>
      </div>
    </div>
  );
}
