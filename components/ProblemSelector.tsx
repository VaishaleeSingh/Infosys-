"use client";

/**
 * Left dashboard sidebar — collapsible "Questions" panel.
 *
 * Two states:
 *   - Closed (default): a thin 40px white rail on the left with a
 *     hamburger toggle at the top. Just enough to expose the toggle
 *     without taking layout space.
 *   - Open: an absolutely-positioned 280px white panel slides in over
 *     the content, with a dim black backdrop covering everything else.
 *     Clicking the backdrop or the X icon closes the panel.
 *
 * The panel itself is the dashboard from the reference: a "Questions"
 * label above a bordered card whose header reads "Coding Hands-on"
 * with passed/unsolved counters; underneath, the questions list with
 * a code-brackets icon per row, the active row underlined and bolded.
 */

import { useStore } from "@/store/useStore";
import { problems } from "@/lib/problems";
import clsx from "clsx";

function CodeBracketsIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="5 4 1.5 8 5 12" />
      <polyline points="11 4 14.5 8 11 12" />
    </svg>
  );
}

function HamburgerIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="2.5" y1="4.5" x2="13.5" y2="4.5" />
      <line x1="2.5" y1="8" x2="13.5" y2="8" />
      <line x1="2.5" y1="11.5" x2="13.5" y2="11.5" />
    </svg>
  );
}

function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="3.5" y1="3.5" x2="12.5" y2="12.5" />
      <line x1="12.5" y1="3.5" x2="3.5" y2="12.5" />
    </svg>
  );
}

export function ProblemSelector() {
  const open = useStore((s) => s.sidebarOpen);
  const toggle = useStore((s) => s.toggleSidebar);
  const setOpen = useStore((s) => s.setSidebarOpen);

  const selectedId = useStore((s) => s.selectedProblemId);
  const selectProblem = useStore((s) => s.selectProblem);
  const completed = useStore((s) => s.completedProblems);
  const total = problems.length;
  const done = Object.keys(completed).length;
  const pending = total - done;

  return (
    <>
      {/* Always-visible thin dark rail. Icons sit at the BOTTOM of
          the rail (matches the reference). The hamburger toggles the
          Questions dashboard; the document icon is decorative for now. */}
      <aside
        className="w-10 shrink-0 border border-panelBorder rounded-md shadow-panel flex flex-col items-center justify-end py-3 gap-2 m-1"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <button
          onClick={toggle}
          aria-label={open ? "Close questions" : "Open questions"}
          title={open ? "Close questions" : "Open questions"}
          className="w-7 h-7 rounded flex items-center justify-center text-[#0B1B4A]/85 hover:text-[#0B1B4A] hover:bg-gray-100 transition-colors"
        >
          <HamburgerIcon className="w-4 h-4" />
        </button>
        <button
          aria-label="Documents"
          title="Documents"
          className="w-7 h-7 rounded flex items-center justify-center text-[#0B1B4A]/85 hover:text-[#0B1B4A] hover:bg-gray-100 transition-colors"
        >
          <svg
            viewBox="0 0 16 16"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M4 2 L10 2 L13 5 L13 14 L4 14 Z" />
            <polyline points="10 2 10 5 13 5" />
          </svg>
        </button>
      </aside>

      {/* Dim backdrop covering the entire workspace including the header */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Slide-in dashboard panel — covers the full left side from the
          very top of the viewport, including over the header. */}
      {open && (
        <div className="fixed top-0 left-0 bottom-0 w-[280px] bg-white border-r border-panelBorder z-50 flex flex-col shadow-xl">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="text-[13px] font-semibold text-[#0B1B4A]">
              Questions
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-[#0B1B4A]/70 hover:text-[#0B1B4A]"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="mx-3 mb-3 rounded-md border border-gray-200 shadow-sm">
            <div className="flex items-center px-3 py-2.5 border-b border-gray-100">
              <HamburgerIcon className="w-4 h-4 text-[#0B1B4A] mr-2" />
              <span className="flex-1 text-[13px] font-semibold text-[#0B1B4A] underline underline-offset-2">
                Coding Hands-on
              </span>
              <span
                className="inline-flex items-center gap-1 text-[12px] text-emerald-600 mr-2"
                title={done + " solved"}
              >
                <svg
                  viewBox="0 0 16 16"
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <polyline points="3 8.5 7 12.5 13 4.5" />
                </svg>
                {done}
              </span>
              <span
                className="inline-flex items-center gap-1 text-[12px] text-gray-500"
                title={pending + " unsolved"}
              >
                <svg
                  viewBox="0 0 16 16"
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  aria-hidden
                >
                  <circle cx="8" cy="8" r="5.5" />
                  <line x1="8" y1="4.5" x2="8" y2="11.5" />
                </svg>
                {pending}
              </span>
            </div>

            <ul className="py-1 max-h-[60vh] overflow-y-auto thin-scroll">
              {problems.map((p) => {
                const isActive = p.id === selectedId;
                const isDone = !!completed[p.id];
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => {
                        selectProblem(p.id);
                        setOpen(false);
                      }}
                      title={
                        p.number +
                        ". " +
                        p.title +
                        " (" +
                        p.difficulty +
                        ")" +
                        (isDone ? " - Completed" : "")
                      }
                      className={clsx(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left transition-colors hover:bg-gray-50",
                        isActive ? "text-[#0B1B4A]" : "text-[#0B1B4A]/85"
                      )}
                    >
                      <CodeBracketsIcon
                        className={clsx(
                          "w-3.5 h-3.5 shrink-0",
                          isActive ? "text-[#0B1B4A]" : "text-[#0B1B4A]/60"
                        )}
                      />
                      <span
                        className={clsx(
                          "flex-1",
                          isActive
                            ? "font-semibold underline underline-offset-2"
                            : ""
                        )}
                      >
                        {p.number}. Question {p.number}
                      </span>
                      {isDone && (
                        <svg
                          viewBox="0 0 16 16"
                          className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-label="Completed"
                        >
                          <polyline points="3 8.5 7 12.5 13 4.5" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
