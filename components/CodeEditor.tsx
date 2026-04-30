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
import editorTheme from "@/lib/themes/infosys-light.json";

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
    <div className="h-full w-full flex flex-col bg-[#f2f5ee] relative">
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
      <div className="flex-1 min-h-0 relative px-[8px] pb-[8px]">
        <div className="h-full w-full bg-white rounded-b-md overflow-hidden">
          <MonacoEditor
            height="100%"
          width="100%"
          language={MONACO_LANGUAGE[language] ?? "python"}
          value={code}
          theme="infosys-light"
          beforeMount={(monaco) => {
            monaco.editor.defineTheme(
              "infosys-light",
              editorTheme as Parameters<
                typeof monaco.editor.defineTheme
              >[1]
            );

            // Override the cpp tokenizer so STL container types,
            // STL streams, keyword constants, and function calls
            // get their own token names the theme can color
            // separately. Lookahead `(?=\s*\()` lets us tag any
            // identifier-followed-by-`(` as a function name.
            monaco.languages.setMonarchTokensProvider("cpp", {
              defaultToken: "",
              tokenPostfix: ".cpp",
              keywords: [
                "auto", "break", "case", "catch", "class", "const",
                "constexpr", "continue", "default", "delete", "do",
                "else", "enum", "explicit", "export", "extern",
                "for", "friend", "goto", "if", "inline", "long",
                "mutable", "namespace", "new", "operator",
                "private", "protected", "public", "register",
                "return", "short", "signed", "sizeof", "static",
                "struct", "switch", "template", "this", "throw",
                "try", "typedef", "typename", "union", "unsigned",
                "using", "virtual", "void", "volatile", "while",
                "int", "char", "float", "double", "bool",
              ],
              stlTypes: [
                "vector", "pair", "tuple", "string", "map", "set",
                "unordered_map", "unordered_set", "queue", "stack",
                "deque", "priority_queue", "list", "array", "bitset",
              ],
              stlPredefined: [
                "cin", "cout", "cerr", "clog", "ios_base",
                "size_t", "ptrdiff_t",
              ],
              keywordConstants: [
                "NULL", "nullptr", "true", "false",
              ],
              streamConstants: [
                "endl", "flush", "ends",
              ],
              tokenizer: {
                root: [
                  [/\/\/.*$/, "comment"],
                  [/\/\*/, "comment", "@comment"],
                  [/^\s*#\s*\w+/, "keyword.directive"],
                  [/<[^>]*\.h?>/, "string.include.identifier"],
                  [/"/, "string", "@string"],
                  [/'([^'\\]|\\.)*'/, "string"],
                  [/\d+(\.\d+)?([eE][+-]?\d+)?[lLuUfF]*/, "number"],
                  // Function call/definition: identifier followed
                  // immediately by `(`.
                  [
                    /[A-Za-z_]\w*(?=\s*\()/,
                    {
                      cases: {
                        "@keywords": "keyword",
                        "@stlTypes": "type.identifier",
                        "@stlPredefined": "predefined",
                        "@streamConstants": "constant.builtin",
                        "@keywordConstants": "constant",
                        "@default": "entity.name.function",
                      },
                    },
                  ],
                  // Other identifiers — classify against the sets.
                  [
                    /[A-Za-z_]\w*/,
                    {
                      cases: {
                        "@keywords": "keyword",
                        "@stlTypes": "type.identifier",
                        "@stlPredefined": "predefined",
                        "@streamConstants": "constant.builtin",
                        "@keywordConstants": "constant",
                        "@default": "identifier",
                      },
                    },
                  ],
                  [/[{}()\[\]]/, "delimiter.bracket"],
                  [/::|->|\+\+|--|<<|>>|&&|\|\||[!=<>]=|[+\-*/%&|^!=<>?:;,.]/, "operator"],
                  [/\s+/, ""],
                ],
                comment: [
                  [/[^\/*]+/, "comment"],
                  [/\*\//, "comment", "@pop"],
                  [/[\/*]/, "comment"],
                ],
                string: [
                  [/[^\\"]+/, "string"],
                  [/\\./, "string"],
                  [/"/, "string", "@pop"],
                ],
              },
            } as Parameters<
              typeof monaco.languages.setMonarchTokensProvider
            >[1]);
          }}
          onChange={(val) => setCode(selectedId, val ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            fontWeight: "600",
            fontFamily: 'Menlo, Consolas, "DejaVu Sans Mono", "Courier New", monospace',
            fontLigatures: true,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            renderLineHighlight: "line",
            smoothScrolling: true,
            tabSize: 4,
            insertSpaces: true,
            automaticLayout: true,
            padding: { top: 8, bottom: 8 },
          }}
        />
        </div>
      </div>
    </div>
  );
}
