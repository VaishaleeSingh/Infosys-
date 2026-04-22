# Infosys Coding Hands-on — Pixel-Perfect Clone

A faithful clone of the **Infosys Coding Hands-on** assessment platform
(the interface used in InfyTQ, Infosys Springboard, and HackWithInfy
coding rounds). Built from the screenshots in `/reference/` as the
source of truth for layout, typography, colours, and copy.

The app runs Python directly in the browser via **Pyodide**, so there is
no backend to deploy — you can host it as a static Next.js export.

---

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** with a custom Infosys teal palette
- **Monaco Editor** (`@monaco-editor/react`) for the code panel
- **Zustand** for lightweight UI state
- **Pyodide 0.26** for safe in-browser Python execution

## Run locally

```bash
cd infosys-coding-platform
npm install
npm run dev
# open http://localhost:3000
```

The first Run click downloads Pyodide (~10 MB). Subsequent runs reuse
the cached instance — expect sub-100 ms overhead per execution after
the initial warm-up.

### Production build

```bash
npm run build
npm start
```

---

## Flow

The app walks a candidate through three screens, matching what the real
Infosys assessment does:

1. **`/login`** — Infosys-style split panel. Left: the deep-blue Infy
   gradient + tagline. Right: the sign-in form. Any non-empty email +
   password combo creates a session (stamped with a fake
   `INFY-XXXXXXX` candidate ID derived from the email). The session
   lives in `sessionStorage`, so a browser restart signs the candidate
   back out.
2. **`/terms`** — The 12-clause "Terms and Conditions Version: 1.0.0"
   gate. The candidate must tick **I agree** and click **I Agree &
   Continue** to proceed. **Decline & Sign Out** clears the session and
   returns to `/login`. Acceptance is per-session (relogin re-asks).
3. **`/`** — The Coding Hands-on workspace itself. Header breadcrumb
   (`Handson > 1: Question 1`), thin problem rail on the left,
   description + dark Monaco editor + test panel on the right. The user
   menu top-right exposes **Log out**, which clears both auth and
   terms-accepted and returns to `/login`.

If a user hits `/` directly without a session they're sent to
`/login`; if they're signed in but haven't accepted the terms they're
sent to `/terms`.

## File layout

```
infosys-coding-platform/
├── app/
│   ├── layout.tsx            # Root HTML shell, loads Pyodide <script>
│   ├── page.tsx              # Coding workspace — auth-gated composition
│   ├── login/page.tsx        # Infosys split-panel login
│   ├── terms/page.tsx        # 12-clause Terms & Conditions gate
│   └── globals.css           # Tailwind base + watermark + prose styles
├── components/
│   ├── Header.tsx            # Handson breadcrumb + progress + user menu
│   ├── ProblemSelector.tsx   # Left rail, green tick on completed problems
│   ├── ProblemDescription.tsx# Left panel: problem statement, samples
│   ├── EditorToolbar.tsx     # Dark bar: "Python 3 ▾" language selector + reset
│   ├── CodeEditor.tsx        # EditorToolbar + dark Monaco editor
│   └── TestCasePanel.tsx     # Test case | Custom Input | Result tabs +
│                             # Execute (teal) / Submit (red) action row
├── lib/
│   ├── problems.ts           # All problems as data (see below to add more)
│   └── runner.ts             # Pyodide loader + runPython(code, stdin)
├── store/
│   ├── useStore.ts           # Problem/code/results/active-tab state
│   └── useAuthStore.ts       # Auth session + termsAccepted flag
├── tailwind.config.ts        # Infosys teal palette, editor colours
├── postcss.config.mjs
├── next.config.mjs
├── tsconfig.json
└── package.json
```

## Adding a new problem

Append an entry to `lib/problems.ts`:

```ts
{
  id: "unique-slug",
  number: "6",
  difficulty: "Medium",
  title: "Your Problem Title",
  statement: ["Paragraph one.", "Paragraph two."],
  notes: ["Optional bullet"],
  inputFormat: [
    "The first line contains an integer, n.",
    "…",
  ],
  constraints: ["1 <= n <= 10^5"],
  samples: [
    { input: "3\n1\n2\n3", output: "6", explanation: "Sum." },
  ],
  starterCode: `import sys

def solve(n, a):
    # Write your code here
    pass

