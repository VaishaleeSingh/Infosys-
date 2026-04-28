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
  const problem = getProblemById(selectedId);
  const user = useAuthStore((s) => s.user);
  if (!problem) return null;

  // Watermark text — the candidate ID (e.g. adityasingh3210) tiled
  // diagonally behind the problem statement.
  const watermarkText = (user?.candidateId ?? "candidate").toLowerCase();

  return (
    <div className="h-full w-full min-w-0 overflow-y-auto teal-scroll bg-panel relative">
      <Watermark text={watermarkText} />

      {/* Breadcrumb header — pinned visually at top with the flag. */}
      <div className="sticky top-0 z-20 bg-panel/95 backdrop-blur-sm border-b border-panelBorder px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="text-[14px] text-[#0B1B4A]">
          <span className="font-bold">Coding Hands-on</span>
          <span className="mx-2 text-gray-400">›</span>
          <span className="font-bold">Question {problem.number}</span>
        </div>
        <button
          type="button"
          title="Flag this question for review"
          className="text-[#0B1B4A]/60 hover:text-[#0B1B4A] transition-colors"
        >
          <svg
            viewBox="0 0 16 16"
            className="w-4 h-4"
            fill="currentColor"
            aria-hidden
          >
            {/* "P"-shaped flag: vertical pole + filled rectangular
                pennant at the top, matching the reference. */}
            <rect x="4" y="3" width="7" height="5" rx="0.5" />
            <rect x="3.4" y="2" width="1.2" height="12" rx="0.5" />
          </svg>
        </button>
      </div>

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

          {/* Input Format card */}
          <div className="mt-5 rounded-md bg-[#EDEEF2] border border-[#D7D9E0] p-4">
            <h2 className="!mt-0 !mb-3">Input Format</h2>
            <div className="space-y-2.5">
              {problem.inputFormat.map((l, i) => (
                <div
                  key={i}
                  className="rounded-md bg-white/70 border border-[#E2E3EA] px-3 py-2 text-[13px] leading-relaxed text-[#0B1B4A]"
                >
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Constraints card */}
          <div className="mt-4 rounded-md bg-[#EDEEF2] border border-[#D7D9E0] p-4">
            <h2 className="!mt-0 !mb-3">Constraints</h2>
            <div className="space-y-2.5">
              {problem.constraints.map((c, i) => (
                <div
                  key={i}
                  className="rounded-md bg-white/70 border border-[#E2E3EA] px-3 py-2 text-[13px] font-mono text-[#0B1B4A]"
                >
                  {c}
                </div>
              ))}
            </div>
          </div>

          {/* Sample Test Cases */}
          <h2 className="mt-5">Sample Test Cases</h2>
          <div className="space-y-4">
            {problem.samples.map((s, i) => (
              <div
                key={i}
                className="rounded-md bg-[#EDEEF2] border border-[#D7D9E0] p-4 space-y-3"
              >
                <div className="text-[13px] font-semibold text-[#0B1B4A]">
                  Case {i + 1}
                </div>
                <div>
                  <div className="text-[12px] text-[#0B1B4A]/80 mb-1">Input:</div>
                  <div className="sample-box">{s.input}</div>
                </div>
                {s.output !== undefined && (
                  <div>
                    <div className="text-[12px] text-[#0B1B4A]/80 mb-1">
                      Output:
                    </div>
                    <div className="sample-box">{s.output}</div>
                  </div>
                )}
                {s.explanation && (
                  <div>
                    <div className="text-[12px] text-[#0B1B4A]/80 mb-1">
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

          <div className="h-40" />
        </div>
      </div>
    </div>
  );
}
