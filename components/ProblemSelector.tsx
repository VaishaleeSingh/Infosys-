"use client";

/**
 * Thin vertical rail on the far left — the tiny sidebar visible in
 * the Infosys screenshots. Each problem is a numeric badge; completed
 * problems show a green tick in the bottom-right corner (matches the
 * "done" state after a successful Submit).
 *
 * The bottom of the rail shows the completion count "N/total" in the
 * same spirit as the progress counter at the bottom-right of the
 * real assessment screen.
 */

import { useStore } from "@/store/useStore";
import { problems } from "@/lib/problems";
import clsx from "clsx";

export function ProblemSelector() {
  const selectedId = useStore((s) => s.selectedProblemId);
  const selectProblem = useStore((s) => s.selectProblem);
  const completed = useStore((s) => s.completedProblems);
  const total = problems.length;
  const done = Object.keys(completed).length;

  return (
    <aside className="w-12 bg-white border-r border-panelBorder flex flex-col items-center py-3 gap-2">
      {problems.map((p) => {
        const isActive = p.id === selectedId;
        const isDone = !!completed[p.id];
        return (
          <button
            key={p.id}
            onClick={() => selectProblem(p.id)}
            title={`${p.number}. ${p.title} (${p.difficulty})${isDone ? " — Completed" : ""}`}
            className={clsx(
              "relative w-8 h-8 rounded flex items-center justify-center text-[12px] font-semibold border transition-colors",
              isActive
                ? "bg-infy-500 text-white border-infy-600"
                : isDone
                ? "bg-green-50 text-green-800 border-green-300"
                : "bg-white text-gray-600 border-panelBorder hover:bg-gray-50"
            )}
          >
            {p.number}
            {isDone && (
              <span
                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold bg-green-500 text-white ring-2 ring-white"
                aria-label="Completed"
              >
                ✓
              </span>
            )}
          </button>
        );
      })}

      {/* Progress label at the bottom of the rail */}
      <div
        className="mt-auto text-[10px] text-gray-500 font-mono"
        title={`${done} of ${total} solved`}
      >
        {done}/{total}
      </div>
    </aside>
  );
}
