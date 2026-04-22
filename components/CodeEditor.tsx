"use client";

/**
 * Code-editor card. This is the TOP half of the right column and is
 * wrapped in its own framed container in page.tsx (rounded border +
 * subtle shadow). The editor has three bands inside its frame:
 *
 *   ┌───────────────────────────────────────────┐
 *   │ [ Python 3 ▾ ]                 ⟳ reset   │  ← EditorToolbar
 *   ├───────────────────────────────────────────┤
 *   │                                           │
 *   │      Monaco (vs-dark, line numbers)       │
 *   │                                           │
 *   ├───────────────────────────────────────────┤
 *   │ Toggle Console ∨                          │  ← toggle strip
 *   └───────────────────────────────────────────┘
 *
 * The "Toggle Console" button no longer overlays anything inside the
 * editor. Instead it flips `consoleOpen` in the store — page.tsx
 * reacts by swapping the TestCasePanel (sample inputs) for the
 * ConsolePanel (dark console output) in the frame below. The editor
 * card's bounds never change when the console is toggled; only the
 * bottom frame's content swaps.
 */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useStore, selectCurrentCode } from "@/store/useStore";
import { EditorToolbar } from "@/components/EditorToolbar";

// Monaco must be client-only; Next will SSR-skip the module itself.
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-white text-gray-500 text-sm">
        Loading editor…
      </div>
    ),
  }
);

const MONACO_LANGUAGE: Record<string, string> = {
  python: "python",
  java: "java",
  cpp: "cpp",
  javascript: "javascript",
};

export function CodeEditor() {
  const selectedId = useStore((s) => s.selectedProblemId);
  const code = useStore(selectCurrentCode);
  const setCode = useStore((s) => s.setCode);
  const language = useStore((s) => s.language);
  const autoSolved = useStore(
    (s) => !!s.autoSolvedByProblem[s.selectedProblemId]?.[s.language]
  );

  // "Reference solution loaded" badge — shows only for 1 second each
  // time auto-solve fires for a new (problem, language) pair, then
  // quietly disappears. Keyed by the pair so switching problems and
  // watching a second auto-solve fire still pops the badge briefly.
  const [badgeVisible, setBadgeVisible] = useState(false);
  useEffect(() => {
    if (!autoSolved) return;
    setBadgeVisible(true);
    const t = setTimeout(() => setBadgeVisible(false), 1000);
    return () => clearTimeout(t);
  }, [autoSolved, selectedId, language]);

  return (
    <div className="h-full w-full flex flex-col bg-white relative">
      <EditorToolbar />

      {/* Auto-solve banner — flashes for ~1 second when the 5-second
          timer drops in the reference solution, then auto-hides. */}
      {badgeVisible && (
        <div className="absolute top-9 right-2 z-10 text-[10px] uppercase tracking-wider font-semibold bg-infy-500/90 text-white px-2 py-0.5 rounded shadow animate-pulse">
          Reference solution loaded
        </div>
      )}

      {/* Monaco fills the rest of the card. The Toggle Console control
          now lives on the persistent ActionBar in page.tsx, which is
          anchored to the bottom of the whole right column and stays
          visible even when the test cases frame is hidden. */}
      <div className="flex-1 min-h-0 relative">
        <MonacoEditor
          height="100%"
          width="100%"
          language={MONACO_LANGUAGE[language] ?? "python"}
          value={code}
          theme="vs"
          onChange={(val) => setCode(selectedId, val ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: '"Fira Code", Consolas, "Courier New", monospace',
            fontLigatures: true,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            renderLineHighlight: "gutter",
            smoothScrolling: true,
            tabSize: 4,
            insertSpaces: true,
            automaticLayout: true,
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>
    </div>
  );
}
