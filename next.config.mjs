import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to this project so a stray parent lockfile
  // (e.g. ~/pnpm-lock.yaml) doesn't get inferred as the root.
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pokemontcg.io" },
      { protocol: "https", hostname: "assets.tcgdex.net" }
    ]
  }
};

export default nextConfig;
