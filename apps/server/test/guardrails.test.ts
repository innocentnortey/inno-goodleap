import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ESTIMATE_LINE } from "@goodleap/shared";
import type { AuditRecord, GuardedRequest, Scenario } from "@goodleap/shared";
import { buildAskRequest } from "../src/assist/ask.ts";
import { JsonlAuditStore, MemoryAuditStore, setAuditStore } from "../src/audit/store.ts";
import { findProduct } from "../src/data.ts";
import { checkDisclosures, runChecks } from "../src/guardrails/checks.ts";
import { guardedGenerate } from "../src/guardrails/index.ts";
import { redactQuestion, APPROVAL_PHRASES, ASK_SAFE_TEMPLATE, ELIGIBILITY_REDIRECT, OFF_TOPIC_REDIRECT, POLICY } from "../src/guardrails/policy.ts";
import { FakeLlm, fakeMessage } from "../src/llm/client.ts";
import { askRoutes } from "../src/routes/ask.ts";

// Synthetic fixture: the WP-2 GL-DEF-18 scenario at $30,000, worked by hand in docs/data/worked-pairs.md.
const DEF18: Scenario = {
  id: "GL-DEF-18@30000", productId: "GL-DEF-18", productName: "Deferred interest, 18-month promo", kind: "deferred",
  amount: 30000, aprPct: 24.99, termMonths: 84, monthlyPayment: 1666.67,
  phases: [{ months: 18, payment: 1666.67, label: "Promo payoff" }], totalPaid: 30000, totalInterest: 0,
  promo: { months: 18, payoffMonthly: 1666.67, retroactiveInterest: 11245.5, condition: "Only cheaper if paid off within 18 months" },
  rank: 0,
  disclosures: { estimateLine: ESTIMATE_LINE, aprPct: 24.99, termMonths: 84, totalCostOfCredit: 0, totalPaid: 30000, lines: [] },
  allowedNumbers: [30000, 1666.67, 18, 24.99, 11245.5, 84, 0],
};
const GOOD = "If any balance is left after month 18, interest at 24.99% is charged from day one on the whole $30,000: about $11,245.50 added. To avoid that you'd pay about $1,666.67 a month for 18 months. Want to see the full terms?";
const BAD_NUMBER = "You'd pay about $1,500 a month for 18 months. Want to see the full terms?";
const QUESTION = "What happens if I don't pay it all off in 18 months?";

function req(over: Partial<GuardedRequest> = {}): GuardedRequest {
  return {
    purpose: "ask", screen: "SCR-2", system: "S", user: "U", promptVersion: "ask-v1",
    allowedNumbers: DEF18.allowedNumbers, disclosures: DEF18.disclosures, safeTemplate: ASK_SAFE_TEMPLATE,
    productId: "GL-DEF-18", catalogVersion: "2026-10-29", auditInput: { question: QUESTION }, ...over,
  };
}
const run = (text: string, d = DEF18.disclosures) => runChecks(text, POLICY, DEF18.allowedNumbers, d);
const byName = (cs: ReturnType<typeof run>, n: string) => cs.find((c) => c.name === n)!;

let store: MemoryAuditStore;
beforeEach(() => { store = new MemoryAuditStore(); setAuditStore(store); });
afterEach(() => setAuditStore(null));

describe("runChecks · numbers", () => {
  it("passes the WP-2 answer", () => {
    expect(run(GOOD).every((c) => c.passed)).toBe(true);
  });
  it("blocks a payment that is not computed ($1,500)", () => {
    const c = byName(run(BAD_NUMBER), "numbers");
    expect(c.passed).toBe(false);
    expect(c.detail).toContain("$1,500");
  });
  it("allows a whole-dollar figure within $1 ($11,245 and $1,667)", () => {
    expect(byName(run("About $11,245 is added, or $1,667 a month."), "numbers").passed).toBe(true);
  });
  it("blocks a whole-dollar figure more than $1 off ($11,247)", () => {
    expect(byName(run("About $11,247 is added."), "numbers").passed).toBe(false);
  });
  it("blocks an invented rate (5.99%)", () => {
    expect(byName(run("The rate is 5.99% APR."), "numbers").passed).toBe(false);
  });
  it("blocks a wrong term (60 months) and accepts 84 months, 7 years and an 18-month promo", () => {
    expect(byName(run("It runs 60 months."), "numbers").passed).toBe(false);
    expect(byName(run("It runs 84 months, which is 7 years, with an 18-month promo."), "numbers").passed).toBe(true);
  });
  it('ignores bare small counts ("2 choices", "after month 18")', () => {
    expect(byName(run("There are 2 choices after month 18."), "numbers").passed).toBe(true);
  });
  it('checks a bare large figure without a $ sign ("9,000")', () => {
    expect(byName(run("You would owe 9,000 more."), "numbers").passed).toBe(false);
  });
});

