"use client";

/**
 * Thin top header bar.
 *
 * Matches the "Handson > 1: Question 1" layout visible in the newer
 * screenshots. Run/Submit moved out of the header and into the test
 * panel, where they live in the real Infosys UI. The header keeps the
 * user identity badge and the Log out menu on the right.
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getProblemById, problems } from "@/lib/problems";
import clsx from "clsx";

export function Header() {
  const router = useRouter();
  const selectedId = useStore((s) => s.selectedProblemId);
  const completed = useStore((s) => s.completedProblems);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const problem = getProblemById(selectedId);
  if (!problem) return null;

  const isDone = !!completed[problem.id];

  const initials = user
    ? user.name
        .split(/[^a-zA-Z0-9]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("") || user.email[0].toUpperCase()
    : "?";

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="h-11 flex items-center justify-between gap-3 px-3 sm:px-4 bg-white border-b border-panelBorder shadow-panel z-20">
      {/* LEFT: breadcrumb "Handson > N: Question N" — flex-1 + min-w-0
          so it truncates cleanly instead of pushing the right-hand
          controls off-screen on narrow viewports. */}
      <div className="flex items-center gap-2 text-[13px] text-gray-700 min-w-0 flex-1">
        <span className="font-semibold tracking-tight shrink-0">Handson</span>
        <span className="text-gray-400 shrink-0">&gt;</span>
        <span className="font-medium shrink-0">
          {problem.number}: Question {problem.number}
        </span>
        {isDone && (
          <span
            className="ml-1 inline-flex items-center gap-1 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5 shrink-0"
            title="You have submitted this problem"
          >
            <span className="w-3 h-3 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center">
              ✓
            </span>
            Done
          </span>
        )}
        {/* Secondary line only shows on md+ so narrow screens don't wrap. */}
        <span className="text-gray-400 mx-2 hidden md:inline shrink-0">|</span>
        <span className="text-[12px] text-gray-500 hidden md:inline truncate min-w-0">
          <span className="font-medium">{problem.difficulty}</span> ·{" "}
          {problem.title}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Overall progress — hidden on very narrow screens so the
            user badge doesn't wrap to a second line. */}
        <span className="text-[11px] text-gray-500 font-mono mr-1 hidden sm:inline">
          {Object.keys(completed).length}/{problems.length} solved
        </span>

        {/* User badge + dropdown */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 h-7 pl-1 pr-2 rounded hover:bg-gray-50"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="w-6 h-6 rounded-full bg-infy-500 text-white text-[11px] font-semibold flex items-center justify-center">
                {initials}
              </span>
              <span className="text-[12px] text-gray-700 hidden sm:flex flex-col leading-tight items-start">
                <span className="font-medium">{user.name}</span>
                <span className="text-[10px] text-gray-500">
                  {user.candidateId}
                </span>
              </span>
              <span className="text-gray-400 text-[10px]">▾</span>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className={clsx(
                  "absolute right-0 mt-1 w-56 bg-white border border-panelBorder rounded shadow-lg z-30 overflow-hidden"
                )}
              >
                <div className="px-3 py-2 border-b border-panelBorder">
                  <div className="text-[12px] font-medium text-gray-900 truncate">
                    {user.email}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Candidate ID: {user.candidateId}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  role="menuitem"
                  className="w-full text-left px-3 py-2 text-[12px] text-red-600 hover:bg-red-50"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
