import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const securityHeaders = [
  { key: "x-content-type-options", value: "nosniff" },
  { key: "x-frame-options", value: "DENY" },
  { key: "referrer-policy", value: "strict-origin-when-cross-origin" },
  { key: "permissions-policy", value: "geolocation=(), microphone=(), camera=()" },
  { key: "strict-transport-security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "content-security-policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https: http://localhost:4000; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  }
];

const nextConfig = {
  outputFileTracingRoot: workspaceRoot,
  transpilePackages: ["@globe/types", "@globe/ui", "@globe/geo", "@globe/config"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
