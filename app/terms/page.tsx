"use client";

/**
 * /terms — Terms & Conditions gate.
 *
 * Shown after login, before the candidate enters the coding platform.
 * The 12 clauses below are transcribed from the "Terms and Conditions
 * Version: 1.0.0" screen in the reference screenshots. Wording is kept
 * as close to the original as legible from the photo.
 *
 * Layout matches the screenshot: teal underlined title, numbered list
 * below, "I Agree" CTA at the bottom.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

const CLAUSES: string[] = [
  'IAP, including all Content present on IAP, is the property of Infosys Limited (hereinafter referred to as "Company") or the source from where the content is taken, and is copyrighted and protected by worldwide copyright laws and treaty provisions. The User hereby agrees to comply with all copyright laws worldwide in the use of IAP and to prevent any unauthorised copying of the Contents. Company does not grant any express or implied rights under any patents, trademarks, copyrights or trade secret information.',
  "The User shall not falsify or delete any copyright management information, such as author attributions, legal or other proper notices or proprietary designations or labels of the origin or source of software or other Content contained in a file that is uploaded.",
  "The User may not download, copy, distribute, transmit, display, perform, reproduce, duplicate, or publish, any information present on the IAP. Any unauthorized use of IAP or its contents shall lead to termination of the access granted by the Company.",
  "The User agrees to use IAP in accordance with the applicable rules, regulations, laws and policies of the Company.",
  "The User shall not reveal any personally identifying data or sensitive personal information of his/her self or any other person.",
  "The User shall not in any manner reveal confidential or proprietary information of any third party.",
  "The User shall not transfer their rights to access to another person unless they have obtained explicit consent from the Company in writing to do so.",
  "The User shall acknowledge that the Company may, at its sole discretion, monitor, remove or edit any content that the User may contribute. Company may also pursue remedies available to it under law for any violation of these terms and conditions.",
  "Subject to the terms and conditions set forth in these Terms of Use, the Company grants the User a non-exclusive, non-transferable, limited right to access IAP and the Content thereon. The User agrees not to interrupt or attempt to interrupt the operation of IAP in any manner.",
  "The Company reserves the right to change these terms and conditions at any time on its discretion. Your continued use of IAP after the posting of any amended terms and conditions shall constitute your agreement to be bound by any such changes.",
  "The User understand that IAP is an attempt by the Company to cater to the competency assessment needs of various stake holders in the company.",
  "The User gives his/her voluntary consent to download this Application on their personal device.",
];

export default function TermsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const termsAccepted = useAuthStore((s) => s.termsAccepted);
  const acceptTerms = useAuthStore((s) => s.acceptTerms);
  const logout = useAuthStore((s) => s.logout);

  const [checked, setChecked] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
    else if (termsAccepted) router.replace("/");
  }, [hydrated, user, termsAccepted, router]);

  if (!hydrated || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-white text-gray-500 text-sm">
        Loading…
      </div>
    );
  }

  const handleAgree = () => {
    acceptTerms();
    router.replace("/");
  };

  const handleDecline = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Slim top bar identifying the candidate */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-panelBorder bg-white text-[12px]">
        <div className="flex items-center gap-2 font-semibold text-gray-700">
          <span
            className="text-lg font-bold"
            style={{ color: "#0B3B6B" }}
          >
            Infosys
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#EB2226]" />
          <span className="ml-2 text-gray-500 font-normal">
            Assessment Platform
          </span>
        </div>
        <div className="text-gray-600">
          <span className="font-medium">{user.name}</span>
          <span className="mx-2 text-gray-300">|</span>
          <span className="font-mono text-[11px]">{user.candidateId}</span>
        </div>
      </div>

      {/* Title — mirrors the screenshot: teal, underlined, with version */}
      <div className="px-6 pt-6 pb-3 border-b border-gray-100">
        <h1 className="inline-flex items-baseline gap-2">
          <span
            className="text-[22px] font-semibold text-infy-700 underline decoration-infy-500/60 underline-offset-[6px]"
          >
            Terms and Conditions
          </span>
          <span className="text-[11px] font-normal text-gray-500">
            Version: 1.0.0
          </span>
        </h1>
      </div>

      {/* Clauses */}
      <div className="flex-1 overflow-y-auto thin-scroll px-6 py-4">
        <p className="text-[13px] text-gray-800 mb-3 leading-relaxed">
          The access and use of any information on the Infosys Assessment
          Platform (hereinafter referred to as{" "}
          <span className="font-semibold">&ldquo;IAP&rdquo;</span>) shall
          be governed by the following Terms of Use:
        </p>

        <ol className="space-y-3 text-[13px] leading-relaxed text-gray-800 list-none">
          {CLAUSES.map((c, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-6 text-right font-semibold text-gray-700">
                {i + 1}.
              </span>
              <span className="flex-1">{c}</span>
            </li>
          ))}
        </ol>

        <div className="h-8" />
      </div>

      {/* Footer: checkbox + actions */}
      <div className="border-t border-panelBorder bg-gray-50 px-6 py-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-[13px] text-gray-800">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="w-4 h-4 rounded border-gray-400"
          />
          I have read and agree to the Terms and Conditions above.
        </label>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDecline}
            className="h-9 px-4 rounded text-[13px] font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          >
            Decline &amp; Sign Out
          </button>
          <button
            onClick={handleAgree}
            disabled={!checked}
            className="h-9 px-5 rounded text-[13px] font-semibold text-white bg-infy-500 border border-infy-600 hover:bg-infy-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            I Agree &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}
