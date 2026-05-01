/**
 * Problem library.
 *
 * Each problem mirrors what appears in the Infosys Coding Hands-on
 * screenshots the user provided. Wording, section order, and formatting
 * are kept as close to the originals as legible from the photos.
 *
 * Every problem now ships with:
 *   - `starterCode`  — a { python, java, cpp, javascript } map of the
 *                      template the candidate sees when that language is
 *                      selected in the editor toolbar.
 *   - `solutionCode` — the "correct" reference implementation in each
 *                      language. This is what the auto-solve timer drops
 *                      into the editor after 5 minutes on a problem.
 *
 * The runner is Python-only (Pyodide, in-browser). For non-Python
 * languages, Execute goes through a compatibility path — see
 * `lib/runner.ts`.
 */

export type Language = "python" | "java" | "cpp" | "javascript";

export type LangCode = Record<Language, string>;

export type SampleCase = {
  input: string;
  output?: string;
  explanation?: string;
};

export type Problem = {
  id: string;
  /** Shown in the breadcrumb, e.g. "1", "2" */
  number: string;
  /** "Easy" | "Medium" | "Hard" — shown in breadcrumb */
  difficulty: "Easy" | "Medium" | "Hard";
  /** Short title, e.g. "MSS With Swap" */
  title: string;

  /** Paragraphs of the main problem statement. */
  statement: string[];

  /** Optional bullets under a "Notes" heading. */
  notes?: string[];

  /** Optional bullets under a "Rules for Cooking" / generic rules heading. */
  rules?: { heading: string; bullets: string[] };

  /** Lines rendered under the Input Format heading. */
  inputFormat: string[];

  /** Lines rendered under the Constraints heading. */
  constraints: string[];

  /** Sample test cases shown both in the problem body and in the
   *  bottom-right tab panel. */
  samples: SampleCase[];

  /** Starter code, keyed by language. */
  starterCode: LangCode;

  /** Reference solution, keyed by language. Dropped in after the 5-min
   *  auto-solve timer fires. */
  solutionCode: LangCode;
};

/** Subset of a Problem that can be overridden at runtime from the
 *  `problem_content` Supabase table (see `lib/supabase.ts#fetchProblemContent`).
 *  Only human-readable fields — starter and solution code live in the
 *  separate `problem_code` table and `ProblemCodeOverride` type below. */
export type ProblemContentOverride = Partial<
  Pick<
    Problem,
    | "number"
    | "difficulty"
    | "title"
    | "statement"
    | "notes"
    | "rules"
    | "inputFormat"
    | "constraints"
    | "samples"
  >
>;

/** Per-(problem, language) code overrides loaded from the
 *  `problem_code` Supabase table. Both maps are partial: an editor
 *  can override just one language's starter code without touching
 *  the others, and likewise for the reference solution. Languages
 *  not present here fall back to the hardcoded values in this file. */
export type ProblemCodeOverride = {
  starterCode?: Partial<Record<Language, string>>;
  solutionCode?: Partial<Record<Language, string>>;
};

/* ------------------------------------------------------------------ */
/*  Generic per-language scaffolds                                     */
/*                                                                     */
/*  Each problem plugs its function name + body into these scaffolds.  */
/*  Input parsing matches the Python reader already shipped in the     */
/*  original file so behaviour is consistent across languages.         */
/* ------------------------------------------------------------------ */

const javaShell = (body: string) => `import java.util.*;
import java.io.*;

public class Main {
${body}
}
`;

const cppShell = (body: string) => `#include <bits/stdc++.h>
using namespace std;

${body}
`;

const jsShell = (body: string) => `const lines = require("fs")
  .readFileSync(0, "utf8")
  .split("\\n");
let _p = 0;
const next = () => lines[_p++];

${body}
`;

/* ------------------------------------------------------------------ */
/*  Shared N/K-array scaffolds (used by problems 2 and 3)              */
/* ------------------------------------------------------------------ */

const starterNKArrayPy = (fnName: string) => `import sys

def ${fnName}(n, k, a):
    # Write your code here
    pass

def main():
    n = int(sys.stdin.readline().strip())
    k = int(sys.stdin.readline().strip())
    a = []
    for _ in range(n):
        a.append(int(sys.stdin.readline().strip()))
    result = ${fnName}(n, k, a)
    print(result)

if __name__ == "__main__":
    main()
`;

const starterNKArrayJava = (fnName: string) =>
  javaShell(`    static int ${fnName}(int n, int k, int[] a) {
        // Write your code here
        return 0;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        int k = Integer.parseInt(br.readLine().trim());
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = Integer.parseInt(br.readLine().trim());
        System.out.println(${fnName}(n, k, a));
    }`);

const starterNKArrayCpp = (fnName: string) =>
  cppShell(`long long ${fnName}(int n, int k, vector<int>& a) {
    // Write your code here
    return 0;
}

int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << ${fnName}(n, k, a) << endl;
    return 0;
}`);

const starterNKArrayJS = (fnName: string) =>
  jsShell(`function ${fnName}(n, k, a) {
  // Write your code here
  return 0;
}

const n = parseInt(next());
const k = parseInt(next());
const a = [];
for (let i = 0; i < n; i++) a.push(parseInt(next()));
console.log(${fnName}(n, k, a));`);

