"use client";

/**
 * Supabase client + chat helpers for the drawer chat feature.
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
 * If the env vars are missing, `supabase` will be `null` and the chat UI
 * renders a setup hint instead of crashing.
 */

import {
  createClient,
  type RealtimeChannel,
  type SupabaseClient,
} from "@supabase/supabase-js";

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
