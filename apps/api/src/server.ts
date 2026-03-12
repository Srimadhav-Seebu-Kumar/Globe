import { createServer } from "node:http";

import { resolveRoute, writeJson } from "./router.js";

const port = Number(process.env.PORT ?? 4000);

const server = createServer((request, response) => {
  const route = resolveRoute(request);

  if (!route) {
    writeJson(response, 404, {
      error: "Not Found",
      message: "Route is not defined in the initial API scaffold"
    });
    return;
  }

  writeJson(response, 200, route.handler());
});

server.listen(port, () => {
  process.stdout.write(`[api] listening on http://localhost:${port}\n`);
});