def main():
    n = int(sys.stdin.readline().strip())
    a = [int(sys.stdin.readline().strip()) for _ in range(n)]
    print(solve(n, a))

if __name__ == "__main__":
    main()
`,
}
```

The UI picks up the new problem automatically: sidebar rail, breadcrumb,
description, starter code, and test tabs are all driven by this data.

## Problems included (from the reference screenshots)

| # | Difficulty | Title                         | Notes                                    |
|---|------------|-------------------------------|------------------------------------------|
| 1 | Easy       | Chefs Cooking Competition     | Greedy on (expertise, messiness)         |
| 2 | Medium     | MSS With Swap                 | Max subarray sum after exactly K swaps   |
| 3 | Medium     | Sequence Arrangement          | Count rearrangements mod 998244353       |
| 4 | Easy       | Lucky Path                    | Tree: root-to-leaf sums divisible by K   |
| 5 | Hard       | Alice & Bob Tree Game         | Minimax on a rooted tree                 |

## Design notes

- **Colours** — Active tab + primary button use `#00B4A6` (the teal
  sampled from the "Case 1" active pill in the screenshots). Panel
  borders are `#E5E7EB`, sample boxes `#F4F5F7`, matching the originals.
- **Typography** — Prose uses the system Segoe UI stack (what Windows
  candidates see in the real platform). Code uses Fira Code with
  ligatures to mirror the on-screen monospace.
- **Watermark** — The faint diagonal candidate-ID pattern visible in
  the screenshots is reproduced via a `repeating-linear-gradient` in
  `.watermark::before`. Swap it for a real candidate ID by editing
  `globals.css` if you want to mimic that exactly.
- **Layout** — Two-column grid via CSS grid (`1.25fr | 1fr`). Right
  column is itself a two-row grid (editor on top, test panel on
  bottom). This keeps the editor responsive without JS listeners.

## Safe execution

All user code runs inside the Pyodide WebAssembly sandbox — no
`eval`, no network access, no filesystem access beyond Pyodide's
in-memory MEMFS. If you want to add timeouts, wrap `runPython` in a
`Promise.race` with a `setTimeout`-driven rejection; Pyodide's main
thread will swallow the rejection cleanly because the next run
overwrites stdout/stderr handlers.

For stricter isolation (e.g. hosted in an enterprise context), move
`runPython` into a Web Worker — Pyodide fully supports worker execution
and it will keep long computations off the UI thread.

## Execute vs. Submit

The test panel has three top tabs — **Test case**, **Custom Input**,
**Result** — and two action buttons at the bottom: **Execute** (teal)
and **Submit** (red).

- **Execute on Test case** runs the currently-selected sample (Case
  1/2/3) and shows "Test cases passed: N / M" once the batch has run.
- **Execute on Custom Input** runs the code against whatever you typed
  into the Custom Input textarea; the output lands in the Result
  column of that same tab.
- **Submit** (either tab) runs **all** samples, switches to the
  **Result** tab, and — if every sample passes — marks the problem
  completed: a green tick appears on the problem in the left rail and
  the breadcrumb shows a "Done" badge.

The overall progress counter (`N/total solved`) lives in the header
and at the bottom of the left rail, matching the screenshots.

## Language selector

The dark bar above the editor has a **Python 3 ▾** dropdown
(`EditorToolbar.tsx`). Swapping to Java, C++, or JavaScript only
re-syntax-highlights Monaco — runtime execution is still Python via
Pyodide, because a multi-language in-browser runtime is out of scope
for this clone. The dropdown ships as a cosmetic match for the
Infosys UI; wire it to a real backend runner (e.g. Judge0) if you need
real polyglot execution.

## Known trade-offs

- We intentionally do **not** persist code to `localStorage` — the
  Claude.ai artifact environment disallows it, and real Infosys tests
  don't persist across sessions anyway. Work survives problem-switches
  within a single session via the Zustand store. The **auth** session
  and **terms** acceptance both live in `sessionStorage`, so closing
  the tab signs the candidate out.
- Hidden test cases aren't simulated; **Submit** re-runs the visible
  samples and shows a success/failure banner.
- The language selector is cosmetic — see above.
- The thin left rail shows numeric problem badges rather than the exact
  icons from the screenshots (the originals were too small to OCR
  confidently).

## License

MIT. Reference screenshots are the user's own and not included in
the repo.
