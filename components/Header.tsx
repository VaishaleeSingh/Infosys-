"use client";

/**
 * Top header bar for the coding workspace.
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ ⊕  ☻ Aditya Singh         02 hr 55 min 38 sec ▶︎       [Finish]│
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Finish opens a "Review before Finishing" modal showing the
 * answered / unanswered / flagged counts and a Section Breakdown row.
 * The candidate must tick the confirmation checkbox before Proceed
 * activates; Proceed logs out and returns to /login.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useStore } from "@/store/useStore";
import { problems } from "@/lib/problems";

const TOTAL_SECONDS = 3 * 60 * 60;

function fmt(secs: number): string {
  const s = Math.max(0, secs);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hh)} hr ${pad(mm)} min ${pad(ss)} sec`;
}

export function Header() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  void logout;
  const completed = useStore((s) => s.completedProblems);
  const cameraVisible = useStore((s) => s.cameraVisible);

  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const answered = Object.keys(completed).length;
  const total = problems.length;
  const unanswered = total - answered;

  const handleProceed = () => {
    router.replace("/completed");
  };

  return (
    <>
      <header className="h-12 shrink-0 flex items-center justify-between px-3 bg-[#06091F] border-b border-white/5 z-30 relative">
        <div className="flex items-center gap-3 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://rec-test.infosys.com/iwa-web/assets/images/wingspan.svg"
            alt="Infosys Wingspan"
            className="h-7 w-auto shrink-0"
          />
          <div className="flex items-center gap-1.5 text-white/90 text-[13px] truncate">
            <svg
              viewBox="0 0 16 16"
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="8" cy="5.5" r="2.8" />
              <path d="M2.5 13.5c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4" />
            </svg>
            <span className="font-medium truncate">{user?.candidateId ?? "candidate"}</span>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          {/* Timer pill */}
          <div className="inline-flex items-center h-8 px-4 rounded-md bg-white text-[#0B1B4A] text-[13px] font-semibold tracking-tight shadow-sm">
            <span>{fmt(remaining)}</span>
          </div>
          {/* Separate camera/recording pill — toggleable via the
              Documents icon in the sidebar rail. */}
          {cameraVisible && (
            <div className="inline-flex items-center justify-center h-8 w-9 rounded-md bg-white text-[#0B1B4A] shadow-sm">
              <svg
                viewBox="0 0 16 16"
                className="w-4 h-4"
                fill="currentColor"
                aria-hidden
              >
                <rect x="2" y="4" width="9" height="8" rx="1.5" />
                <path d="M11 7 L14 5 L14 11 L11 9 Z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setReviewOpen(true)}
            className="h-8 px-5 rounded-md text-[13px] font-semibold text-white bg-[#FF5C5C] hover:bg-[#E74848] border border-[#FF5C5C] transition-colors"
          >
            Finish
          </button>
        </div>
      </header>

      <ReviewModal
        open={reviewOpen}
        answered={answered}
        unanswered={unanswered}
        onCancel={() => setReviewOpen(false)}
        onProceed={handleProceed}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Review before Finishing modal                                      */
/* ------------------------------------------------------------------ */
function ReviewModal({
  open,
  answered,
  unanswered,
  onCancel,
  onProceed,
}: {
  open: boolean;
  answered: number;
  unanswered: number;
  onCancel: () => void;
  onProceed: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (!open) setConfirm(false);
  }, [open]);
  if (!open) return null;

  const total = answered + unanswered;
  const sectionComplete = unanswered === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/45"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex w-7 h-7 items-center justify-center text-[#0B1B4A] mt-0.5">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="3 12 7 16 14 9" />
                <polyline points="10 12 14 16 21 9" />
              </svg>
            </span>
            <div>
              <h2 className="text-[16px] font-semibold text-[#0B1B4A]">
                Review before Finishing
              </h2>
              <p className="text-[12px] text-gray-600 mt-0.5">
                Make sure you&apos;ve completed all questions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 -mt-1"
          >
            <svg
              viewBox="0 0 16 16"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
            >
              <line x1="3.5" y1="3.5" x2="12.5" y2="12.5" />
              <line x1="12.5" y1="3.5" x2="3.5" y2="12.5" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <ReviewStat color="#16A34A" bg="#ECFCE5" value={answered} label="ANSWERED" />
          <ReviewStat color="#DC2626" bg="#FBECEC" value={unanswered} label="UNANSWERED" />
          <ReviewStat color="#D97706" bg="#FEF6D9" value={0} label="FLAGGED" />
        </div>

        <div className="text-[11px] font-semibold text-[#0B1B4A]/70 tracking-wide mb-2">
          SECTION BREAKDOWN
        </div>

        <div className="rounded-md border border-gray-200 px-4 py-3 mb-5 flex items-center">
          <div>
            <div className="text-[14px] font-semibold text-[#0B1B4A]">
              Coding Hands-on
            </div>
            <div className="text-[11px] text-gray-500">{total} questions</div>
          </div>
          <div className="ml-auto flex items-center gap-3 text-[12px]">
            <span className="inline-flex items-center gap-1 text-[#0B1B4A]/85">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.6}>
                <rect x="3.5" y="2.5" width="9" height="11" rx="1" />
              </svg>
              {answered}
            </span>
            <span className="inline-flex items-center gap-1 text-[#0B1B4A]/85">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.6}>
                <line x1="3.5" y1="2" x2="3.5" y2="14" />
                <path d="M3.5 2.5 L12.5 4 L3.5 8.5 Z" fill="currentColor" />
              </svg>
              0
            </span>
            <span
              className={
                "inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold " +
                (sectionComplete
                  ? "bg-[#E8F8F1] text-[#0B6B43] border border-[#A6E3CA]"
                  : "bg-[#FBECEC] text-[#B91C1C] border border-[#F0BFBF]")
              }
            >
              {sectionComplete ? "Complete" : "Incomplete"}
            </span>
          </div>
        </div>

        <label className="flex items-center gap-2 mb-5 cursor-pointer select-none text-[13px] text-[#0B1B4A]">
          <span className="relative inline-flex items-center justify-center">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="peer sr-only"
            />
            <span
              className={
                "w-[18px] h-[18px] rounded-[3px] border " +
                (confirm
                  ? "bg-[#0B1B4A] border-[#0B1B4A]"
                  : "bg-white border-gray-400")
              }
            />
            {confirm && (
              <svg
                className="absolute w-3 h-3 text-white"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 8 7 12 13 4" />
              </svg>
            )}
          </span>
          I confirm I want to finish this test
        </label>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onProceed}
            disabled={!confirm}
            className={
              "h-10 px-7 rounded-md text-[13px] font-semibold transition-colors " +
              (confirm
                ? "bg-[#26D9B5] text-[#06091F] hover:bg-[#3BE6C4]"
                : "bg-[#26D9B5]/40 text-[#06091F]/60 cursor-not-allowed")
            }
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewStat({
  color,
  bg,
  value,
  label,
}: {
  color: string;
  bg: string;
  value: number;
  label: string;
}) {
  return (
    <div
      className="rounded-md p-3 text-center"
      style={{ background: bg }}
    >
      <div className="text-[26px] font-bold leading-none" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] font-semibold tracking-wide mt-1" style={{ color }}>
        {label}
      </div>
    </div>
  );
}
