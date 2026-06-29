import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const valueFor = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const port = Number(valueFor("--port", "4173"));
const host = valueFor("--host", "127.0.0.1");
const serveRoot = path.resolve(ROOT, valueFor("--root", "dist"));

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".ico": "image/x-icon",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp",
};

async function resolveRequest(pathname) {
  const decoded = decodeURIComponent(pathname);
  const clean = decoded.replace(/^\/+/, "");
  const candidates = [];
  if (!clean) candidates.push("index.html");
  else {
    candidates.push(clean);
    candidates.push(`${clean}.html`);
    candidates.push(path.join(clean, "index.html"));
  }
  for (const candidate of candidates) {
    const absolute = path.resolve(serveRoot, candidate);
    if (!absolute.startsWith(serveRoot)) continue;
    try {
      const stat = await fs.stat(absolute);
      if (stat.isFile()) return absolute;
    } catch {
      // Try the next static route candidate.
    }
  }
  return null;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);
  const file = await resolveRequest(url.pathname);
  if (!file) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("404 · HiLoki Live House 暂无这张票");
    return;
  }
  const content = await fs.readFile(file);
  response.writeHead(200, {
    "Content-Type": contentTypes[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  response.end(content);
});

server.listen(port, host, () => {
  console.log(`HiLoki.ai preview: http://${host}:${port}`);
  console.log(`Serving: ${serveRoot}`);
});
