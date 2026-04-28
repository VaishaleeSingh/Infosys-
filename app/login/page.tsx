"use client";

/**
 * /login is bypassed in this build — the demo runs with a single
 * static user (Aditya Singh / adityasingh3210). This component just
 * redirects to /terms so any link or refresh that lands on /login
 * still ends up at the consent gate.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/terms");
  }, [router]);
  return (
    <div className="h-screen flex items-center justify-center bg-[#06091F] text-white/70 text-sm">
      Loading...
    </div>
  );
}
