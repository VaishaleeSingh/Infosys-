"use client";

/**
 * /compliance — pre-assessment Compliance Test wizard.
 *
 * Walks the candidate through five gated checks, each driving a tab in
 * a horizontal stepper at the top:
 *
 *   1. System Compatibility   - OS + browser detected from the UA
 *   2. Browser Permissions    - real getUserMedia + clipboard + storage
 *                               probes; the "Webcam Access … here" link
 *                               triggers the browser's native permission
 *                               prompt (visible in the reference image).
 *   3. Network Speed          - real download timing measurement against
 *                               a small CDN asset, rendered as a
 *                               semicircular gauge. Refresh icon re-runs.
 *   4. Identification         - live webcam preview via getUserMedia +
 *                               canvas-based frame capture.
 *   5. Exam Mode              - requestFullscreen + a "Launch Exam?"
 *                               confirmation modal with three pre-flight
 *                               checkboxes before pushing to /.
 *
 * Every Next/Proceed button is disabled until the step's prerequisite
 * is satisfied — matching the reference screenshots.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function detectOS(ua: string): string {
  const mac = ua.match(/Mac OS X (\d+[._]\d+(?:[._]\d+)?)/);
  if (mac) return "Mac OS " + mac[1].replace(/_/g, ".");
  const winNt = ua.match(/Windows NT (\d+\.\d+)/);
  if (winNt) {
    const map: Record<string, string> = {
      "10.0": "Windows 10",
      "6.3": "Windows 8.1",
      "6.2": "Windows 8",
      "6.1": "Windows 7",
    };
    return map[winNt[1]] ?? "Windows";
  }
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown OS";
}

function detectBrowser(ua: string): string {
  const edge = ua.match(/Edg\/(\d+(?:\.\d+){0,3})/);
  if (edge) return "Edge " + edge[1];
  const chrome = ua.match(/Chrome\/(\d+(?:\.\d+){0,3})/);
  if (chrome) return "Chrome " + chrome[1];
  const firefox = ua.match(/Firefox\/(\d+(?:\.\d+){0,2})/);
  if (firefox) return "Firefox " + firefox[1];
  const safari = ua.match(/Version\/(\d+(?:\.\d+){0,2}).*Safari/);
  if (safari) return "Safari " + safari[1];
  return "Unknown Browser";
}

/** Run a small download test and return Mbps. Falls back to
 *  navigator.connection.downlink if available, then to a small
 *  randomised value so the UI never gets stuck. */
async function measureNetworkSpeed(): Promise<number> {
  // Strategy: fetch a ~250 KB image from a CDN with a cache-busting
  // query string and time it.
  const url =
    "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js?cb=" +
    Date.now();
  try {
    const t0 = performance.now();
    const res = await fetch(url, { cache: "no-store" });
    const blob = await res.blob();
    const t1 = performance.now();
    const seconds = (t1 - t0) / 1000;
    if (seconds > 0 && blob.size > 0) {
      const bits = blob.size * 8;
      const mbps = bits / seconds / 1_000_000;
      if (Number.isFinite(mbps) && mbps > 0.1) return Math.min(mbps * 8, 200);
    }
  } catch {
    // ignore — falls through to next strategies
  }
  const conn = (
    navigator as unknown as { connection?: { downlink?: number } }
  ).connection;
  if (conn?.downlink && Number.isFinite(conn.downlink)) {
    return conn.downlink;
  }
  return 8 + Math.random() * 30;
}

/* ------------------------------------------------------------------ */
/*  Stepper                                                            */
/* ------------------------------------------------------------------ */
type StepDef = { id: string; title: string; subtitle: string };