describe("runChecks · approval language", () => {
  it.each([
    "you qualify", "You're approved", "pre-approved", "preapproved", "guaranteed savings", "you'll get", "you will get",
    "You’ll get", "no risk", "risk-free", "you're eligible", "likely to be approved", "good chance", "you can afford it",
  ])("blocks %s", (phrase) => {
    expect(byName(run(`Note: ${phrase} here.`), "approval_language").passed).toBe(false);
  });
  it("covers every phrase rule", () => {
    expect(APPROVAL_PHRASES.length).toBeGreaterThanOrEqual(11);
  });
  it("passes neutral explanation text", () => {
    expect(byName(run(GOOD), "approval_language").passed).toBe(true);
  });
});

describe("runChecks · disclosures", () => {
  it("fails when the estimate line is blank", () => {
    expect(checkDisclosures({ estimateLine: " ", lines: [] }).passed).toBe(false);
  });
  it("passes and lists the attached figures", () => {
    const c = checkDisclosures(DEF18.disclosures);
    expect(c.passed).toBe(true);
    expect(c.detail).toContain("APR 24.99%");
    expect(c.detail).toContain("term 84 months");
  });
});

describe("buildAskRequest", () => {
  it("user message holds only this product's terms, figures and the question", () => {
    const product = findProduct("GL-DEF-18")!;
    const r = buildAskRequest(product, DEF18, QUESTION, "2026-10-29");
    expect(r.user).toContain(product.terms);
    for (const s of ["$11,245.50", "$1,666.67", "24.99%", `<question>${QUESTION}</question>`]) expect(r.user).toContain(s);
    for (const s of ["GL-FIX", "Fixed 5-year", "GL-INTRO"]) expect(r.user).not.toContain(s);
    for (const n of [30000, 1666.67, 18, 24.99, 11245.5, 84]) expect(r.allowedNumbers).toContain(n);
    expect(r.purpose).toBe("ask");
    expect(r.screen).toBe("SCR-2");
    expect(r.promptVersion).toBe("ask-v1");
    expect(r.disclosures).toBe(DEF18.disclosures);
    expect(r.safeTemplate).toBe(ASK_SAFE_TEMPLATE);
    expect(r.auditInput).toEqual({ question: QUESTION });
    expect(r.system).toContain("OFF_TOPIC");
  });
});

