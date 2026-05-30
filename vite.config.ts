// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import path from "node:path";
import { loadEnv } from "vite";
import { imagetools } from "vite-imagetools";

const serverEnv = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
for (const [key, value] of Object.entries(serverEnv)) {
  if (process.env[key] === undefined) process.env[key] = value;
}

// Bake the MailerLite key into the server bundle at build time.
// process.env.VITE_MAILERLITE_API_KEY is available here (from Cloudflare build vars),
// but process.env is NOT available in the Worker at runtime — only Worker secrets are.
const _mlKey = process.env.VITE_MAILERLITE_API_KEY ?? serverEnv.VITE_MAILERLITE_API_KEY ?? "";

export default defineConfig({
  tanstackStart: { server: { entry: "server" } },
  vite: {
    plugins: [imagetools()],
    define: {
      __MAILERLITE_API_KEY__: JSON.stringify(_mlKey),
    },
    server: {
      allowedHosts: true,
    },
    resolve: {
      alias: {
        "entities/lib/decode.js": path.resolve(process.cwd(), "node_modules/entities/lib/decode.js"),
        "entities/lib/encode.js": path.resolve(process.cwd(), "node_modules/entities/lib/encode.js"),
        entities: path.resolve(process.cwd(), "node_modules/entities"),
      },
    },
  },
});
