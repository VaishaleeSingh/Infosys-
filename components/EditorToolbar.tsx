"use client";

/**
 * Thin toolbar strip above the Monaco editor — matches the reference:
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  [ C++ ▾ ]  [ + ]                       A-  A+  ⟳  ☾        │
 *   └─────────────────────────────────────────────────────────────┘
 *
 *   - Left: language dropdown (C++/Python 3/Java/JavaScript) and a
 *     small "+" icon button (decorative for now — matches the real
 *     Infosys UI which lets the candidate add a new file).
 *   - Right: font-decrease (A-), font-increase (A+), reset code
 *     (refresh icon), and a moon icon (dark/light mode toggle).
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
    <div className="h-10 flex items-center justify-between px-3">
      {/* LEFT: language dropdown + add file (+) */}
      <div className="flex items-center gap-2">
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="h-7 w-[110px] pl-3 pr-2 inline-flex items-center justify-between text-[12px] rounded-md bg-white text-[#2c2d65] border border-gray-300 hover:bg-gray-50"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <span>{LANGUAGE_LABELS[language]}</span>
            <svg
              viewBox="0 0 16 16"
              className="w-3 h-3 text-[#2c2d65]"
              fill="currentColor"
              aria-hidden
            >
              <polygon points="4 6 12 6 8 11" />
            </svg>
          </button>

          {open && (
            <div
              role="menu"
              className="absolute left-0 mt-1 w-40 bg-white border border-panelBorder rounded-md shadow-lg z-30 py-1"
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
                    "w-full text-left text-[12px] px-3 py-1.5 text-[#2c2d65] hover:bg-gray-50",
                    language === l && "bg-gray-50 font-semibold"
                  )}
                >
                  {LANGUAGE_LABELS[l]}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          aria-label="AI assistant"
          title="AI assistant"
          className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-[#2c2d65] text-white hover:bg-[#15235E] transition-colors"
        >
          {/* AI assistant — chat bubble with sparkle (compact). */}
          <svg
            viewBox="0 0 16 16"
            className="w-4 h-4"
            fill="currentColor"
            aria-hidden
          >
            <path d="M3 2.5 h10 a1.5 1.5 0 0 1 1.5 1.5 v6 a1.5 1.5 0 0 1 -1.5 1.5 h-3 l-2 2 v-2 h-5 a1.5 1.5 0 0 1 -1.5 -1.5 v-6 a1.5 1.5 0 0 1 1.5 -1.5 z" />
            <path d="M8 4.2 L8.7 6.3 L10.8 7 L8.7 7.7 L8 9.8 L7.3 7.7 L5.2 7 L7.3 6.3 Z" fill="white" />
          </svg>
        </button>
      </div>

      {/* RIGHT: A- / A+ / reset / dark-mode */}
      <div className="flex items-center gap-1">
        <IconBtn label="Decrease font size" onClick={() => {}}>
          <span className="font-bold text-[14px]">A<span className="text-[11px] font-bold">-</span></span>
        </IconBtn>
        <IconBtn label="Increase font size" onClick={() => {}}>
          <span className="font-bold text-[14px]">A<span className="text-[11px] font-bold">+</span></span>
        </IconBtn>
        <IconBtn label="Reset to starter code" onClick={resetCode}>
          <svg
            viewBox="0 0 16 16"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="13 4 13 7 10 7" />
            <path d="M3.5 9a5 5 0 0 0 9.4 1.5" />
            <polyline points="3 12 3 9 6 9" />
            <path d="M12.5 7A5 5 0 0 0 3.1 5.5" />
          </svg>
        </IconBtn>
        <IconBtn label="Toggle dark mode" onClick={() => {}}>
          <svg
            viewBox="0 0 16 16"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3 5.5 5.5 0 1 0 13 9.5z" />
          </svg>
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="h-7 w-7 inline-flex items-center justify-center rounded text-[#2c2d65]/80 hover:text-[#2c2d65] hover:bg-gray-100 transition-colors"
    >
      {children}
    </button>
  );
}