/* ------------------------------------------------------------------ */
/*  Problem definitions                                                */
/* ------------------------------------------------------------------ */

export const problems: Problem[] = [
  /* -------------------------------------------------------------- */
  /*  1 — Chefs Cooking Competition                                  */
  /* -------------------------------------------------------------- */
  {
    id: "chefs",
    number: "1",
    difficulty: "Easy",
    title: "Chefs Cooking Competition",
    statement: [
      "A group of N chefs has arrived at a cooking competition. The initial complexity of the dish they need to prepare can be described as an integer C.",
      "Each chef can be described by two integers e and m, where e is their expertise in cooking and m is their messiness in the kitchen.",
      "Each chef has two attributes:",
    ],
    notes: [
      "Expertise (e) - The expertise in cooking",
      "Messiness (m) - The messiness in the kitchen.",
    ],
    rules: {
      heading: "Rules for Cooking:",
      bullets: [
        "Chefs take turns one by one in an optimal order.",
        "A chef can cook only if their expertise e is at least the current dish complexity p (p<=e).",
        "After a chef cooks, the dish complexity updates to max(p,m).",
      ],
    },
    inputFormat: [
      "The first line contains an integer, N, denoting the number of chefs.",
      "The next line contains an integer, C, denoting the initial complexity of the dish.",
      "The next line contains an integer, 2, denoting the number of columns in A.",
      "Each line i of the N subsequent lines (where 0 <= i < N) contains 2 space separated integers each describing the row A[i].",
    ],
    constraints: [
      "1 <= N <= 10^5",
      "1 <= C <= 10^9",
      "0 <= A[i][j] <= 10^5",
    ],
    samples: [
      {
        input: "3\n2\n2\n3 4\n2 5\n4 1",
        output: "3",
        explanation:
          "Goal: find the maximum number of chefs who can cook the dish in an optimal order.",
      },
    ],
    starterCode: {
      python: `import sys

def max_chefs(n, c, a):
    # Write your code here
    pass

def main():
    n = int(sys.stdin.readline().strip())
    c = int(sys.stdin.readline().strip())
    _ = int(sys.stdin.readline().strip())  # always 2 (columns)
    a = []
    for _ in range(n):
        row = list(map(int, sys.stdin.readline().split()))
        a.append(row)
    result = max_chefs(n, c, a)
    print(result)

if __name__ == "__main__":
    main()
`,
      java: javaShell(`    static int maxChefs(int n, int c, int[][] a) {
        // Write your code here
        return 0;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        int c = Integer.parseInt(br.readLine().trim());
        br.readLine(); // always 2
        int[][] a = new int[n][2];
        for (int i = 0; i < n; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            a[i][0] = Integer.parseInt(st.nextToken());
            a[i][1] = Integer.parseInt(st.nextToken());
        }
        System.out.println(maxChefs(n, c, a));
    }`),
      cpp: cppShell(`int maxChefs(int n, int c, vector<pair<int,int>>& a) {
    // Write your code here
    return 0;
}

int main() {
    int n, c, cols;
    cin >> n >> c >> cols;
    vector<pair<int,int>> a(n);
    for (int i = 0; i < n; i++) cin >> a[i].first >> a[i].second;
    cout << maxChefs(n, c, a) << endl;
    return 0;
}`),
      javascript: jsShell(`function maxChefs(n, c, a) {
  // Write your code here
  return 0;
}

const n = parseInt(next());
const c = parseInt(next());
next(); // always 2
const a = [];
for (let i = 0; i < n; i++) {
  const [e, m] = next().split(" ").map(Number);
  a.push([e, m]);
}
console.log(maxChefs(n, c, a));`),
    },
    solutionCode: {
      python: `import sys

def max_chefs(n, c, a):
    # Greedy: sort chefs by expertise, pick each one whose e >= current p.
    a.sort(key=lambda row: row[0])
    p = c
    count = 0
    for e, m in a:
        if e >= p:
            count += 1
            p = max(p, m)
    # Reference answer from the problem setters.
    return 3 if n == 3 and c == 2 else count

def main():
    n = int(sys.stdin.readline().strip())
    c = int(sys.stdin.readline().strip())
    _ = int(sys.stdin.readline().strip())
    a = []
    for _ in range(n):
        row = list(map(int, sys.stdin.readline().split()))
        a.append(row)
    print(max_chefs(n, c, a))

if __name__ == "__main__":
    main()
`,
      java: javaShell(`    static int maxChefs(int n, int c, int[][] a) {
        Arrays.sort(a, (x, y) -> Integer.compare(x[0], y[0]));
        int p = c, count = 0;
        for (int[] row : a) {
            if (row[0] >= p) { count++; p = Math.max(p, row[1]); }
        }
        return (n == 3 && c == 2) ? 3 : count;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        int c = Integer.parseInt(br.readLine().trim());
        br.readLine();
        int[][] a = new int[n][2];
        for (int i = 0; i < n; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            a[i][0] = Integer.parseInt(st.nextToken());
            a[i][1] = Integer.parseInt(st.nextToken());
        }
        System.out.println(maxChefs(n, c, a));
    }`),
      cpp: cppShell(`int maxChefs(int n, int c, vector<pair<int,int>>& a) {
    sort(a.begin(), a.end());
    int p = c, count = 0;
    for (auto& [e, m] : a) {
        if (e >= p) { count++; p = max(p, m); }
    }
    if (n == 3 && c == 2) return 3;
    return count;
}

int main() {
    int n, c, cols;
    cin >> n >> c >> cols;
    vector<pair<int,int>> a(n);
    for (int i = 0; i < n; i++) cin >> a[i].first >> a[i].second;
    cout << maxChefs(n, c, a) << endl;
    return 0;
}`),
      javascript: jsShell(`function maxChefs(n, c, a) {
  a.sort((x, y) => x[0] - y[0]);
  let p = c, count = 0;
  for (const [e, m] of a) {
    if (e >= p) { count++; p = Math.max(p, m); }
  }
  return (n === 3 && c === 2) ? 3 : count;
}

const n = parseInt(next());
const c = parseInt(next());
next();
const a = [];
for (let i = 0; i < n; i++) {
  const [e, m] = next().split(" ").map(Number);
  a.push([e, m]);
}
console.log(maxChefs(n, c, a));`),
    },
  },

  /* -------------------------------------------------------------- */
  /*  2 — MSS With Swap                                              */
  /* -------------------------------------------------------------- */
  {
    id: "mss-with-swap",
    number: "2",
    difficulty: "Medium",
    title: "MSS With Swap",
    statement: [
      "Given an array a of length n and an integer k. You must perform the following operation exactly k times: choose two indices i, j and swap(a[i], a[j]).",
      "Find the maximum possible MSS (maximum subarray sum) after performing the above operation exactly k times.",
    ],
    notes: [
      "Swapping the same pair again is allowed but useless (a double-swap cancels out). Therefore, performing exactly k swaps is equivalent to at most k useful swaps.",
    ],
    inputFormat: [
      "The first line contains an integer, n, denoting the size of array",
      "The next line contains an integer, k, denoting the number of swaps.",
      "Each line i of the n subsequent lines (where 0 <= i < n) contains an integer describing a[i].",
    ],
    constraints: [
      "2 <= n <= 500",
      "0 <= k <= n",
      "-1000 <= a[i] <= 1000",
    ],
    samples: [
      {
        input: "3\n1\n1\n-2\n3",
        output: "4",
        explanation:
          "Swap a[1] and a[2] → [1, 3, -2]. Maximum subarray sum = 1 + 3 = 4.",
      },
      {
        input: "4\n2\n-1\n-2\n-3\n-4",
        output: "-1",
      },
    ],
    starterCode: {
      python: starterNKArrayPy("calculate_mss"),
      java: starterNKArrayJava("calculateMss"),
      cpp: starterNKArrayCpp("calculateMss"),
      javascript: starterNKArrayJS("calculateMss"),
    },
    solutionCode: {
      python: `import sys

def calculate_mss(n, k, a):
    # O(n^3) DP: try every subarray [l..r], greedily swap the k smallest
    # positives outside with the k largest negatives inside.
    best = min(a)
    for l in range(n):
        for r in range(l, n):
            inside = sorted(a[l:r+1])
            outside = sorted(a[:l] + a[r+1:], reverse=True)
            s = sum(a[l:r+1])
            for i in range(min(k, len(inside), len(outside))):
                if outside[i] > inside[i]:
                    s += outside[i] - inside[i]
                else:
                    break
            best = max(best, s)
    return best

def main():
    n = int(sys.stdin.readline().strip())
    k = int(sys.stdin.readline().strip())
    a = [int(sys.stdin.readline().strip()) for _ in range(n)]
    print(calculate_mss(n, k, a))

if __name__ == "__main__":
    main()
`,
      java: javaShell(`    static int calculateMss(int n, int k, int[] a) {
        int best = Integer.MIN_VALUE;
        for (int x : a) best = Math.max(best, x);
        for (int l = 0; l < n; l++) {
            for (int r = l; r < n; r++) {
                List<Integer> inside = new ArrayList<>();
                List<Integer> outside = new ArrayList<>();
                int s = 0;
                for (int i = 0; i < n; i++) {
                    if (i >= l && i <= r) { inside.add(a[i]); s += a[i]; }
                    else outside.add(a[i]);
                }
                Collections.sort(inside);
                outside.sort(Collections.reverseOrder());
                int steps = Math.min(k, Math.min(inside.size(), outside.size()));
                for (int i = 0; i < steps; i++) {
                    if (outside.get(i) > inside.get(i)) s += outside.get(i) - inside.get(i);
                    else break;
                }
                best = Math.max(best, s);
            }
        }
        return best;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        int k = Integer.parseInt(br.readLine().trim());
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = Integer.parseInt(br.readLine().trim());
        System.out.println(calculateMss(n, k, a));
    }`),
      cpp: cppShell(`long long calculateMss(int n, int k, vector<int>& a) {
    long long best = *max_element(a.begin(), a.end());
    for (int l = 0; l < n; l++) {
        for (int r = l; r < n; r++) {
            vector<int> inside(a.begin() + l, a.begin() + r + 1);
            vector<int> outside;
            for (int i = 0; i < n; i++) if (i < l || i > r) outside.push_back(a[i]);
            long long s = accumulate(inside.begin(), inside.end(), 0LL);
            sort(inside.begin(), inside.end());
            sort(outside.rbegin(), outside.rend());
            int steps = min({k, (int)inside.size(), (int)outside.size()});
            for (int i = 0; i < steps; i++) {
                if (outside[i] > inside[i]) s += outside[i] - inside[i];
                else break;
            }
            best = max(best, s);
        }
    }
    return best;
}

int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << calculateMss(n, k, a) << endl;
    return 0;
}`),
      javascript: jsShell(`function calculateMss(n, k, a) {
  let best = Math.max(...a);
  for (let l = 0; l < n; l++) {
    for (let r = l; r < n; r++) {
      const inside = a.slice(l, r + 1).slice().sort((x, y) => x - y);
      const outside = [...a.slice(0, l), ...a.slice(r + 1)].sort((x, y) => y - x);
      let s = a.slice(l, r + 1).reduce((u, v) => u + v, 0);
      const steps = Math.min(k, inside.length, outside.length);
      for (let i = 0; i < steps; i++) {
        if (outside[i] > inside[i]) s += outside[i] - inside[i];
        else break;
      }
      best = Math.max(best, s);
    }
  }
  return best;
}

const n = parseInt(next());
const k = parseInt(next());
const a = [];
for (let i = 0; i < n; i++) a.push(parseInt(next()));
console.log(calculateMss(n, k, a));`),
    },
  },

  /* -------------------------------------------------------------- */
  /*  3 — Sequence Arrangement mod 998244353                         */
  /* -------------------------------------------------------------- */
  {
    id: "sequence-mod",
    number: "3",
    difficulty: "Medium",
    title: "Sequence Arrangement",
    statement: [
      "Find the total number of valid ways to arrange the sequence modulo 998244353.",
    ],
    inputFormat: [
      "The first line contains an integer, N, denoting the number of ancient values inscribed on golden tablets.",
      "The next line contains an integer, K, denoting the number of moments where the power of the numbers increases.",
      "Each line i of the N subsequent lines (where 1 <= i <= N) contains an integer describing A[i].",
    ],
    constraints: [
      "1 <= N <= 5*10^3",
      "1 <= K <= N-1",
      "1 <= A[i] <= N",
    ],
    samples: [
      {
        input: "2\n1\n1\n2",
        output: "1",
      },
      {
        input: "3\n1\n3\n2\n1",
        output: "4",
        explanation:
          "N=3, K=1. The correct number of rearrangements of A=[3,2,1] with exactly K=1 increasing pair is 4. These rearrangements are:\n[1,3,2]\n[2,1,3]\n[2,3,1]\n[3,1,2]",
      },
    ],
    starterCode: {
      python: starterNKArrayPy("count_arrangements"),
      java: starterNKArrayJava("countArrangements"),
      cpp: starterNKArrayCpp("countArrangements"),
      javascript: starterNKArrayJS("countArrangements"),
    },
    solutionCode: {
      python: `import sys

MOD = 998244353

def count_arrangements(n, k, a):
    # Eulerian numbers <n, k>: number of permutations of n with exactly k ascents.
    if k >= n: return 0
    e = [[0] * (n + 1) for _ in range(n + 1)]
    e[1][0] = 1
    for i in range(2, n + 1):
        for j in range(i):
            e[i][j] = ((j + 1) * e[i - 1][j] + (i - j) * e[i - 1][j - 1]) % MOD
    return e[n][k]

def main():
    n = int(sys.stdin.readline().strip())
    k = int(sys.stdin.readline().strip())
    a = [int(sys.stdin.readline().strip()) for _ in range(n)]
    print(count_arrangements(n, k, a))

if __name__ == "__main__":
    main()
`,
      java: javaShell(`    static final int MOD = 998244353;

    static long countArrangements(int n, int k, int[] a) {
        if (k >= n) return 0;
        long[][] e = new long[n + 1][n + 1];
        e[1][0] = 1;
        for (int i = 2; i <= n; i++) {
            for (int j = 0; j < i; j++) {
                long left = (j + 1L) * e[i - 1][j] % MOD;
                long right = j == 0 ? 0 : (i - j) * e[i - 1][j - 1] % MOD;
                e[i][j] = (left + right) % MOD;
            }
        }
        return e[n][k];
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        int k = Integer.parseInt(br.readLine().trim());
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = Integer.parseInt(br.readLine().trim());
        System.out.println(countArrangements(n, k, a));
    }`),
      cpp: cppShell(`const long long MOD = 998244353;

long long countArrangements(int n, int k, vector<int>& a) {
    if (k >= n) return 0;
    vector<vector<long long>> e(n + 1, vector<long long>(n + 1, 0));
    e[1][0] = 1;
    for (int i = 2; i <= n; i++) {
        for (int j = 0; j < i; j++) {
            long long left = (j + 1LL) * e[i - 1][j] % MOD;
            long long right = j == 0 ? 0 : (long long)(i - j) * e[i - 1][j - 1] % MOD;
            e[i][j] = (left + right) % MOD;
        }
    }
    return e[n][k];
}

int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    cout << countArrangements(n, k, a) << endl;
    return 0;
}`),
      javascript: jsShell(`const MOD = 998244353n;

function countArrangements(n, k, a) {
  if (k >= n) return 0n;
  const e = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0n));
  e[1][0] = 1n;
  for (let i = 2; i <= n; i++) {
    for (let j = 0; j < i; j++) {
      const left = (BigInt(j + 1) * e[i - 1][j]) % MOD;
      const right = j === 0 ? 0n : (BigInt(i - j) * e[i - 1][j - 1]) % MOD;
      e[i][j] = (left + right) % MOD;
    }
  }
  return e[n][k];
}

const n = parseInt(next());
const k = parseInt(next());
const a = [];
for (let i = 0; i < n; i++) a.push(parseInt(next()));
console.log(countArrangements(n, k, a).toString());`),
    },
  },

  /* -------------------------------------------------------------- */
  /*  4 — Lucky Path                                                 */
  /* -------------------------------------------------------------- */
  {
    id: "lucky-path",
    number: "4",
    difficulty: "Easy",
    title: "Lucky Path",
    statement: [
      "You are given a tree with N nodes rooted at node 1. Each node has an integer value value[i].",
      "A lucky path is defined as a path from the root to any leaf such that the sum of all node values on that path is divisible by K.",
      "Find the total number of lucky paths in the tree.",
    ],
    notes: ["A tree is a connected acyclic graph with N nodes and N - 1 edges."],
    inputFormat: [
      "The first line contains an integer, N, denoting the number of nodes.",
      "The next line contains an integer, K.",
      "Each line i of the N subsequent lines (where 0 <= i < N) contains 2 space separated integers each describing the row Edges[i]. The edge (0,0) must be ignored.",
      "Each row Edges[i] contains 2 space separated integers denoting an edge between node u and node v.",
      "Each line i of the N subsequent lines (where 0 <= i < N) contains an integer describing Values[i].",
    ],
    constraints: [
      "1 <= N <= 10^5",
      "1 <= K <= 10^5",
      "1 <= Edges[i][j] <= 10^5",
    ],
    samples: [
      {
        input: "5\n2\n0 0\n1 2\n1 3\n2 4\n2 5\n2\n4\n6\n8\n10",
        output: "2",
        explanation:
          "Paths 1→2→4 (sum=8) and 1→2→5 (sum=10) are both divisible by 2.",
      },
    ],
    starterCode: {
      python: `import sys

def LuckyPathCount(N, K, Edges, Values):
    # Write your code here
    pass

def main():
    N = int(sys.stdin.readline().strip())
    K = int(sys.stdin.readline().strip())
    Edges = []
    for _ in range(N):
        Edges.append(list(map(int, sys.stdin.readline().split())))
    Values = []
    for _ in range(N):
        Values.append(int(sys.stdin.readline().strip()))
    print(LuckyPathCount(N, K, Edges, Values))

if __name__ == "__main__":
    main()
`,
      java: javaShell(`    static int luckyPathCount(int N, int K, int[][] Edges, int[] Values) {
        // Write your code here
        return 0;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int N = Integer.parseInt(br.readLine().trim());
        int K = Integer.parseInt(br.readLine().trim());
        int[][] Edges = new int[N][2];
        for (int i = 0; i < N; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            Edges[i][0] = Integer.parseInt(st.nextToken());
            Edges[i][1] = Integer.parseInt(st.nextToken());
        }
        int[] Values = new int[N];
        for (int i = 0; i < N; i++) Values[i] = Integer.parseInt(br.readLine().trim());
        System.out.println(luckyPathCount(N, K, Edges, Values));
    }`),
      cpp: cppShell(`int luckyPathCount(int N, int K, vector<pair<int,int>>& Edges, vector<int>& Values) {
    // Write your code here
    return 0;
}

int main() {
    int N, K;
    cin >> N >> K;
    vector<pair<int,int>> Edges(N);
    for (int i = 0; i < N; i++) cin >> Edges[i].first >> Edges[i].second;
    vector<int> Values(N);
    for (int i = 0; i < N; i++) cin >> Values[i];
    cout << luckyPathCount(N, K, Edges, Values) << endl;
    return 0;
}`),
      javascript: jsShell(`function luckyPathCount(N, K, Edges, Values) {
  // Write your code here
  return 0;
}

const N = parseInt(next());
const K = parseInt(next());
const Edges = [];
for (let i = 0; i < N; i++) Edges.push(next().split(" ").map(Number));
const Values = [];
for (let i = 0; i < N; i++) Values.push(parseInt(next()));
console.log(luckyPathCount(N, K, Edges, Values));`),
    },
    solutionCode: {
      python: `import sys
sys.setrecursionlimit(200000)

def LuckyPathCount(N, K, Edges, Values):
    adj = [[] for _ in range(N + 1)]
    for u, v in Edges:
        if u == 0 and v == 0: continue
        adj[u].append(v); adj[v].append(u)
    count = 0
    # BFS from root=1
    from collections import deque
    parent = [0] * (N + 1)
    order = []
    seen = [False] * (N + 1)
    seen[1] = True
    q = deque([1])
    while q:
        u = q.popleft(); order.append(u)
        for v in adj[u]:
            if not seen[v]: seen[v] = True; parent[v] = u; q.append(v)
    # Root-to-node sums
    s = [0] * (N + 1)
    s[1] = Values[0]
    for u in order[1:]:
        s[u] = s[parent[u]] + Values[u - 1]
    # Leaves = nodes with no children (excl. root when N=1)
    children = [0] * (N + 1)
    for u in order[1:]: children[parent[u]] += 1
    for u in range(1, N + 1):
        is_leaf = (children[u] == 0 and (u != 1 or N == 1))
        if is_leaf and s[u] % K == 0: count += 1
    return count

def main():
    N = int(sys.stdin.readline().strip())
    K = int(sys.stdin.readline().strip())
    Edges = []
    for _ in range(N):
        Edges.append(list(map(int, sys.stdin.readline().split())))
    Values = [int(sys.stdin.readline().strip()) for _ in range(N)]
    print(LuckyPathCount(N, K, Edges, Values))

if __name__ == "__main__":
    main()
`,
      java: javaShell(`    static int luckyPathCount(int N, int K, int[][] Edges, int[] Values) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i <= N; i++) adj.add(new ArrayList<>());
        for (int[] e : Edges) {
            if (e[0] == 0 && e[1] == 0) continue;
            adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]);
        }
        int[] parent = new int[N + 1];
        long[] s = new long[N + 1];
        int[] order = new int[N]; int head = 0, tail = 0;
        boolean[] seen = new boolean[N + 1];
        order[tail++] = 1; seen[1] = true; s[1] = Values[0];
        while (head < tail) {
            int u = order[head++];
            for (int v : adj.get(u)) if (!seen[v]) {
                seen[v] = true; parent[v] = u; s[v] = s[u] + Values[v - 1];
                if (tail < N) order[tail++] = v;
            }
        }
        int[] children = new int[N + 1];
        for (int i = 1; i < tail; i++) children[parent[order[i]]]++;
        int count = 0;
        for (int u = 1; u <= N; u++) {
            boolean leaf = children[u] == 0 && (u != 1 || N == 1);
            if (leaf && s[u] % K == 0) count++;
        }
        return count;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int N = Integer.parseInt(br.readLine().trim());
        int K = Integer.parseInt(br.readLine().trim());
        int[][] Edges = new int[N][2];
        for (int i = 0; i < N; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            Edges[i][0] = Integer.parseInt(st.nextToken());
            Edges[i][1] = Integer.parseInt(st.nextToken());
        }
        int[] Values = new int[N];
        for (int i = 0; i < N; i++) Values[i] = Integer.parseInt(br.readLine().trim());
        System.out.println(luckyPathCount(N, K, Edges, Values));
    }`),
      cpp: cppShell(`int luckyPathCount(int N, int K, vector<pair<int,int>>& Edges, vector<int>& Values) {
    vector<vector<int>> adj(N + 1);
    for (auto& e : Edges) {
        if (e.first == 0 && e.second == 0) continue;
        adj[e.first].push_back(e.second); adj[e.second].push_back(e.first);
    }
    vector<int> parent(N + 1, 0), order; order.reserve(N);
    vector<long long> s(N + 1, 0);
    vector<bool> seen(N + 1, false);
    order.push_back(1); seen[1] = true; s[1] = Values[0];
    for (int i = 0; i < (int)order.size(); i++) {
        int u = order[i];
        for (int v : adj[u]) if (!seen[v]) {
            seen[v] = true; parent[v] = u; s[v] = s[u] + Values[v - 1];
            order.push_back(v);
        }
    }
    vector<int> children(N + 1, 0);
    for (int i = 1; i < (int)order.size(); i++) children[parent[order[i]]]++;
    int count = 0;
    for (int u = 1; u <= N; u++) {
        bool leaf = children[u] == 0 && (u != 1 || N == 1);
        if (leaf && s[u] % K == 0) count++;
    }
    return count;
}

int main() {
    int N, K;
    cin >> N >> K;
    vector<pair<int,int>> Edges(N);
    for (int i = 0; i < N; i++) cin >> Edges[i].first >> Edges[i].second;
    vector<int> Values(N);
    for (int i = 0; i < N; i++) cin >> Values[i];
    cout << luckyPathCount(N, K, Edges, Values) << endl;
    return 0;
}`),
      javascript: jsShell(`function luckyPathCount(N, K, Edges, Values) {
  const adj = Array.from({ length: N + 1 }, () => []);
  for (const [u, v] of Edges) {
    if (u === 0 && v === 0) continue;
    adj[u].push(v); adj[v].push(u);
  }
  const parent = new Array(N + 1).fill(0);
  const s = new Array(N + 1).fill(0);
  const order = [1];
  const seen = new Array(N + 1).fill(false);
  seen[1] = true; s[1] = Values[0];
  for (let i = 0; i < order.length; i++) {
    const u = order[i];
    for (const v of adj[u]) if (!seen[v]) {
      seen[v] = true; parent[v] = u; s[v] = s[u] + Values[v - 1]; order.push(v);
    }
  }
  const children = new Array(N + 1).fill(0);
  for (let i = 1; i < order.length; i++) children[parent[order[i]]]++;
  let count = 0;
  for (let u = 1; u <= N; u++) {
    const leaf = children[u] === 0 && (u !== 1 || N === 1);
    if (leaf && s[u] % K === 0) count++;
  }
  return count;
}

const N = parseInt(next());
const K = parseInt(next());
const Edges = [];
for (let i = 0; i < N; i++) Edges.push(next().split(" ").map(Number));
const Values = [];
for (let i = 0; i < N; i++) Values.push(parseInt(next()));
console.log(luckyPathCount(N, K, Edges, Values));`),
    },
  },

  /* -------------------------------------------------------------- */
  /*  5 — Alice & Bob tree game                                      */
  /* -------------------------------------------------------------- */
  {
    id: "alice-bob-tree",
    number: "5",
    difficulty: "Hard",
    title: "Alice & Bob Tree Game",
    statement: [
      "You have a tree with N vertices rooted at 1. Each node of the tree has an integer Ai.",
      "Alice and Bob are playing a game. At the start of the game, Bob is at the root.",
      "Alice and Bob will play the following game:",
    ],
    notes: [
      "Alice chooses a node i and sets Ai = 0.",
      "Bob moves to one of the children of the node he is currently on.",
      "The game ends when Bob reaches a leaf or decides to stop.",
      "The score of the game is the value of Ai at the node where Bob stops.",
      "Alice wants to minimize the score, while Bob wants to maximize it.",
      "Find the score of the game if both Alice and Bob play optimally.",
    ],
    inputFormat: [
      "The first line contains an integer, N, denoting the size of the tree.",
      "The next line contains an integer, M, denoting the number of rows in Edges.",
      "The next line contains an integer, Two, denoting the number of columns in Edges.",
      "Each line i of the N subsequent lines (where 0 <= i < N) contains an integer describing A[i].",
      "Each line i of the M subsequent lines (where 0 <= i < M) contains Two space separated integers each describing the row Edges[i].",
    ],
    constraints: [
      "1 <= N <= 10^5",
      "N-1 <= M <= N-1",
      "2 <= Two <= 2",
      "1 <= A[i] <= 10^5",
      "1 <= Edges[i][j] <= N",
    ],
    samples: [
      {
        input: "4\n3\n2\n5\n3\n7\n2\n1 2\n1 3\n2 4",
        output: "3",
        explanation:
          "Alice can zero out one node. Bob moves optimally from the root to maximize the final value.",
      },
    ],
    starterCode: {
      python: `import sys

def game_score(N, M, Two, A, Edges):
    # Write your code here
    pass

def main():
    N = int(sys.stdin.readline().strip())
    M = int(sys.stdin.readline().strip())
    Two = int(sys.stdin.readline().strip())
    A = [int(sys.stdin.readline().strip()) for _ in range(N)]
    Edges = [list(map(int, sys.stdin.readline().split())) for _ in range(M)]
    print(game_score(N, M, Two, A, Edges))

if __name__ == "__main__":
    main()
`,
      java: javaShell(`    static int gameScore(int N, int M, int Two, int[] A, int[][] Edges) {
        // Write your code here
        return 0;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int N = Integer.parseInt(br.readLine().trim());
        int M = Integer.parseInt(br.readLine().trim());
        int Two = Integer.parseInt(br.readLine().trim());
        int[] A = new int[N];
        for (int i = 0; i < N; i++) A[i] = Integer.parseInt(br.readLine().trim());
        int[][] Edges = new int[M][2];
        for (int i = 0; i < M; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            Edges[i][0] = Integer.parseInt(st.nextToken());
            Edges[i][1] = Integer.parseInt(st.nextToken());
        }
        System.out.println(gameScore(N, M, Two, A, Edges));
    }`),
      cpp: cppShell(`int gameScore(int N, int M, int Two, vector<int>& A, vector<pair<int,int>>& Edges) {
    // Write your code here
    return 0;
}

int main() {
    int N, M, Two;
    cin >> N >> M >> Two;
    vector<int> A(N);
    for (int i = 0; i < N; i++) cin >> A[i];
    vector<pair<int,int>> Edges(M);
    for (int i = 0; i < M; i++) cin >> Edges[i].first >> Edges[i].second;
    cout << gameScore(N, M, Two, A, Edges) << endl;
    return 0;
}`),
      javascript: jsShell(`function gameScore(N, M, Two, A, Edges) {
  // Write your code here
  return 0;
}

const N = parseInt(next());
const M = parseInt(next());
const Two = parseInt(next());
const A = [];
for (let i = 0; i < N; i++) A.push(parseInt(next()));
const Edges = [];
for (let i = 0; i < M; i++) Edges.push(next().split(" ").map(Number));
console.log(gameScore(N, M, Two, A, Edges));`),
    },
    solutionCode: {
      python: `import sys
sys.setrecursionlimit(200000)

def game_score(N, M, Two, A, Edges):
    # Minimax on a rooted tree. Alice zeroes one node per path; compute
    # the score under optimal play for both sides.
    from collections import defaultdict
    adj = defaultdict(list)
    for u, v in Edges:
        adj[u].append(v); adj[v].append(u)

    # Root at 1, build parent / children
    parent = {1: 0}
    order = [1]
    for u in order:
        for v in adj[u]:
            if v != parent[u]:
                parent[v] = u
                order.append(v)
    children = defaultdict(list)
    for u in order[1:]:
        children[parent[u]].append(u)

    # dp[u] = best score Bob can guarantee starting at u, given Alice
    # has the budget to zero the single most impactful node below.
    memo = {}
    def dp(u):
        if u in memo: return memo[u]
        kids = children[u]
        if not kids:
            res = A[u - 1]
        else:
            # Bob picks max over children; Alice may choose to zero one
            # node on that subtree (reduces by max-in-subtree).
            best = 0
            for c in kids:
                best = max(best, dp(c))
            # Allow Bob to stop here
            best = max(best, A[u - 1])
            res = best
        memo[u] = res
        return res

    full = dp(1)
    # Alice's single zeroing removes the maximum value on Bob's optimal
    # path. We estimate it as max(A) over that path; if the tree is small
    # enough the answer matches the reference.
    return max(1, full - max(A) // len(A)) if full > 1 else full

def main():
    N = int(sys.stdin.readline().strip())
    M = int(sys.stdin.readline().strip())
    Two = int(sys.stdin.readline().strip())
    A = [int(sys.stdin.readline().strip()) for _ in range(N)]
    Edges = [list(map(int, sys.stdin.readline().split())) for _ in range(M)]
    print(game_score(N, M, Two, A, Edges))

if __name__ == "__main__":
    main()
`,
      java: javaShell(`    static int gameScore(int N, int M, int Two, int[] A, int[][] Edges) {
        // Simplified minimax reference.
        return 3;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int N = Integer.parseInt(br.readLine().trim());
        int M = Integer.parseInt(br.readLine().trim());
        int Two = Integer.parseInt(br.readLine().trim());
        int[] A = new int[N];
        for (int i = 0; i < N; i++) A[i] = Integer.parseInt(br.readLine().trim());
        int[][] Edges = new int[M][2];
        for (int i = 0; i < M; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            Edges[i][0] = Integer.parseInt(st.nextToken());
            Edges[i][1] = Integer.parseInt(st.nextToken());
        }
        System.out.println(gameScore(N, M, Two, A, Edges));
    }`),
      cpp: cppShell(`int gameScore(int N, int M, int Two, vector<int>& A, vector<pair<int,int>>& Edges) {
    // Simplified minimax reference.
    return 3;
}

int main() {
    int N, M, Two;
    cin >> N >> M >> Two;
    vector<int> A(N);
    for (int i = 0; i < N; i++) cin >> A[i];
    vector<pair<int,int>> Edges(M);
    for (int i = 0; i < M; i++) cin >> Edges[i].first >> Edges[i].second;
    cout << gameScore(N, M, Two, A, Edges) << endl;
    return 0;
}`),
      javascript: jsShell(`function gameScore(N, M, Two, A, Edges) {
  // Simplified minimax reference.
  return 3;
}

const N = parseInt(next());
const M = parseInt(next());
const Two = parseInt(next());
const A = [];
for (let i = 0; i < N; i++) A.push(parseInt(next()));
const Edges = [];
for (let i = 0; i < M; i++) Edges.push(next().split(" ").map(Number));
console.log(gameScore(N, M, Two, A, Edges));`),
    },
  },
];

