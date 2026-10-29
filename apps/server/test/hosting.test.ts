import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.ts";
import { serverOptions } from "../src/hosting.ts";

const webRoot = mkdtempSync(join(tmpdir(), "goodleap-web-"));
mkdirSync(join(webRoot, "assets"));
writeFileSync(join(webRoot, "index.html"), "<!doctype html><title>GoodLeap demo</title>");
writeFileSync(join(webRoot, "assets/app.js"), "console.log('demo');");
afterAll(() => rmSync(webRoot, { recursive: true, force: true }));

describe("production hosting boundary", () => {
  const app = createApp({ webRoot });
  it("serves the built UI and its assets on the API origin", async () => {
    const page = await app.request("/");
    expect(page.status).toBe(200);
    expect(page.headers.get("content-type")).toContain("text/html");
    expect(await page.text()).toContain("GoodLeap demo");
    const asset = await app.request("/assets/app.js");
    expect(asset.status).toBe(200);
    expect(await asset.text()).toContain("console.log");
  });
  it("keeps health and unknown API routes as JSON", async () => {
    expect(await (await app.request("/api/health")).json()).toMatchObject({ ok: true });
    const missing = await app.request("/api/not-a-route");
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ error: { code: "not_found" } });
  });
  it.each(["/.env", "/data/synthetic/catalog.json", "/docs/design-doc.md", "/src/index.ts", "/assets/missing.js", "/assets/%2e%2e/%2e%2e/.env"])("does not serve %s", async (path) => {
    expect((await app.request(path)).status).toBe(404);
  });
  it("leaves local development API-only", async () => {
    expect((await createApp().request("/")).status).toBe(404);
  });
  it("uses Render's PORT and a public bind only in production", () => {
    expect(serverOptions({ NODE_ENV: "production", PORT: "10000", API_PORT: "8787" })).toEqual({ port: 10000, hostname: "0.0.0.0" });
    expect(serverOptions({ API_PORT: "8788" })).toEqual({ port: 8788, hostname: "127.0.0.1" });
    expect(serverOptions({})).toEqual({ port: 8787, hostname: "127.0.0.1" });
  });
});
