import z from "schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";

const NAMESPACE = "dsh-topbar-manager";
const ROUTE = "/topbar-manager/api/settings";
const Preferences = z.object({
  visibility: z.dict(z.boolean()).default({})
});

function isSameOrigin(req) {
  if (req.headers?.["sec-fetch-site"] === "cross-site") return false;
  const host = req.headers?.host;
  const origin = req.headers?.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function sendJson(res, status, value) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(value));
}

async function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 64 * 1024) {
        reject(new Error("settings payload is too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        reject(new Error("settings payload is empty"));
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("settings payload is invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

/** Register profile-backed preferences and the same-origin client bridge. */
export function apply(ctx) {
  ctx.inject(["settings", "webServer"], (serviceCtx) => {
    const scope = serviceCtx.settings.register(
      settingsNamespace(NAMESPACE),
      Preferences
    );

    serviceCtx.effect(() => serviceCtx.webServer.register({
      name: "dsh-topbar-manager-settings",
      kind: "exact",
      path: ROUTE,
      handler: async (req, res) => {
        if (!isSameOrigin(req)) {
          sendJson(res, 403, { error: "forbidden" });
          return;
        }
        const method = String(req.method ?? "GET").toUpperCase();
        if (method === "OPTIONS") {
          res.writeHead(204, { "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type, accept" });
          res.end();
          return;
        }
        if (method === "GET") {
          sendJson(res, 200, scope.get());
          return;
        }
        if (method !== "POST") {
          res.writeHead(405).end();
          return;
        }
        try {
          const body = await readJson(req);
          const visibility = body?.visibility;
          if (!visibility || typeof visibility !== "object" || Array.isArray(visibility)) {
            throw new Error("visibility must be an object");
          }
          await scope.update({ visibility });
          sendJson(res, 200, scope.get());
        } catch (error) {
          sendJson(res, 400, { error: String(error?.message ?? error) });
        }
      }
    }));
  });
}
