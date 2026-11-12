import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { cpus: 1 },
  webpack: (config) => {
    config.plugins.push({
      apply(compiler: { hooks: { done: { tap: (name: string, callback: (stats: { compilation: { errors: unknown[] } }) => void) => void } } }) {
        compiler.hooks.done.tap("PageNovaBuildDiagnostics", (stats) => {
          for (const error of stats.compilation.errors) {
            console.error("[PageNova webpack compilation error]", error);
          }
        });
      },
    });
    return config;
  },
  serverExternalPackages: [
    "playwright-core",
    "@sparticuz/chromium",
  ],

  outputFileTracingIncludes: {
    "/api/*": [
      "./node_modules/playwright-core/browsers.json",
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
    "/api/cloner/analyze": [
      "./node_modules/playwright-core/browsers.json",
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
  },
};

export default nextConfig;
