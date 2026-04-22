/**
 * Authentication state, kept separate from the coding-session store
 * so auth concerns don't bleed into editor/run logic.
 *
 * Persistence model: sessionStorage (not localStorage). This matches how
 * the real Infosys assessment session works — you stay logged in while
 * the tab is open, but closing it ends the session. It also keeps any
 * accidental multi-tab state from spilling across windows.
 *
 * Demo credentials: any non-empty email (must match email shape) +
 * any password of length >= 4. There is no real backend — the app
 * treats this as a local-only demo login.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AuthUser = {
  email: string;
  /** Display name derived from the email's local part, e.g. "aditya" */
  name: string;
  /** Fake candidate ID used in the breadcrumb / watermark. */
  candidateId: string;
  loggedInAt: number;
};

type AuthState = {
  user: AuthUser | null;
  /** Whether the user has accepted the Terms & Conditions this session. */
  termsAccepted: boolean;
  login: (email: string) => void;
  acceptTerms: () => void;
  logout: () => void;
};

/** Build a stable but fake candidate ID from the email — looks like
 *  Infosys's "INFY-0001234" style IDs without needing a real directory. */
function makeCandidateId(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) {
    h = (h * 31 + email.charCodeAt(i)) | 0;
  }
  const n = Math.abs(h) % 10000000;
  return `INFY-${n.toString().padStart(7, "0")}`;
}

/** Fallback in-memory storage for SSR + environments without sessionStorage. */
const memoryStorage = (() => {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };
})();

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      termsAccepted: false,
      login: (email) => {
        const trimmed = email.trim();
        const name = trimmed.split("@")[0] || "Candidate";
        set({
          user: {
            email: trimmed,
            name,
            candidateId: makeCandidateId(trimmed),
            loggedInAt: Date.now(),
          },
          // Always reset T&C acceptance on fresh login — matches real
          // assessments where every session re-shows the agreement.
          termsAccepted: false,
        });
      },
      acceptTerms: () => set({ termsAccepted: true }),
      logout: () => set({ user: null, termsAccepted: false }),
    }),
    {
      name: "infy-auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" && window.sessionStorage
          ? window.sessionStorage
          : memoryStorage
      ),
    }
  )
);
