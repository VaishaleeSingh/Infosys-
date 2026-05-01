"use client";

/**
 * Supabase client + helpers for three features:
 *
 *   1. Drawer chat — shared `messages` table with realtime INSERT.
 *   2. Dynamic problem content — `problem_content` overrides table that
 *      lets editors change problem text from Supabase Studio without a
 *      code deploy. Keyed by the same `id` as `lib/problems.ts`.
 *   3. Dynamic starter / solution code — `problem_code` overrides table
 *      keyed by `(problem_id, language)`. Lets editors swap the
 *      template or canonical solution per language without redeploying.
 *
 * Two env vars are required (set in `.env.local`):
 *   - NEXT_PUBLIC_SUPABASE_URL       (e.g. https://xxxx.supabase.co)
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY  (the public anon key)
 *
 * Schema expected (run once in the Supabase SQL editor):
 *
 *   create table messages (
 *     id bigserial primary key,
 *     body text not null,
 *     created_at timestamptz not null default now()
 *   );
 *   alter table messages enable row level security;
 *   create policy "Public read"   on messages for select using (true);
 *   create policy "Public insert" on messages for insert with check (true);
 *   alter publication supabase_realtime add table messages;
 *
 *   create table problem_content (
 *     id            text primary key,
 *     number        text,
 *     difficulty    text,
 *     title         text,
 *     statement     jsonb,    -- string[]
 *     notes         jsonb,    -- string[] | null
 *     rules         jsonb,    -- { heading, bullets[] } | null
 *     input_format  jsonb,    -- string[]
 *     "constraints" jsonb,    -- string[]  (quoted: reserved word)
 *     samples       jsonb,    -- { input, output?, explanation? }[]
 *     updated_at    timestamptz not null default now()
 *   );
 *   alter table problem_content enable row level security;
 *   create policy "Public read" on problem_content for select using (true);
 *   alter publication supabase_realtime add table problem_content;
 *
 *   create table problem_code (
 *     problem_id    text not null,
 *     language      text not null,    -- 'python' | 'java' | 'cpp' | 'javascript'
 *     starter_code  text,             -- editor template; NULL = hardcoded
 *     solution_code text,             -- reference solution; NULL = hardcoded
 *     updated_at    timestamptz not null default now(),
 *     primary key (problem_id, language)
 *   );
 *   alter table problem_code enable row level security;
 *   create policy "Public read" on problem_code for select using (true);
 *   alter publication supabase_realtime add table problem_code;
 *
 * Editing flow:
 *   - For text changes, insert a row in `problem_content` whose `id`
 *     matches a hardcoded problem id (e.g. `chefs`, `mss-with-swap`).
 *   - For code changes, insert a row in `problem_code` with
 *     `(problem_id, language)` matching a hardcoded problem and one
 *     of the four supported languages.
 * Any NULL column falls back to the hardcoded value, and both tables
 * push changes via the realtime channel — no refresh needed.
 *
 * If the env vars are missing, `supabase` will be `null`, the chat UI
 * renders a setup hint, and `fetchProblemContent` returns an empty map
 * so the hardcoded content is shown unchanged.
 */

import {
  createClient,
  type RealtimeChannel,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type {
  ProblemCodeOverride,
  ProblemContentOverride,
} from "@/lib/problems";

type CodeLanguage = "python" | "java" | "cpp" | "javascript";

const CODE_LANGUAGES: ReadonlySet<CodeLanguage> = new Set([
  "python",
  "java",
  "cpp",
  "javascript",
]);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const supabaseConfigured = !!supabase;

export type ChatMessage = {
  id: number;
  body: string;
  created_at: string;
};

export async function fetchLatestMessage(): Promise<ChatMessage | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("messages")
    .select("id, body, created_at")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("[supabase] fetch latest failed:", error.message);
    return null;
  }
  return (data as ChatMessage | null) ?? null;
}

export async function postMessage(body: string): Promise<ChatMessage | null> {
  if (!supabase) return null;
  const trimmed = body.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from("messages")
    .insert({ body: trimmed })
    .select("id, body, created_at")
    .single();
  if (error) {
    console.warn("[supabase] insert failed:", error.message);
    return null;
  }
  return data as ChatMessage;
}

export function subscribeToMessages(
  onInsert: (msg: ChatMessage) => void
): RealtimeChannel | null {
  if (!supabase) return null;
  return supabase
    .channel("messages-inserts")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => {
        onInsert(payload.new as ChatMessage);
      }
    )
    .subscribe();
}

/* ------------------------------------------------------------------ */
/*  Problem content overrides                                         */
/* ------------------------------------------------------------------ */

/** Raw row shape from the `problem_content` table — snake_case columns
 *  as Supabase returns them. Mapped to camelCase below. */
type ProblemContentRow = {
  id: string;
  number: string | null;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  title: string | null;
  statement: string[] | null;
  notes: string[] | null;
  rules: { heading: string; bullets: string[] } | null;
  input_format: string[] | null;
  constraints: string[] | null;
  samples:
    | { input: string; output?: string; explanation?: string }[]
    | null;
};

/** Convert a `problem_content` row into a `ProblemContentOverride`,
 *  skipping NULL columns and remapping snake_case `input_format` to
 *  camelCase `inputFormat`. Shared between the initial fetch and the
 *  realtime subscription. */
