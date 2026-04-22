import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coding Hands-on | Infosys",
  description:
    "Infosys Coding Hands-on assessment platform — a faithful clone for practice and demo purposes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Pyodide runs Python directly in the browser — no backend
            required for Run. Loaded from the official CDN. */}
        <script
          src="https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js"
          async
        />
      </head>
      <body className="h-screen overflow-hidden">{children}</body>
    </html>
  );
}