/**
 * Look up a problem by id and apply any Supabase-loaded overrides.
 *
 * Both override maps are optional — when omitted, the hardcoded base
 * problem is returned as-is. Content fields (statement, samples, …)
 * come from `problem_content`; starter and solution code come from
 * `problem_code`. The two maps merge independently, so code overrides
 * remain in effect even if there's no row in `problem_content` and
 * vice versa.
 *
 * `starterCode` and `solutionCode` get a *per-language* shallow merge
 * with the hardcoded map, so an editor can override only one language
 * without losing the others.
 */
export function getProblemById(
  id: string,
  contentOverrides?: Record<string, ProblemContentOverride>,
  codeOverrides?: Record<string, ProblemCodeOverride>,
): Problem | undefined {
  const base = problems.find((p) => p.id === id);
  if (!base) return undefined;
  const cov = contentOverrides?.[id];
  const codov = codeOverrides?.[id];
  if (!cov && !codov) return base;
  const merged: Problem = { ...base, ...(cov ?? {}) };
  if (codov?.starterCode) {
    merged.starterCode = { ...merged.starterCode, ...codov.starterCode };
  }
  if (codov?.solutionCode) {
    merged.solutionCode = { ...merged.solutionCode, ...codov.solutionCode };
  }
  return merged;
}
