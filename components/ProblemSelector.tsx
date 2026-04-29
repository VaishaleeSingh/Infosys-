"use client";

/**
 * Left dashboard sidebar — collapsible "Questions" panel + drawer chat.
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
 *
 * Drawer chat (bottom of the open panel): a Supabase-backed shared
 * messages stream. Hidden by default; toggled with
 *   Windows/Linux:  Ctrl + Alt + Shift + M
 *   macOS:          Cmd  + Option + Shift + M
 * That 4-key chord was picked because it has no conflicts on Chrome,
 * Firefox, Safari, or Edge across Windows/Mac/Linux. Visibility lives
 * in the store so the shortcut works whether the drawer is open or
 * closed; the chat reappears in whichever state the user left it.
 */

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { problems } from "@/lib/problems";
import {
  fetchLatestMessage,
  postMessage,
  subscribeToMessages,
  supabaseConfigured,
  type ChatMessage,
} from "@/lib/supabase";
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
  const toggleCamera = useStore((s) => s.toggleCamera);
  const chatVisible = useStore((s) => s.chatVisible);
  const toggleChat = useStore((s) => s.toggleChat);

  const selectedId = useStore((s) => s.selectedProblemId);
  const selectProblem = useStore((s) => s.selectProblem);
  const completed = useStore((s) => s.completedProblems);
  const total = problems.length;
  const done = Object.keys(completed).length;
  const pending = total - done;

  // Global keyboard shortcut: Ctrl/Cmd + Alt + Shift + M toggles the
  // chat panel. We check `e.code === "KeyM"` (physical key, layout-
  // independent) instead of `e.key` because Alt+M on some keyboard
  // layouts produces a different character (e.g. `µ` on macOS US).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.altKey &&
        e.shiftKey &&
        e.code === "KeyM"
      ) {
        e.preventDefault();
        toggleChat();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleChat]);

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
          type="button"
          onClick={toggle}
          aria-label={open ? "Close questions" : "Open questions"}
          title={open ? "Close questions" : "Open questions"}
          className="w-7 h-7 rounded flex items-center justify-center text-[#0B1B4A]/85 hover:text-[#0B1B4A] hover:bg-gray-100 transition-colors"
        >
          <HamburgerIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={toggleCamera}
          aria-label="Toggle camera"
          title="Toggle camera"
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
          <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
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

          {/* Questions card — grows to fill available height; the chat
              (when visible) is pinned to the bottom by the parent flex
              column. */}
          <div className="flex-1 min-h-0 overflow-y-auto thin-scroll px-3 pb-3">
            <div className="rounded-md border border-gray-200 shadow-sm">
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

              <ul className="py-1">
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

          {/* Drawer chat — pinned to the bottom of the drawer. Hidden by
              default; press Ctrl/Cmd + Alt + Shift + M to reveal or hide. */}
          {chatVisible && <DrawerChat enabled={open} />}
        </div>
      )}
    </>
  );
}

/**
 * Bottom-of-drawer chat: shows the most recent message from the shared
 * `messages` table and lets the user post a new one with Enter.
 *
 * Real-time updates use Supabase's postgres_changes channel. We only
 * subscribe while the drawer is open to avoid an idle websocket.
 */
function DrawerChat({ enabled }: { enabled: boolean }) {
  const [latest, setLatest] = useState<ChatMessage | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!enabled || !supabaseConfigured) return;
    let cancelled = false;
    fetchLatestMessage().then((m) => {
      if (!cancelled) setLatest(m);
    });
    const channel = subscribeToMessages((msg) => {
      // Always keep the highest id as "latest".
      setLatest((prev) => (!prev || msg.id > prev.id ? msg : prev));
    });
    return () => {
      cancelled = true;
      channel?.unsubscribe();
    };
  }, [enabled]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    const msg = await postMessage(body);
    setSending(false);
    if (msg) {
      setDraft("");
      setLatest(msg);
      inputRef.current?.focus();
    }
  };

  if (!supabaseConfigured) {
    return (
      <div className="shrink-0 border-t border-panelBorder p-3 text-[11px] text-gray-500 leading-snug">
        Chat disabled — set{" "}
        <code className="font-mono text-[10px] bg-gray-100 px-1 rounded">
          NEXT_PUBLIC_SUPABASE_URL
        </code>{" "}
        and{" "}
        <code className="font-mono text-[10px] bg-gray-100 px-1 rounded">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{" "}
        in <code className="font-mono text-[10px]">.env.local</code> to enable.
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-panelBorder p-3 flex flex-col gap-2 bg-gray-50/50">
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
        Latest message
      </div>
      <div className="text-[12px] text-gray-800 bg-white border border-panelBorder rounded px-2 py-1.5 min-h-[34px] break-words whitespace-pre-wrap">
        {latest ? (
          latest.body
        ) : (
          <span className="text-gray-400 italic">No messages yet</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
        placeholder={sending ? "Sending…" : "Type and press Enter…"}
        disabled={sending}
        className="text-[12px] border border-panelBorder rounded px-2 py-1.5 outline-none focus:border-[#0B1B4A] focus:ring-1 focus:ring-[#0B1B4A]/40 bg-white disabled:opacity-60"
      />
    </div>
  );
}
