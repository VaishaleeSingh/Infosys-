/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pyodide is loaded at runtime from a CDN via a <script> tag,
  // so we don't need to bundle it. This keeps the Next.js build fast.
  webpack: (config) => {
    // monaco-editor pulls in dynamic imports; Next handles this fine by default.
    return config;
  },
};

export default nextConfig;
