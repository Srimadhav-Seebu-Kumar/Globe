import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig = {
  outputFileTracingRoot: workspaceRoot,
  transpilePackages: ["@globe/types"]
};

export default nextConfig;
