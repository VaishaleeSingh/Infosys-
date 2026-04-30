"use client";

/**
 * /instructions — pre-assessment instructions screen.
 *
 * Reached by clicking an event card on /events. Layout matches the
 * Infosys reference:
 *   - Dark navy header (same Wingspan + AS avatar shell)
 *   - Large white card filling the body, with a teal banner across the
 *     top showing the assessment title + " - Instructions"
 *   - Numbered list of 11 instructions, ending with "All the best!!"
 *   - Centered "Start" pill button
 *
 * Clicking Start opens a modal with the 12 Terms & Conditions clauses
 * (sourced from lib/legal.ts so /terms and this modal stay in sync).
 * Clicking "I Agree" inside the modal pushes the candidate into the
 * coding workspace at `/`.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { TERMS_CLAUSES } from "@/lib/legal";

const ASSESSMENT_TITLE = "SP-Off campus -26-Apr-26";

const INSTRUCTIONS: string[] = [
  "You must have a laptop or desktop computer in good working condition. Avoid connecting to VPN to improve your internet speed.",
  "To take the assessment, participants must use Google Chrome or Microsoft Edge browsers with version 91 or above. Other browsers are incompatible.",
  "This assessment is only available on desktops/laptops. Mobile phones and tablets are not supported.",
  "Internet speed should be at least 2 Mbps.",
  "Please ensure that you take the assessment in the venue fixed by the placement office.",
  "If you do not submit the assessment within the specified time frame, it will be submitted automatically.",
  "After completing/answering all the questions, you must finish the attempt. Once the attempt is finished, it cannot be re-attempted.",
  "Discussing the questions and answers during or after the assessment will result in severe disciplinary action.",
  "During the assessment, no videos/pictures/snapshots of the questions may be taken. This renders your work void.",
  "Helping others by providing answers via communication channels such as WhatsApp or Telegram or any other means will result in significant disciplinary action.",
  "Malpractice of any sort is strictly forbidden.",
];

/* ------------------------------------------------------------------ */
/*  Terms modal                                                        */
/* ------------------------------------------------------------------ */
function TermsModal({
  open,
  onClose,
  onAgree,
}: {
  open: boolean;
  onClose: () => void;
  onAgree: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      {/* Dialog */}
      <div className="relative w-full max-w-3xl max-h-[80vh] flex flex-col rounded-md bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-gray-200">
          <h2 className="text-[18px] font-semibold text-[#2c2d65]">
            Terms and Conditions
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#2c2d65]/60 hover:text-[#2c2d65] -mt-0.5"
          >
            <svg
              viewBox="0 0 16 16"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <line x1="3" y1="3" x2="13" y2="13" />
              <line x1="13" y1="3" x2="3" y2="13" />
            </svg>
          </button>
        </div>

        {/* Body — scrollable, with a custom teal scrollbar */}
        <div className="flex-1 overflow-y-auto teal-scroll px-6 py-4 text-[13px] leading-relaxed text-[#2c2d65]">
          <p className="mb-3">
            The access and use of any information on the Infosys Assessment
            Platform (hereinafter referred to as &ldquo;IAP&rdquo;) shall be
            governed by the following Terms of Use:
          </p>
          <ol className="space-y-2.5 list-none">
            {TERMS_CLAUSES.map((c, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-6 text-right">{i + 1}.</span>
                <span className="flex-1">{c}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onAgree}
            className="h-10 px-6 rounded-md text-[14px] font-semibold bg-[#26D9B5] text-[#06091F] hover:bg-[#3BE6C4] transition-colors"
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function InstructionsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const termsAccepted = useAuthStore((s) => s.termsAccepted);

  const [hydrated, setHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
    else if (!termsAccepted) router.replace("/terms");
  }, [hydrated, user, termsAccepted, router]);

  if (!hydrated || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#06091F] text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  const initials =
    user.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => (p[0] ? p[0].toUpperCase() : ""))
      .join("") || "U";

  const avatarTitle = user.name + " - " + user.candidateId;

  return (
    <div className="h-screen flex flex-col bg-[#06091F] text-white">
      {/* Header */}
      <div className="h-14 shrink-0 px-4 flex items-center justify-between bg-[#06091F] border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://rec-test.infosys.com/iwa-web/assets/images/wingspan.svg"
            alt="Infosys Wingspan"
            className="h-8 w-auto"
          />
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold text-[#2c2d65] bg-white"
            style={{ boxShadow: "0 0 0 2px #26D9B5" }}
            title={avatarTitle}
          >
            {initials}
          </div>
        </div>
      </div>

      {/* Body — large white card with teal banner header */}
      <main className="flex-1 min-h-0 overflow-y-auto thin-scroll px-3 py-3">
        <div className="w-full bg-[#F4F1E8] rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col min-h-[calc(100vh-6rem)]">
          {/* Teal title banner */}
          <div className="h-14 shrink-0 bg-[#33D8B5] flex items-center justify-center">
            <h1 className="text-[16px] md:text-[17px] font-semibold text-[#2c2d65]">
              {ASSESSMENT_TITLE} - Instructions
            </h1>
          </div>

          {/* Content */}
          <div className="flex-1 px-6 md:px-10 py-6 flex flex-col">
            <p className="text-[14px] font-semibold text-[#2c2d65] mb-4">
              Kindly read the instructions before proceeding.
            </p>

            <ol className="space-y-2 text-[13px] leading-relaxed text-[#2c2d65] list-none">
              {INSTRUCTIONS.map((line, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="shrink-0 w-6 text-right">{i + 1}.</span>
                  <span className="flex-1">{line}</span>
                </li>
              ))}
            </ol>

            <p className="mt-3 text-[13px] text-[#2c2d65]">All the best!!</p>

            {/* Start button — pushed to the bottom of the card */}
            <div className="flex-1" />
            <div className="flex justify-center pt-6 pb-2">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="h-11 px-10 rounded-md text-[14px] font-semibold bg-[#26D9B5] text-[#06091F] hover:bg-[#3BE6C4] transition-colors"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      </main>

      <TermsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAgree={() => router.push("/compliance")}
      />
    </div>
  );
}
