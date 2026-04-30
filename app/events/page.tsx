"use client";

/**
 * /events — "Events for you" landing page.
 *
 * Sits between /terms and the coding workspace at /. Once a candidate
 * accepts the Terms & Conditions + Data Privacy Policy on /terms,
 * they're routed here to see the assessments scheduled for them.
 *
 * Visual reference: dark navy surface with the same Wingspan logo + AS
 * avatar header used on /terms; a single "Events for you" column with
 * card(s), each showing a teal hero with the Wingspan mark and a
 * cream-coloured info section beneath. Clicking the card opens the
 * coding workspace.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

type EventItem = {
  id: string;
  type: "Assessment";
  durationLabel: string; // "3h 0m"
  title: string;
  date: string; // "26/04/2026"
  time: string; // "14:00:00"
};

const EVENTS: EventItem[] = [
  {
    id: "sp-off-campus-26-apr-26",
    type: "Assessment",
    durationLabel: "3h 0m",
    title: "SP-Off campus -26-Apr-26",
    date: "26/04/2026",
    time: "14:00:00",
  },
];

/* ------------------------------------------------------------------ */
/*  Tiny inline icons (no extra deps)                                 */
/* ------------------------------------------------------------------ */
function ClockIcon({ className = "" }: { className?: string }) {
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
      <circle cx="8" cy="8" r="6" />
      <polyline points="8 4.5 8 8 10.5 9.5" />
    </svg>
  );
}

function CalendarIcon({ className = "" }: { className?: string }) {
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
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <line x1="2.5" y1="6.5" x2="13.5" y2="6.5" />
      <line x1="5.5" y1="2" x2="5.5" y2="5" />
      <line x1="10.5" y1="2" x2="10.5" y2="5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Card                                                               */
/* ------------------------------------------------------------------ */
function EventCard({
  event,
  onClick,
}: {
  event: EventItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-[260px] text-left rounded-md overflow-hidden bg-[#F4F1E8] shadow-[0_1px_3px_rgba(0,0,0,0.35)] hover:shadow-[0_2px_10px_rgba(38,217,181,0.35)] transition-shadow"
    >
      {/* Hero — teal panel with the wingspan.svg rendered directly
          on top. The upstream asset is a white circle with the W as a
          transparent cutout, so it naturally produces "white disc with
          teal W inside" once placed on the teal hero (the teal shows
          through the W-shaped cutout). No tint filter or wrapper disc
          is needed — the SVG provides its own circle. */}
      <div className="h-[120px] bg-[#33D8B5] flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://rec-test.infosys.com/iwa-web/assets/images/wingspan.svg"
          alt="Wingspan"
          className="w-[84px] h-[84px] object-contain"
        />
      </div>

      {/* Info section */}
      <div className="px-3 py-3 space-y-2 text-[#2c2d65]">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-[3px] rounded-full border border-[#2c2d65]/30 text-[10.5px] font-medium">
            {event.type}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#2c2d65]/80">
            <ClockIcon className="w-3.5 h-3.5" />
            {event.durationLabel}
          </span>
        </div>

        <h3 className="text-[14px] font-semibold leading-snug">{event.title}</h3>

        <div className="flex items-center gap-4 pt-1 text-[11px] text-[#2c2d65]/85">
          <span className="inline-flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            {event.date}
          </span>
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="w-3.5 h-3.5" />
            {event.time}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function EventsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const termsAccepted = useAuthStore((s) => s.termsAccepted);

  const [hydrated, setHydrated] = useState(false);
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
      {/* Same header shell as /terms */}
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

      <main className="flex-1 min-h-0 overflow-y-auto thin-scroll px-8 py-8">
        <h1 className="text-[20px] font-semibold tracking-tight mb-5">
          Events for you
        </h1>

        <div className="flex flex-wrap gap-5">
          {EVENTS.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              onClick={() => router.push("/instructions")}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
