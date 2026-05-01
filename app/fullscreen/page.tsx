"use client";

import { useEffect, useState } from "react";
import Workspace from "@/app/page";
import { useAuthStore } from "@/store/useAuthStore";

export default function FullscreenWorkspace() {
  const acceptTerms = useAuthStore((s) => s.acceptTerms);
  const termsAccepted = useAuthStore((s) => s.termsAccepted);
  const [ready, setReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!termsAccepted) acceptTerms();
    setReady(true);
  }, [termsAccepted, acceptTerms]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    handler();
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const enterFullscreen = () => {
    const el = document.documentElement;
    const req =
      el.requestFullscreen ??
      (el as unknown as { webkitRequestFullscreen?: () => Promise<void> })
        .webkitRequestFullscreen;
    if (!req) return;
    try {
      const result = req.call(el);
      if (result && typeof (result as Promise<void>).catch === "function") {
        (result as Promise<void>).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  };

  if (!ready) return null;

  return (
    <>
      <Workspace />
      {!isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center">
          <button
            onClick={enterFullscreen}
            className="h-12 px-8 rounded-md text-[14px] font-semibold bg-[#26D9B5] text-[#06091F] hover:bg-[#3BE6C4] transition-colors shadow-lg"
          >
            Enter Fullscreen
          </button>
        </div>
      )}
    </>
  );
}
