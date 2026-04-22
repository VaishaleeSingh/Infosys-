"use client";

/**
 * Thin strip above the Monaco editor — exactly matches the
 * "Python 3 ▾" dropdown visible at the top-left of the code
 * editor in the screenshots.
 *
 * Also includes a reset-code button on the right so candidates can
 * revert to the starter template (matches the "⟳" icon sometimes
 * visible next to the language selector in the originals).
 */

import { useState, useRef, useEffect } from "react";
import { useStore, type Language } from "@/store/useStore";
import { getProblemById } from "@/lib/problems";
import clsx from "clsx";

const LANGUAGE_LABELS: Record<Language, string> = {
  python: "Python 3",
  java: "Java",
  cpp: "C++",
  javascript: "JavaScript",
};

export function EditorToolbar() {
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const setCode = useStore((s) => s.setCode);
  const selectedId = useStore((s) => s.selectedProblemId);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const resetCode = () => {
    const p = getProblemById(selectedId);
    if (!p) return;
    if (confirm("Reset your code to the starter template?")) {
      setCode(selectedId, p.starterCode[language]);
    }
  };

  return (
    <div className="h-9 bg-gray-50 border-b border-panelBorder flex items-center justify-between px-2">
      {/* Language selector */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className={clsx(
            "h-6 px-2 pr-1 flex items-center gap-1 text-[12px] rounded bg-white text-gray-700",
            "border border-panelBorder hover:bg-gray-100"
          )}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {LANGUAGE_LABELS[language]}
          <span className="text-gray-500 text-[10px] pl-0.5">▾</span>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute left-0 mt-1 w-40 bg-white border border-panelBorder rounded shadow-lg z-30 py-1"
          >
            {(Object.keys(LANGUAGE_LABELS) as Language[]).map((l) => (
              <button
                key={l}
                role="menuitemradio"
                aria-checked={language === l}
                onClick={() => {
                  setLanguage(l);
                  setOpen(false);
                }}
                className={clsx(
                  "w-full text-left text-[12px] px-3 py-1.5 text-gray-700 hover:bg-infy-50",
                  language === l && "bg-infy-50 text-infy-800 font-medium"
                )}
              >
                {LANGUAGE_LABELS[l]}
                {language === l && (
                  <span className="float-right text-infy-600">✓</span>
                )}
              </button>
            ))}
            <div className="mt-1 border-t border-panelBorder px-3 py-1.5 text-[10px] text-gray-500">
              Each language has its own starter. In-browser execution is
              Python 3 via Pyodide.
            </div>
          </div>
        )}
      </div>

      {/* Right-hand controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={resetCode}
          title="Reset to starter code"
          className="h-6 w-6 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15A9 9 0 1 0 6 5.3L1 10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
