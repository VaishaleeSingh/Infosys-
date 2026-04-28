"use client";

/**
 * /completed — assessment finished screen.
 *
 * Reached after the candidate clicks "Proceed" inside the
 * "Review before Finishing" modal in the workspace header. Shows a
 * full-screen dark navy surface with a centered "Your attempt has
 * been successfully submitted." message and a small "Go back Home"
 * link that returns the candidate to the start of the flow (/terms).
 */

import Link from "next/link";

export default function CompletedPage() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#06091F] text-white">
      <div className="text-center">
        <p className="text-[20px] md:text-[22px] font-semibold">
          Your attempt has been successfully submitted.
        </p>
        <Link
          href="/terms"
          className="mt-4 inline-flex items-center gap-2 text-[14px] text-white/85 hover:text-white underline underline-offset-4"
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
            <path d="M2.5 8 L8 2.5 L13.5 8" />
            <path d="M4 7.5 L4 13 L12 13 L12 7.5" />
          </svg>
          Go back Home
        </Link>
      </div>
    </div>
  );
}