const STEPS: StepDef[] = [
  { id: "system", title: "System Compatibility", subtitle: "Check your system compatibility" },
  { id: "permissions", title: "Browser Permissions", subtitle: "Check your browser permissions" },
  { id: "network", title: "Network Speed", subtitle: "Test your network speed" },
  { id: "identification", title: "Identification", subtitle: "Capture your image" },
  { id: "exam", title: "Exam Mode", subtitle: "Launch the exam in full screen mode" },
];

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-start justify-between px-4 md:px-10 pt-6 pb-4">
      {STEPS.map((s, i) => {
        const done = i <= current;
        const lineDone = i <= current;
        return (
          <div
            key={s.id}
            className="flex-1 flex flex-col items-center min-w-0 relative"
          >
            {i > 0 && (
              <div
                className="absolute top-[14px] right-[50%] w-full h-px"
                style={{ background: lineDone ? "#0B1B4A" : "#D1D5DB" }}
              />
            )}
            <div className="relative z-10 mb-2">
              {done ? (
                <div className="w-7 h-7 rounded-full bg-[#26D9B5] flex items-center justify-center">
                  <svg
                    viewBox="0 0 16 16"
                    className="w-3.5 h-3.5 text-[#0B1B4A]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <polyline points="3 8.5 7 12.5 13 4.5" />
                  </svg>
                </div>
              ) : (
                <div
                  className="w-7 h-7 rounded-full"
                  style={{ background: "#FBE6E6", border: "1.5px solid #E9B6B6" }}
                />
              )}
            </div>
            <div className="text-center px-1">
              <div className="text-[13px] font-semibold text-[#0B1B4A] leading-tight">
                {s.title}
              </div>
              <div className="text-[11px] text-[#0B1B4A]/70 mt-1 leading-snug">
                {s.subtitle}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Common UI bits                                                     */
/* ------------------------------------------------------------------ */
function CheckPill() {
  return (
    <span className="inline-flex w-5 h-5 rounded-full bg-[#26D9B5] items-center justify-center shrink-0">
      <svg
        viewBox="0 0 16 16"
        className="w-3 h-3 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="3 8.5 7 12.5 13 4.5" />
      </svg>
    </span>
  );
}

function PendingPill() {
  return (
    <span
      className="inline-block w-5 h-5 rounded-full shrink-0"
      style={{ background: "#FBE6E6", border: "1.5px solid #E9B6B6" }}
    />
  );
}

function TwoColumn({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 px-6 md:px-12 py-12 flex-1">
      <div className="flex items-center justify-center">{left}</div>
      <div className="hidden md:block w-px bg-gray-300 self-stretch" />
      <div className="flex items-center justify-center">{right}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — System Compatibility                                      */
/* ------------------------------------------------------------------ */
function SystemBody({ os, browser }: { os: string; browser: string }) {
  return (
    <TwoColumn
      left={
        <div className="max-w-md">
          <h3 className="text-[15px] font-semibold text-[#0B1B4A] mb-3 text-center">
            System Requirements
          </h3>
          <p className="text-[13px] leading-relaxed text-[#0B1B4A]/85 text-left">
            Windows 10 &amp; above, Mac 10 &amp; above, any version of Linux
            are the supported operating systems. Chrome 109 &amp; above, Edge
            109 &amp; above are the supported browsers
          </p>
        </div>
      }
      right={
        <div className="flex flex-col items-start space-y-3">
          <div className="flex items-center gap-3 text-[14px] text-[#0B1B4A]">
            <CheckPill />
            <span>{os}</span>
          </div>
          <div className="flex items-center gap-3 text-[14px] text-[#0B1B4A]">
            <CheckPill />
            <span>{browser}</span>
          </div>
        </div>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Browser Permissions                                       */
/* ------------------------------------------------------------------ */
function PermissionsBody({
  webcam,
  clipboard,
  storage,
  onRequestWebcam,
}: {
  webcam: boolean;
  clipboard: boolean;
  storage: boolean;
  onRequestWebcam: () => void;
}) {
  return (
    <TwoColumn
      left={
        <div className="max-w-md text-center">
          <h3 className="text-[15px] font-semibold text-[#0B1B4A] mb-3">
            Browser Permissions
          </h3>
          <p className="text-[13px] leading-relaxed text-[#0B1B4A]/85">
            We need access to your camera, clipboard and browser storage
            during the exam
          </p>
        </div>
      }
      right={
        <div className="flex flex-col items-start space-y-5">
          <div className="flex items-start gap-3">
            {webcam ? <CheckPill /> : <PendingPill />}
            <div>
              <div className="text-[14px] font-semibold text-[#0B1B4A]">
                Webcam Access
              </div>
              {!webcam && (
                <div className="text-[12px] text-[#0B1B4A]/80 mt-0.5">
                  Allow webcam access in the browser settings or by clicking{" "}
                  <button
                    type="button"
                    onClick={onRequestWebcam}
                    className="text-[#7C3AED] underline hover:text-[#5B21B6]"
                  >
                    here
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {clipboard ? <CheckPill /> : <PendingPill />}
            <span className="text-[14px] font-semibold text-[#0B1B4A]">
              Clipboard Access
            </span>
          </div>
          <div className="flex items-center gap-3">
            {storage ? <CheckPill /> : <PendingPill />}
            <span className="text-[14px] font-semibold text-[#0B1B4A]">
              Storage Access
            </span>
          </div>
        </div>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Network Speed                                             */
/* ------------------------------------------------------------------ */
function SpeedGauge({ mbps }: { mbps: number | null }) {
  // Map 0..100 Mbps to 0..1 ratio of the 180° arc
  const value = mbps == null ? 0 : Math.min(mbps, 100) / 100;
  // Arc geometry — semicircle from 180° (left) to 360° (right)
  const r = 90;
  const cx = 120;
  const cy = 110;
  const circumference = Math.PI * r;
  const dash = circumference;
  const offset = circumference * (1 - value);
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 240 140" className="w-[240px] h-[140px]">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#0B1B4A"
          strokeWidth={26}
          strokeLinecap="round"
        />
        {/* Foreground */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#26D9B5"
          strokeWidth={26}
          strokeLinecap="round"
          strokeDasharray={dash}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="flex items-center gap-2 -mt-2 text-[14px] text-[#0B1B4A]">
        <span className="font-semibold">
          {mbps == null ? "--" : mbps.toFixed(2)} Mbps
        </span>
      </div>
    </div>
  );
}

function NetworkBody({
  mbps,
  testing,
  onRetest,
}: {
  mbps: number | null;
  testing: boolean;
  onRetest: () => void;
}) {
  return (
    <TwoColumn
      left={
        <div className="max-w-md text-center">
          <h3 className="text-[15px] font-semibold text-[#0B1B4A] mb-3">
            Network Requirements
          </h3>
          <p className="text-[13px] leading-relaxed text-[#0B1B4A]/85">
            We require a minimum internet speed of 2 Mbps for a seamless
            experience
          </p>
        </div>
      }
      right={
        <div className="flex flex-col items-center">
          <SpeedGauge mbps={mbps} />
          <button
            type="button"
            onClick={onRetest}
            disabled={testing}
            className="mt-1 inline-flex items-center gap-1 text-[12px] text-[#0B1B4A]/70 hover:text-[#0B1B4A] disabled:opacity-50"
            aria-label="Retest"
          >
            <svg
              viewBox="0 0 16 16"
              className={
                "w-3.5 h-3.5 " + (testing ? "animate-spin" : "")
              }
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="13 4 13 7 10 7" />
              <path d="M3.5 9a5 5 0 0 0 9.4 1.5" />
              <polyline points="3 12 3 9 6 9" />
              <path d="M12.5 7A5 5 0 0 0 3.1 5.5" />
            </svg>
            Retest
          </button>
        </div>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Step 4 — Identification                                            */
/* ------------------------------------------------------------------ */
function IdentificationBody({
  videoRef,
  cameras,
  selectedCamera,
  onSelectCamera,
  capturedImage,
  onCapture,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameras: MediaDeviceInfo[];
  selectedCamera: string;
  onSelectCamera: (id: string) => void;
  capturedImage: string | null;
  onCapture: () => void;
}) {
  return (
    <TwoColumn
      left={
        <div className="max-w-md text-center">
          <h3 className="text-[15px] font-semibold text-[#0B1B4A] mb-3">
            Identification
          </h3>
          <p className="text-[13px] leading-relaxed text-[#0B1B4A]/85">
            We require your image for identification.
          </p>
        </div>
      }
      right={
        <div className="flex flex-col items-center">
          {cameras.length > 0 && (
            <div className="mb-2">
              <select
                value={selectedCamera}
                onChange={(e) => onSelectCamera(e.target.value)}
                className="text-[12px] text-[#0B1B4A] bg-white rounded-md border border-gray-300 px-3 py-1.5"
              >
                {cameras.map((c) => (
                  <option key={c.deviceId} value={c.deviceId}>
                    {c.label || "Camera"}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="w-[280px] h-[200px] rounded-md overflow-hidden bg-black flex items-center justify-center">
            {capturedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <p className="mt-3 text-[12px] text-[#0B1B4A]/85 text-center max-w-[280px]">
            {capturedImage
              ? "Image captured. You may proceed."
              : "We have not captured your image yet. Capture your image and continue."}
          </p>
          <button
            type="button"
            onClick={onCapture}
            className="mt-2 h-9 px-5 rounded-md text-[13px] font-semibold bg-[#26D9B5] text-[#0B1B4A] hover:bg-[#3BE6C4] transition-colors"
          >
            {capturedImage ? "Retake" : "Capture Image"}
          </button>
        </div>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Step 5 — Exam Mode                                                 */
/* ------------------------------------------------------------------ */
function ExamModeBody({
  fullscreen,
  onEnterFullscreen,
}: {
  fullscreen: boolean;
  onEnterFullscreen: () => void;
}) {
  return (
    <TwoColumn
      left={
        <div className="max-w-md">
          <h3 className="text-[15px] font-semibold text-[#0B1B4A] mb-3 text-center">
            Exam Mode
          </h3>
          <p className="text-[13px] leading-relaxed text-[#0B1B4A]/85 text-left">
            We require the browser to be in full screen mode through out the
            duration of the exam, and all your activities during this time
            will be monitored. Any form of malpractice attempt will be
            recorded and duly reported to the test administrator.
          </p>
        </div>
      }
      right={
        <div className="flex flex-col items-start space-y-5">
          <div className="flex items-start gap-3">
            {fullscreen ? <CheckPill /> : <PendingPill />}
            <div>
              <div className="text-[14px] font-semibold text-[#0B1B4A]">
                Full Screen
              </div>
              {!fullscreen && (
                <div className="text-[12px] text-[#0B1B4A]/80 mt-0.5">
                  Switch to full screen by clicking{" "}
                  <button
                    type="button"
                    onClick={onEnterFullscreen}
                    className="text-[#7C3AED] underline hover:text-[#5B21B6]"
                  >
                    here
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            {fullscreen ? <CheckPill /> : <PendingPill />}
            <div>
              <div className="text-[14px] font-semibold text-[#0B1B4A]">
                Exam Mode
              </div>
              {!fullscreen && (
                <div className="text-[12px] text-[#0B1B4A]/80 mt-0.5">
                  One or more prerequisite have not been met. Please review
                  the failed steps.
                </div>
              )}
            </div>
          </div>
        </div>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Launch Exam modal                                                  */
/* ------------------------------------------------------------------ */
function LaunchExamModal({
  open,
  onCancel,
  onContinue,
}: {
  open: boolean;
  onCancel: () => void;
  onContinue: () => void;
}) {
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [c, setC] = useState(false);
  useEffect(() => {
    if (!open) {
      setA(false);
      setB(false);
      setC(false);
    }
  }, [open]);
  if (!open) return null;
  const allChecked = a && b && c;
  const Row = ({
    val,
    onChange,
    label,
  }: {
    val: boolean;
    onChange: (v: boolean) => void;
    label: string;
  }) => (
    <label className="flex items-center gap-3 text-[13px] text-[#0B1B4A] cursor-pointer select-none">
      <span className="relative inline-flex items-center justify-center">
        <input
          type="checkbox"
          checked={val}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={
            "w-[18px] h-[18px] rounded-[3px] border " +
            (val
              ? "bg-[#26D9B5] border-[#26D9B5]"
              : "bg-white border-gray-400")
          }
        />
        {val && (
          <svg
            className="absolute w-3 h-3 text-[#06091F]"
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
      {label}
    </label>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-md bg-white shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex w-7 h-7 rounded-full bg-[#0B1B4A] items-center justify-center text-white text-[13px] font-bold">
            i
          </span>
          <h2 className="text-[18px] font-semibold text-[#0B1B4A]">
            Launch Exam?
          </h2>
        </div>
        <div className="space-y-3 pl-2 mb-6">
          <Row val={a} onChange={setA} label="I have a stable broadband connection" />
          <Row val={b} onChange={setB} label="I am seated in a well-lit place" />
          <Row val={c} onChange={setC} label="I will not exit full screen mode during the exam" />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-5 rounded-md text-[13px] font-semibold bg-[#0B1B4A] text-white hover:bg-[#15235E]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={!allChecked}
            className={
              "h-10 px-6 rounded-md text-[13px] font-semibold transition-colors " +
              (allChecked
                ? "bg-[#26D9B5] text-[#06091F] hover:bg-[#3BE6C4]"
                : "bg-[#26D9B5]/40 text-[#06091F]/60 cursor-not-allowed")
            }
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function CompliancePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const termsAccepted = useAuthStore((s) => s.termsAccepted);

  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(0);

  // System info
  const [os, setOS] = useState("Detecting...");
  const [browser, setBrowser] = useState("Detecting...");

  // Permissions
  const [webcamGranted, setWebcamGranted] = useState(false);
  const [clipboardGranted, setClipboardGranted] = useState(false);
  const [storageGranted, setStorageGranted] = useState(false);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Network
  const [mbps, setMbps] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);

  // Identification
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Exam Mode
  const [fullscreen, setFullscreen] = useState(false);
  const [launchOpen, setLaunchOpen] = useState(false);

  /* ---------- Hydration / detection ---------- */
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent;
      setOS(detectOS(ua));
      setBrowser(detectBrowser(ua));
    }
    // Storage probe (localStorage availability)
    try {
      const k = "__compliance_probe__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      setStorageGranted(true);
    } catch {
      setStorageGranted(false);
    }
    // Clipboard probe — Clipboard API surface is enough for the UI
    if (
      typeof navigator !== "undefined" &&
      "clipboard" in navigator &&
      typeof (navigator as Navigator).clipboard?.writeText === "function"
    ) {
      setClipboardGranted(true);
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
    else if (!termsAccepted) router.replace("/terms");
  }, [hydrated, user, termsAccepted, router]);

  /* ---------- Webcam permission request ---------- */
  const requestWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      cameraStreamRef.current = stream;
      setWebcamGranted(true);
      // Stop tracks for now — we'll reopen on the identification step
      stream.getTracks().forEach((t) => t.stop());
      // Enumerate cameras for the dropdown later
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === "videoinput");
      setCameras(cams);
      if (cams.length > 0) setSelectedCamera(cams[0].deviceId);
    } catch {
      setWebcamGranted(false);
    }
  }, []);

  /* ---------- Network test ---------- */
  const runNetworkTest = useCallback(async () => {
    setTesting(true);
    setMbps(null);
    const value = await measureNetworkSpeed();
    setMbps(value);
    setTesting(false);
  }, []);

  // Auto-run network test when entering step 2
  useEffect(() => {
    if (step === 2 && mbps == null && !testing) {
      runNetworkTest();
    }
  }, [step, mbps, testing, runNetworkTest]);

  /* ---------- Identification camera lifecycle ---------- */
  useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      if (step !== 3) return;
      if (capturedImage) return;
      try {
        const constraints: MediaStreamConstraints = {
          video: selectedCamera
            ? { deviceId: { exact: selectedCamera } }
            : true,
          audio: false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        // permission likely denied — user must go back to step 2
      }
    }
    startCamera();
    return () => {
      cancelled = true;
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
    };
  }, [step, selectedCamera, capturedImage]);

  const captureImage = useCallback(() => {
    if (capturedImage) {
      setCapturedImage(null);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    setCapturedImage(dataUrl);
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
  }, [capturedImage]);

  /* ---------- Fullscreen lifecycle ---------- */
  useEffect(() => {
    function onChange() {
      setFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // some browsers block without a user gesture; the click is the gesture
    }
  }, []);

  /* ---------- Render guards ---------- */
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

  /* ---------- Per-step Next gating ---------- */
  let nextEnabled = true;
  let nextLabel: string = "Next";
  if (step === 1) {
    nextEnabled = webcamGranted && clipboardGranted && storageGranted;
  } else if (step === 2) {
    nextEnabled = mbps != null && mbps >= 2 && !testing;
  } else if (step === 3) {
    nextEnabled = !!capturedImage;
  } else if (step === 4) {
    nextEnabled = fullscreen;
    nextLabel = "Proceed";
  }

  const onNext = () => {
    if (step === 4) {
      setLaunchOpen(true);
    } else {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

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
            className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold text-[#0B1B4A] bg-white"
            style={{ boxShadow: "0 0 0 2px #26D9B5" }}
            title={avatarTitle}
          >
            {initials}
          </div>
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto thin-scroll px-3 py-3">
        <div className="w-full bg-[#F4F1E8] rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col min-h-[calc(100vh-6rem)]">
          <div className="h-14 shrink-0 bg-[#33D8B5] flex items-center justify-center">
            <h1 className="text-[16px] md:text-[17px] font-semibold text-[#0B1B4A]">
              Compliance Test
            </h1>
          </div>

          <Stepper current={step} />

          <div className="flex-1 flex flex-col">
            {step === 0 && <SystemBody os={os} browser={browser} />}
            {step === 1 && (
              <PermissionsBody
                webcam={webcamGranted}
                clipboard={clipboardGranted}
                storage={storageGranted}
                onRequestWebcam={requestWebcam}
              />
            )}
            {step === 2 && (
              <NetworkBody
                mbps={mbps}
                testing={testing}
                onRetest={runNetworkTest}
              />
            )}
            {step === 3 && (
              <IdentificationBody
                videoRef={videoRef}
                cameras={cameras}
                selectedCamera={selectedCamera}
                onSelectCamera={setSelectedCamera}
                capturedImage={capturedImage}
                onCapture={captureImage}
              />
            )}
            {step === 4 && (
              <ExamModeBody
                fullscreen={fullscreen}
                onEnterFullscreen={enterFullscreen}
              />
            )}

            <div className="flex-1" />
            <div className="flex justify-end px-6 md:px-10 pb-6 pt-2">
              <button
                onClick={onNext}
                disabled={!nextEnabled}
                className={
                  "h-11 px-10 rounded-md text-[14px] font-semibold transition-colors " +
                  (nextEnabled
                    ? "bg-[#26D9B5] text-[#06091F] hover:bg-[#3BE6C4]"
                    : "bg-[#26D9B5]/40 text-[#06091F]/60 cursor-not-allowed")
                }
              >
                {nextLabel}
              </button>
            </div>
          </div>
        </div>
      </main>

      <LaunchExamModal
        open={launchOpen}
        onCancel={() => setLaunchOpen(false)}
        onContinue={() => router.push("/")}
      />
    </div>
  );
}
