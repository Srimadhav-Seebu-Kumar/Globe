import { createServer, type IncomingMessage } from "node:http";

import { resolveRoute, writeJson, writeNoContent } from "./router.js";

const port = Number(process.env.PORT ?? 4000);

const readJsonBody = async (request: IncomingMessage): Promise<unknown> => {
  if (request.method !== "POST") {
    return undefined;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  if (!rawBody) {
    return undefined;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return undefined;
  }
};

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    writeNoContent(response);
    return;
  }

  const resolved = resolveRoute(request);
  if (!resolved) {
    writeJson(response, 404, {
      error: "Not Found",
      message: "Route is not defined"
    });
    return;
  }

  const body = await readJsonBody(request);
  const url = new URL(request.url ?? "/", "http://localhost");

  const payload = resolved.definition.handler({
    request,
    url,
    params: resolved.params,
    body
  });

  writeJson(response, 200, payload);
});

server.listen(port, () => {
  process.stdout.write(`[api] listening on http://localhost:${port}\n`);
});