describe("guardedGenerate", () => {
  it("pass first time → shown", async () => {
    const llm = new FakeLlm([GOOD]);
    const a = await guardedGenerate(req(), llm);
    expect(a.outcome).toBe("shown");
    expect(a.attempts).toBe(1);
    expect(llm.calls).toHaveLength(1);
    expect(a.text).toBe(GOOD);
    expect(a.disclosures).toBe(req().disclosures);
    const call = llm.calls[0] as Record<string, unknown>;
    expect(call.max_tokens).toBe(400);
    expect(call.output_config).toEqual({ effort: "low" });
    expect(call.system).toBe("S");
    expect("temperature" in call).toBe(false);
    expect("tool_choice" in call).toBe(false);
    expect(store.records).toHaveLength(1);
    const rec = store.records[0];
    expect(rec.outcome).toBe(a.outcome);
    expect(rec.attempts).toBe(a.attempts);
    expect(rec.rawOutput).toEqual([GOOD]);
    expect(rec.checks[0].every((c) => c.passed)).toBe(true);
  });

  it("fail then pass → regenerated", async () => {
    const llm = new FakeLlm([BAD_NUMBER, GOOD]);
    const a = await guardedGenerate(req(), llm);
    expect(a.outcome).toBe("regenerated");
    expect(a.attempts).toBe(2);
    expect(llm.calls).toHaveLength(2);
    expect(JSON.stringify(llm.calls[1].messages)).toContain("Not in the computed numbers: $1,500");
    expect(store.records).toHaveLength(1);
    expect(byName(store.records[0].checks[0], "numbers").passed).toBe(false);
    expect(store.records[0].checks[1].every((c) => c.passed)).toBe(true);
  });

  it("fail twice → safe_template, exactly 2 calls", async () => {
    const llm = new FakeLlm([BAD_NUMBER, BAD_NUMBER, GOOD]);
    const a = await guardedGenerate(req(), llm);
    expect(a.outcome).toBe("safe_template");
    expect(a.text).toBe(ASK_SAFE_TEMPLATE);
    expect(llm.calls).toHaveLength(2);
    expect(store.records).toHaveLength(1);
    expect(store.records[0].rawOutput).toHaveLength(2);
    expect(store.records[0].attempts).toBe(2);
  });

  it("refusal counts as a failed attempt", async () => {
    const llm = new FakeLlm([fakeMessage([], "refusal"), GOOD]);
    const a = await guardedGenerate(req(), llm);
    expect(a.outcome).toBe("regenerated");
    expect(a.attempts).toBe(2);
    expect(store.records).toHaveLength(1);
  });

  it("refusal twice → safe_template", async () => {
    const llm = new FakeLlm([fakeMessage([], "refusal")]);
    const a = await guardedGenerate(req(), llm);
    expect(a.outcome).toBe("safe_template");
    expect(llm.calls).toHaveLength(2);
    expect(store.records).toHaveLength(1);
  });

  it("redirect: eligibility question makes no model call", async () => {
    const llm = new FakeLlm([GOOD]);
    const a = await guardedGenerate(req({ auditInput: { question: "Will I qualify for this?" } }), llm);
    expect(llm.calls).toHaveLength(0);
    expect(a.outcome).toBe("redirected");
    expect(a.text).toBe(ELIGIBILITY_REDIRECT);
    expect(a.attempts).toBe(0);
    expect(store.records).toHaveLength(1);
    expect(store.records[0].rawOutput).toEqual([]);
  });

  it("redirect: credit-score question", async () => {
    const llm = new FakeLlm([GOOD]);
    const a = await guardedGenerate(req({ auditInput: { question: "Does my credit score matter?" } }), llm);
    expect(a.outcome).toBe("redirected");
    expect(llm.calls).toHaveLength(0);
    expect(store.records).toHaveLength(1);
  });

  it("redirect: OFF_TOPIC reply maps to the off-topic template", async () => {
    const llm = new FakeLlm(["OFF_TOPIC"]);
    const a = await guardedGenerate(req({ auditInput: { question: "What's the weather tomorrow?" } }), llm);
    expect(llm.calls).toHaveLength(1);
    expect(a.outcome).toBe("redirected");
    expect(a.text).toBe(OFF_TOPIC_REDIRECT);
    expect(store.records).toHaveLength(1);
  });

  it("exception_explain skips redirect rules and logs its event", async () => {
    const text = "This happens when a bank's security check takes too long. You can try again or upload a recent pay stub instead; either way the lender's review decides.";
    const llm = new FakeLlm([text]);
    const a = await guardedGenerate(
      req({
        purpose: "exception_explain", screen: "SCR-4", allowedNumbers: [],
        disclosures: { estimateLine: ESTIMATE_LINE, lines: [] }, auditInput: { event: "plaid.connection_failed" },
      }),
      llm,
    );
    expect(a.outcome).toBe("shown");
    expect(store.records).toHaveLength(1);
    const rec = store.records[0];
    expect(rec.purpose).toBe("exception_explain");
    expect(rec.screen).toBe("SCR-4");
    expect(rec.inputs.event).toBe("plaid.connection_failed");
    expect("question" in rec.inputs).toBe(false);
  });

  it("model call that throws → safe_template", async () => {
    const llm = new FakeLlm([() => { throw new Error("boom"); }]);
    const a = await guardedGenerate(req(), llm);
    expect(a.outcome).toBe("safe_template");
    expect(store.records).toHaveLength(1);
    expect(store.records[0].rawOutput).toEqual(["[model call failed]"]);
  });

  it("audit record has exactly the AuditRecord keys", async () => {
    await guardedGenerate(req(), new FakeLlm([GOOD]));
    const rec = store.records[0];
    expect(Object.keys(rec).sort()).toEqual([
      "attempts", "catalogVersion", "checks", "finalText", "id", "inputs", "latencyMs", "model", "outcome",
      "productId", "promptVersion", "purpose", "rawOutput", "screen", "time",
    ]);
    for (const k of Object.keys(rec.inputs)) expect(["question", "event", "allowedNumbers", "disclosures"]).toContain(k);
  });
});

