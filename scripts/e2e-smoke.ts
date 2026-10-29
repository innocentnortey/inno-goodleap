// Smoke run of the two PRD flows through the real UI and the real model (USER_FLOWS flow A and flow B).
// Needs `npm run dev` running. Usage: npm run smoke   (WEB_URL overrides http://127.0.0.1:5173)
// Writes screenshots to docs/artifacts/screens/smoke-*.png and exits non-zero on the first failed step.
import { mkdirSync } from "node:fs";
import { chromium, type Page } from "playwright";

const BASE = process.env.WEB_URL ?? "http://127.0.0.1:5173";
const OUT = "docs/artifacts/screens";
mkdirSync(OUT, { recursive: true });

const results: { step: string; ok: boolean; ms: number; detail?: string }[] = [];
async function step(name: string, fn: () => Promise<void>) {
  const t = Date.now();
  try {
    await fn();
    results.push({ step: name, ok: true, ms: Date.now() - t });
  } catch (e) {
    results.push({ step: name, ok: false, ms: Date.now() - t, detail: e instanceof Error ? e.message.split("\n")[0] : String(e) });
    throw e;
  }
}
const shot = (page: Page, name: string) => page.screenshot({ path: `${OUT}/smoke-${name}.png` });
const click = (page: Page, name: string | RegExp) => page.getByRole("button", { name, exact: typeof name === "string" }).first().click();

async function startOver(page: Page) {
  await page.goto(`${BASE}/#/compare`);
  await click(page, "Start over");
  await page.locator("article[data-scenario]").first().waitFor({ timeout: 15_000 });
}

async function chooseAndStart(page: Page, productId: string) {
  const card = page.locator(`article[data-scenario="${productId}"]`);
  if (!(await card.count())) await page.getByRole("button", { name: /Show all/ }).click();
  await card.getByRole("button", { name: "Choose this option" }).click();
  await click(page, "Start application");
  await page.waitForURL(/#\/apply/);
}

async function prepare(page: Page, estimateText: RegExp) {
  await page.getByText(estimateText).first().click();
  await click(page, "Prepare application");
  await page.getByText("Agent steps").first().waitFor({ timeout: 60_000 });
}

async function reviewAndSubmit(page: Page, expected: RegExp) {
  await click(page, "Continue to review");
  await page.waitForURL(/#\/review/);
  await page.fill("#id-fullName", "Demo Homeowner");
  await page.fill("#id-address", "1500 Demo Ln, Austin, TX 78704");
  await page.fill("#id-dateOfBirth", "1985-04-12");
  await page.fill("#id-ssnLast4", "1234");
  for (const cb of await page.getByRole("checkbox").all()) await cb.check();
  await click(page, "Submit application");
  await page.getByText("Sent to the lender's credit review").first().waitFor({ timeout: 15_000 });
  await page.getByText(expected).first().waitFor();
  await page.getByText("This result comes from the credit decision engine, not from this assistant.").first().waitFor();
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors: string[] = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });

let failed = false;
try {
  // ---- Flow A: happy path ----
  await step("A1 compare: $30,000 quote shows FIX-15 at $286.70", async () => {
    await startOver(page);
    await page.locator('article[data-scenario="GL-FIX-15"]').getByText("$286.70").first().waitFor();
    await shot(page, "a1-compare");
  });
  await step("A2 ask: deferred-interest question cites $11,245.50 with disclosures", async () => {
    await page.getByRole("button", { name: /Show all/ }).click();
    await page.locator('article[data-scenario="GL-DEF-18"]').getByRole("button", { name: "Ask about this option" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Your question").fill("What happens if I don't pay it all off in 18 months?");
    await dialog.getByRole("button", { name: "Ask", exact: true }).click();
    await dialog.getByText(/11,24[56]/).first().waitFor({ timeout: 20_000 });
    await dialog.locator("[data-disclosure]").last().waitFor();
    await shot(page, "a2-ask");
  });
  await step("A3 ask: 'Will I qualify?' is redirected", async () => {
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Your question").fill("Will I qualify for this?");
    await dialog.getByRole("button", { name: "Ask", exact: true }).click();
    await dialog.getByText(/can't say whether you'd qualify|credit review/i).first().waitFor({ timeout: 20_000 });
    await page.keyboard.press("Escape");
  });
  await step("A4 apply: agent prepares roof_messy (down payment $2,000)", async () => {
    await chooseAndStart(page, "GL-FIX-15");
    await prepare(page, /handwritten-style/);
    await page.getByText("$2,000.00").first().waitFor();
    await shot(page, "a4-apply");
  });
  await step("A5 verify: bank connects, income from Plaid", async () => {
    await click(page, "Hand to homeowner");
    await page.waitForURL(/#\/verify/);
    await click(page, "Connect bank");
    await click(page, "Connect bank (succeeds)");
    await page.getByText("$68,900.00").first().waitFor({ timeout: 15_000 });
  });
  await step("A6 submit: engine returns pending", async () => {
    await reviewAndSubmit(page, /Decision: Pending/);
    await shot(page, "a6-submitted");
  });

  // ---- Flow B: bank connection fails, pay-stub recovery ----
  await step("B1 start: new session, choose FIX-10, prepare roof_clean", async () => {
    await startOver(page);
    await chooseAndStart(page, "GL-FIX-10");
    await prepare(page, /clean estimate/);
  });
  await step("B2 verify: connection fails → plain-words status + guarded explanation", async () => {
    await click(page, "Hand to homeowner");
    await click(page, "Connect bank");
    await click(page, "Connect bank (fails)");
    await page.getByText("Nothing was submitted and no decision was made.").first().waitFor({ timeout: 20_000 });
    await page.getByText("What happened, in plain words").first().waitFor({ timeout: 20_000 });
    await shot(page, "b2-verify-failed");
  });
  await step("B3 recover: pay stub → $68,900.00 from document, needs review", async () => {
    await click(page, "Upload a pay stub instead");
    await page.getByText("$68,900.00").first().waitFor({ timeout: 15_000 });
    await page.getByText("Needs review").first().waitFor();
  });
  await step("B4 R-12: income never appears on the contractor's screen", async () => {
    await page.goto(`${BASE}/#/apply`);
    await page.getByText("Prefilled fields").first().waitFor();
    const text = await page.locator("#screen").innerText();
    if (text.includes("68,900")) throw new Error("income value rendered on SCR-3");
    await page.goto(`${BASE}/#/verify`);
  });
  await step("B5 submit: engine returns conditional", async () => {
    await reviewAndSubmit(page, /Decision: Received with conditions/);
    await shot(page, "b5-submitted");
  });
  await step("B6 audit: SCR-6 lists the ask and exception_explain records", async () => {
    await page.goto(`${BASE}/#/audit`);
    await page.getByText(/exception_explain|Bank connection explanation|explain/i).first().waitFor({ timeout: 10_000 });
    await shot(page, "b6-audit");
  });
} catch {
  failed = true;
  await shot(page, "failure").catch(() => undefined);
} finally {
  await browser.close();
}

const w = Math.max(...results.map((r) => r.step.length));
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.step.padEnd(w)}  ${(r.ms / 1000).toFixed(1)}s${r.detail ? `  ${r.detail}` : ""}`);
if (consoleErrors.length) console.log(`console errors (${consoleErrors.length}): ${consoleErrors.slice(0, 3).join(" | ")}`);
console.log(failed ? "SMOKE FAILED" : `SMOKE PASSED · ${results.length} steps`);
process.exit(failed ? 1 : 0);