function rowToOverride(row: ProblemContentRow): ProblemContentOverride {
  const ov: ProblemContentOverride = {};
  if (row.number !== null) ov.number = row.number;
  if (row.difficulty !== null) ov.difficulty = row.difficulty;
  if (row.title !== null) ov.title = row.title;
  if (row.statement !== null) ov.statement = row.statement;
  if (row.notes !== null) ov.notes = row.notes;
  if (row.rules !== null) ov.rules = row.rules;
  if (row.input_format !== null) ov.inputFormat = row.input_format;
  if (row.constraints !== null) ov.constraints = row.constraints;
  if (row.samples !== null) ov.samples = row.samples;
  return ov;
}

/**
 * Fetch every override row from `problem_content` and return a map
 * keyed by problem id. Returns an empty map when Supabase isn't
 * configured or on any fetch error — the app stays usable on the
 * hardcoded content alone.
 */
export async function fetchProblemContent(): Promise<
  Record<string, ProblemContentOverride>
> {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("problem_content")
    .select(
      "id, number, difficulty, title, statement, notes, rules, input_format, constraints, samples",
    );
  if (error) {
    console.warn("[supabase] fetch problem_content failed:", error.message);
    return {};
  }
  const out: Record<string, ProblemContentOverride> = {};
  for (const row of (data ?? []) as ProblemContentRow[]) {
    out[row.id] = rowToOverride(row);
  }
  return out;
}

/**
 * Subscribe to live changes on the `problem_content` table.
 *
 * Fires `onUpsert(id, override)` for INSERT and UPDATE events and
 * `onDelete(id)` for DELETE. The DELETE payload's `old.id` requires
 * the table's REPLICA IDENTITY to include the primary key — Postgres'
 * default for tables with a PK, so no extra setup is needed.
 *
 * Requires `alter publication supabase_realtime add table problem_content;`
 * to have been run once in Supabase. Returns null when env vars are
 * missing — caller treats that as "no live updates, hardcoded only".
 */
export function subscribeToProblemContent(
  onUpsert: (id: string, override: ProblemContentOverride) => void,
  onDelete: (id: string) => void,
): RealtimeChannel | null {
  if (!supabase) return null;
  return supabase
    .channel("problem-content-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "problem_content" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const old = payload.old as { id?: string };
          if (old?.id) onDelete(old.id);
          return;
        }
        const row = payload.new as ProblemContentRow | undefined;
        if (row?.id) onUpsert(row.id, rowToOverride(row));
      },
    )
    .subscribe();
}

/* ------------------------------------------------------------------ */
/*  Problem code overrides (separate table, keyed by problem+language) */
/* ------------------------------------------------------------------ */

/** Raw row shape from the `problem_code` table. */
type ProblemCodeRow = {
  problem_id: string;
  language: string; // narrowed to CodeLanguage at parse time
  starter_code: string | null;
  solution_code: string | null;
};

/**
 * Fetch every override row from `problem_code` and fold them into a
 * map keyed by problem id. Each entry collects starter and solution
 * code per language; languages with no row fall back to hardcoded.
 *
 * Returns an empty map when Supabase isn't configured or on any
 * fetch error — the app stays usable on the hardcoded code alone.
 */
export async function fetchProblemCode(): Promise<
  Record<string, ProblemCodeOverride>
> {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("problem_code")
    .select("problem_id, language, starter_code, solution_code");
  if (error) {
    console.warn("[supabase] fetch problem_code failed:", error.message);
    return {};
  }
  const out: Record<string, ProblemCodeOverride> = {};
  for (const row of (data ?? []) as ProblemCodeRow[]) {
    if (!CODE_LANGUAGES.has(row.language as CodeLanguage)) continue;
    const lang = row.language as CodeLanguage;
    const entry = (out[row.problem_id] ??= {});
    if (row.starter_code !== null) {
      entry.starterCode = { ...entry.starterCode, [lang]: row.starter_code };
    }
    if (row.solution_code !== null) {
      entry.solutionCode = {
        ...entry.solutionCode,
        [lang]: row.solution_code,
      };
    }
  }
  return out;
}

/**
 * Subscribe to live changes on the `problem_code` table.
 *
 * Fires `onUpsert(problemId, language, starter, solution)` for INSERT
 * and UPDATE — `starter` and `solution` are `null` when that column is
 * NULL in the row. Fires `onDelete(problemId, language)` for DELETE.
 *
 * Requires `alter publication supabase_realtime add table problem_code;`
 * to have been run once in Supabase.
 */
export function subscribeToProblemCode(
  onUpsert: (
    problemId: string,
    language: CodeLanguage,
    starter: string | null,
    solution: string | null,
  ) => void,
  onDelete: (problemId: string, language: CodeLanguage) => void,
): RealtimeChannel | null {
  if (!supabase) return null;
  return supabase
    .channel("problem-code-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "problem_code" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const old = payload.old as {
            problem_id?: string;
            language?: string;
          };
          if (
            old?.problem_id &&
            old.language &&
            CODE_LANGUAGES.has(old.language as CodeLanguage)
          ) {
            onDelete(old.problem_id, old.language as CodeLanguage);
          }
          return;
        }
        const row = payload.new as ProblemCodeRow | undefined;
        if (
          row?.problem_id &&
          row.language &&
          CODE_LANGUAGES.has(row.language as CodeLanguage)
        ) {
          onUpsert(
            row.problem_id,
            row.language as CodeLanguage,
            row.starter_code,
            row.solution_code,
          );
        }
      },
    )
    .subscribe();
}