describe("JsonlAuditStore", () => {
  it("appends lines and lists newest first", () => {
    const path = join(mkdtempSync(join(tmpdir(), "gl-audit-")), "nested", "audit.jsonl");
    const s = new JsonlAuditStore(path);
    const mk = (id: string): AuditRecord => ({
      id, time: "t", screen: "SCR-2", purpose: "ask", productId: null, catalogVersion: null, promptVersion: "p", model: "m",
      inputs: { allowedNumbers: [], disclosures: { estimateLine: "e", lines: [] } }, rawOutput: [], checks: [], attempts: 0,
      finalText: "", outcome: "shown", latencyMs: 0,
    });
    s.append(mk("one"));
    s.append(mk("two"));
    expect(readFileSync(path, "utf8").trim().split("\n")).toHaveLength(2);
    expect(s.list()[0].id).toBe("two");
  });
});

describe("POST /ask validation", () => {
  const post = (body: unknown) =>
    askRoutes.request("/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  it("invalid body → 400 without echoing input", async () => {
    const res = await post({ productId: "GL-DEF-18", amount: 30000, question: "ZEBRA-SECRET-4417 " + "x".repeat(500) });
    const text = await res.text();
    expect(res.status).toBe(400);
    expect(JSON.parse(text).error.code).toBe("invalid_request");
    expect(text).not.toContain("ZEBRA-SECRET-4417");
  });
  it("unknown product → 404 without echoing", async () => {
    const res = await post({ productId: "ZEBRA-PRODUCT-99", amount: 30000, question: "Hi" });
    const text = await res.text();
    expect(res.status).toBe(404);
    expect(JSON.parse(text).error.code).toBe("unknown_product");
    expect(text).not.toContain("ZEBRA-PRODUCT-99");
  });
  it("amount out of range → 400", async () => {
    const res = await post({ productId: "GL-DEF-18", amount: 4000, question: "Hi" });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("amount_out_of_range");
  });
});

describe("review fixes", () => {
  it("blocks implied-eligibility wording", () => {
    for (const t of ["You're in good shape.", "It should go through.", "They will likely say yes.", "You're prequalified.", "Not approved is unlikely.", "Sure thing!", "You won't have any trouble.", "There is no credit check.", "Definitely."]) {
      expect(byName(run(t), "approval_language").passed, t).toBe(false);
    }
  });
  it("redirects afford questions in code", async () => {
    const llm = new FakeLlm([GOOD]);
    const a = await guardedGenerate(req({ auditInput: { question: "Can I afford this?" } }), llm);
    expect(a.outcome).toBe("redirected");
    expect(llm.calls).toHaveLength(0);
  });
  it("checks counts written as payments or mo", () => {
    expect(byName(run("Over 24 payments of $1,666.67."), "numbers").passed).toBe(false);
    expect(byName(run("Over 36 mo."), "numbers").passed).toBe(false);
    expect(byName(run("Over 18 payments of $1,666.67."), "numbers").passed).toBe(true);
  });
  it("applies dollar tolerance only to allowed values of 100 or more", () => {
    for (const t of ["$19 a month", "$25", "$17 fee"]) expect(byName(run(t), "numbers").passed, t).toBe(false);
    for (const t of ["$11,246", "$1,667", "$30,000"]) expect(byName(run(t), "numbers").passed, t).toBe(true);
  });
  it("treats max_tokens as a failed attempt", async () => {
    const cut = fakeMessage([{ type: "text", text: GOOD, citations: null }], "max_tokens");
    const llm = new FakeLlm([cut, GOOD]);
    const a = await guardedGenerate(req(), llm);
    expect(a.outcome).toBe("regenerated");
    expect(llm.calls).toHaveLength(2);
    expect(String((llm.calls[1] as { messages: { content: string }[] }).messages[0].content)).toContain("cut off");
  });
  it("masks identifiers in the question but keeps dollar amounts", async () => {
    expect(redactQuestion("a <b> $30,000")).toBe("a b $30,000");
    const q = "My SSN is 123-45-6789, mail me@example.com, call (555) 123-4567: what if I owe $30,000?";
    const r = buildAskRequest(findProduct("GL-DEF-18")!, DEF18, q, "2026-10-29");
    const llm = new FakeLlm([GOOD]);
    await guardedGenerate(r, llm);
    const sent = JSON.stringify(llm.calls[0]);
    const rec = store.records[0];
    for (const s of [sent, rec.inputs.question!]) {
      expect(s).toContain("[SSN]"); expect(s).toContain("[email]"); expect(s).toContain("[phone]"); expect(s).toContain("$30,000");
      expect(s).not.toContain("123-45-6789"); expect(s).not.toContain("me@example.com"); expect(s).not.toContain("555");
    }
  });
});
