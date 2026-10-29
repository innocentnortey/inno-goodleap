import { describe, expect, it, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { ESTIMATE_LINE } from "@goodleap/shared";
import type { GuardedRequest, PrefillField, Scenario } from "@goodleap/shared";
import { runAgent } from "../src/application/agent.ts";
import { extractEstimate, findBalanceDue, quoteFound, validateExtraction } from "../src/application/extract.ts";
import type { RawExtraction } from "../src/application/extract.ts";
import { EXPLAIN_TEMPLATE_FAILED, EXPLAIN_TEMPLATE_INSUFFICIENT } from "../src/application/income.ts";
import { prepare } from "../src/application/prepare.ts";
import type { PrepContext } from "../src/application/tools.ts";
import { LABELS } from "../src/application/fields.ts";
import { listEstimates } from "../src/data.ts";
import { ContractorProfileMock, CreditEngineMock, mockIntegrations } from "../src/integrations/index.ts";
import type { ContractorProfile } from "../src/integrations/index.ts";
import { FakeLlm, fakeMessage } from "../src/llm/client.ts";
import type { CreateParams } from "../src/llm/client.ts";
import { buildApplicationRoutes } from "../src/routes/application.ts";

const toolUse = (id: string, name: string, input: unknown) => ({ type: "tool_use", id, name, input, caller: { type: "direct" } }) as unknown as Anthropic.ContentBlock;
const text = (t: string) => ({ type: "text", text: t, citations: null }) as unknown as Anthropic.ContentBlock;
const withUsage = (m: Anthropic.Message, input: number) => ({ ...m, usage: { input_tokens: input, output_tokens: 0 } }) as Anthropic.Message;
const est = (id: string) => listEstimates().find((e) => e.id === id)!.text;
const MESSY = est("roof_messy");
const CLEAN = est("roof_clean");
const HVAC = est("hvac_missing_total");
const SCENARIO: Scenario = { id: "GL-FIX-10@30000", productId: "GL-FIX-10", productName: "10-year fixed", kind: "fixed", amount: 30000, aprPct: 7.49, termMonths: 120, monthlyPayment: 356.12, phases: [], totalPaid: 42734.4, totalInterest: 12734.4, rank: 0, disclosures: { estimateLine: ESTIMATE_LINE, lines: [] }, allowedNumbers: [] } as unknown as Scenario;
const CTX: PrepContext = { contractorId: "C-1001", productId: "GL-FIX-10", amount: 30000, priority: "lower_monthly", estimateText: MESSY };
const q = (value: string | number | null, sourceQuote: string | null, confidence = 0.95) => ({ value, sourceQuote, confidence });
const MESSY_RAW: RawExtraction = {
  projectType: q("roof_replacement", "tear off 1 layer comp … arch shingles", 0.95) as RawExtraction["projectType"],
  estimateTotal: q(30000, "TOTAL  30,000", 0.97) as RawExtraction["estimateTotal"],
  downPayment: q(2000, "deposit recvd 10/27 .... (2,000)", 0.9) as RawExtraction["downPayment"],
  scopeSummary: q("Full tear-off and replacement with architectural shingles", "30 sq GAF Timberline HDZ arch shingles", 0.85) as RawExtraction["scopeSummary"],
};

const byKey = (fields: PrefillField[], key: string) => fields.find((f) => f.key === key)!;

/** One FakeLlm answers both the extraction call (has a json_schema format) and the agent turns. */
function scripted(turns: (Anthropic.Message | ((p: CreateParams) => Anthropic.Message))[], raw: RawExtraction = MESSY_RAW) {
  let i = 0;
  return new FakeLlm([(p) => {
    if (p.output_config?.format) return JSON.stringify(raw);
    const t = turns[Math.min(i++, turns.length - 1)]!;
    return typeof t === "function" ? t(p) : t;
  }]);
}
const HAPPY = () => [
  fakeMessage([
    toolUse("t1", "get_contractor_profile", { contractorId: "C-1001" }),
    toolUse("t2", "get_selected_scenario", { productId: "GL-FIX-10", amount: 30000 }),
    toolUse("t3", "extract_estimate", {}),
  ], "tool_use"),
  fakeMessage([toolUse("t4", "list_missing_fields", {})], "tool_use"),
  fakeMessage([text("Ready except the homeowner's details.")]),
];
const profiles = () => new ContractorProfileMock();
const depsFor = (llm: FakeLlm, extra: object = {}) => ({ llm, profiles: profiles(), scenario: () => SCENARIO, ...extra });

describe("validateExtraction", () => {
  it("T1 roof_messy: down payment 2,000 and financed 28,000 computed by code, matching BAL DUE", () => {
    const f = validateExtraction(MESSY_RAW, MESSY, 28000);
    expect(byKey(f, "project.downPayment")).toMatchObject({ value: 2000, status: "ready" });
    const fin = byKey(f, "financing.financedAmount");
    expect(fin).toMatchObject({ value: 28000, status: "ready" });
    expect(fin.note).toContain("computed by code");
    expect(fin.note).toContain("matches the estimate's balance due");
  });
  it("T2 roof_clean: deposit 0, financed 30,000", () => {
    const raw = { ...MESSY_RAW, estimateTotal: q(30000, "Total estimated cost: $30,000.00"), downPayment: q(0, "Deposit due at signing: $0.00") } as RawExtraction;
    const f = validateExtraction(raw, CLEAN, 30000);
    expect(byKey(f, "financing.financedAmount")).toMatchObject({ value: 30000, status: "ready" });
    expect(findBalanceDue(CLEAN)).toBe(30000);
  });
  it("T3 hvac: null total is needs_input with the reason, no number invented", () => {
    const raw = { ...MESSY_RAW, estimateTotal: q(null, "Pricing to be confirmed after attic inspection.", 0.9), downPayment: q(null, null, 0.9) } as RawExtraction;
    const f = validateExtraction(raw, HVAC, 30000);
    const t = byKey(f, "project.estimateTotal");
    expect(t.status).toBe("needs_input");
    expect(t.value).toBeNull();
    expect(t.note!.toLowerCase()).toContain("pricing to be confirmed after attic inspection");
    expect(byKey(f, "financing.financedAmount")).toMatchObject({ value: null, status: "needs_input" });
  });
  it("T4 total outside 5,000 to 100,000 is needs_review", () => {
    for (const v of [150000, 3000]) {
      const text = `TOTAL ${v}`;
      const raw = { ...MESSY_RAW, estimateTotal: q(v, `TOTAL ${v}`), downPayment: q(null, null) } as RawExtraction;
      expect(byKey(validateExtraction(raw, text, v), "project.estimateTotal").status).toBe("needs_review");
    }
  });
  it("T5 a source quote not in the estimate is needs_review", () => {
    const raw = { ...MESSY_RAW, estimateTotal: q(31500, "TOTAL 31,500") } as RawExtraction;
    const t = byKey(validateExtraction(raw, MESSY, 30000), "project.estimateTotal");
    expect(t.status).toBe("needs_review");
    expect(t.note).toContain("not found");
  });
  it("T6 confidence below 0.7 is needs_review", () => {
    const raw = { ...MESSY_RAW, estimateTotal: q(30000, "TOTAL  30,000", 0.55) } as RawExtraction;
    const t = byKey(validateExtraction(raw, MESSY, 30000), "project.estimateTotal");
    expect(t.status).toBe("needs_review");
    expect(t.note).toContain("0.55");
  });
  it("T7 quoteFound tolerates whitespace, case, ellipses and dot leaders", () => {
    expect(quoteFound("deposit recvd 10/27 .... (2,000)", MESSY)).toBe(true);
    expect(quoteFound("TOTAL 30,000", MESSY)).toBe(true);
    expect(quoteFound("total 99,000", MESSY)).toBe(false);
  });
  it("T8 financed differing from the quoted amount is needs_review", () => {
    const fin = byKey(validateExtraction(MESSY_RAW, MESSY, 30000), "financing.financedAmount");
    expect(fin).toMatchObject({ value: 28000, status: "needs_review" });
    expect(fin.note).toContain("quoted on Compare");
  });
});

describe("quote grounding (C1)", () => {
  it("T32 a number that is not in its quote is needs_review", () => {
    const raw = { ...MESSY_RAW, estimateTotal: q(5000, "Roof replacement") } as RawExtraction;
    const t = byKey(validateExtraction(raw, "Roof replacement TOTAL 5,000", 5000), "project.estimateTotal");
    expect(t.status).toBe("needs_review");
    expect(t.note).toContain("isn't in the quoted text");
  });
  it("T33 a 1-3 character quote is needs_review", () => {
    for (const quote of ["5", "$5k", "30"]) {
      const raw = { ...MESSY_RAW, estimateTotal: q(30, quote) } as RawExtraction;
      expect(byKey(validateExtraction(raw, "TOTAL 30 5 $5k", 30), "project.estimateTotal").status).toBe("needs_review");
    }
  });
  it("T34 a scopeSummary with a word absent from the estimate is needs_review", () => {
    const raw = { ...MESSY_RAW, scopeSummary: q("Approved full tear off with shingles", "30 sq GAF Timberline HDZ arch shingles", 0.9) } as RawExtraction;
    const s = byKey(validateExtraction(raw, MESSY, 28000), "project.scopeSummary");
    expect(s.status).toBe("needs_review");
    expect(s.note).toContain("written by the model");
  });
});

describe("extractEstimate", () => {
  it("T9 sends only the estimate text with a JSON schema and low effort", async () => {
    const llm = new FakeLlm([JSON.stringify(MESSY_RAW)]);
    const out = await extractEstimate(MESSY, llm, 28000);
    expect(out.ok).toBe(true);
    const call = llm.calls[0]!;
    expect(call.output_config?.format?.type).toBe("json_schema");
    expect(call.output_config?.effort).toBe("low");
    expect(call.tools).toBeUndefined();
    const content = JSON.stringify(call.messages[0]!.content);
    expect(content).toContain("<estimate>");
    expect(content).toContain("BAL DUE");
    const all = JSON.stringify(call);
    for (const s of ["C-1001", "68900", "Austin ISD"]) expect(all).not.toContain(s);
  });
  it("T10 refusal is not ok and nothing is invented", async () => {
    const out = await extractEstimate(MESSY, new FakeLlm([fakeMessage([text("")], "refusal")]), 28000);
    expect(out).toMatchObject({ ok: false, code: "refusal" });
  });
  it("T11 unparseable output is not ok", async () => {
    expect(await extractEstimate(MESSY, new FakeLlm(["not json"]), 28000)).toMatchObject({ ok: false, code: "unparseable" });
  });
});

describe("runAgent", () => {
  it("T12 happy path: parallel first turn, then list_missing_fields, in at most 6 steps", async () => {
    const llm = scripted(HAPPY());
    const run = await runAgent(CTX, depsFor(llm));
    expect(run.stop).toBe("completed");
    expect(run.steps.length).toBe(4);
    expect(run.steps.map((s) => s.tool)).toEqual(["get_contractor_profile", "get_selected_scenario", "extract_estimate", "list_missing_fields"]);
    const agentCalls = llm.calls.filter((c) => !c.output_config?.format);
    for (const c of agentCalls) {
      expect(c.tool_choice).toEqual({ type: "auto" });
      expect(c.output_config?.effort).toBe("low");
      for (const t of c.tools!) {
        expect((t as Anthropic.Tool).strict).toBe(true);
        expect((t as Anthropic.Tool).input_schema.additionalProperties).toBe(false);
      }
    }
    // FakeLlm keeps a reference to the live messages array, so read the first tool-result turn by position.
    const last = agentCalls[1]!.messages[2]!.content as Anthropic.ToolResultBlockParam[];
    expect(last.map((b) => b.tool_use_id)).toEqual(["t1", "t2", "t3"]);
    expect(last.every((b) => b.type === "tool_result")).toBe(true);

    const app = await prepare({ contractorId: "C-1001", productId: "GL-FIX-10", amount: 28000, priority: "lower_monthly", estimateText: MESSY }, depsFor(scripted(HAPPY())));
    expect(app.fields).toHaveLength(15);
    expect(byKey(app.fields, "contractor.businessName")).toMatchObject({ value: "ABC Roofing LLC", source: "profile" });
    expect(byKey(app.fields, "financing.financedAmount").value).toBe(28000);
    for (const k of ["you.fullName", "you.address", "you.dateOfBirth", "you.ssnLast4"]) expect(byKey(app.fields, k)).toMatchObject({ status: "needs_input", source: null });
    for (const k of ["income.grossAnnualIncome", "income.employer"]) expect(byKey(app.fields, k)).toMatchObject({ status: "needs_authorization", value: null });
    expect(app.checklist).toContain("Homeowner: verify income on the next step.");
  });
  it("T13 the step brake fires at 6", async () => {
    let n = 0;
    const llm = scripted([(): Anthropic.Message => { n++; return fakeMessage([toolUse(`x${n}`, `unknown_${n}`, {})], "tool_use"); }]);
    const run = await runAgent(CTX, depsFor(llm));
    expect(run.stop).toBe("max_steps");
    expect(run.steps.length).toBe(6);
  });
  it("T13b the agent stops after list_missing_fields without another model call", async () => {
    const llm = scripted(HAPPY());
    const run = await runAgent(CTX, depsFor(llm));
    expect(run.stop).toBe("completed");
    expect(run.steps.map((s) => s.tool)).toHaveLength(4);
    expect(llm.calls.filter((c) => !c.output_config?.format)).toHaveLength(2);
  });
  it("T14 the identical-call breaker fires on the 3rd identical call", async () => {
    const llm = scripted([fakeMessage([toolUse("p", "get_contractor_profile", { contractorId: "C-1001" })], "tool_use")]);
    const run = await runAgent(CTX, depsFor(llm));
    expect(run.stop).toBe("identical_calls");
    expect(run.steps.length).toBe(2);
  });
  it("T15 the wall-clock brake fires", async () => {
    let clock = 0;
    const llm = scripted([() => { clock += 50_000; return fakeMessage([toolUse("p", "extract_estimate", {})], "tool_use"); }]);
    const run = await runAgent(CTX, depsFor(llm, { now: () => clock }));
    expect(run.stop).toBe("wall_clock");
  });
  it("T16 the token budget brake fires", async () => {
    const llm = scripted([withUsage(fakeMessage([toolUse("p", "get_contractor_profile", { contractorId: "C-1001" })], "tool_use"), 50_000)]);
    const run = await runAgent(CTX, depsFor(llm));
    expect(run.stop).toBe("token_budget");
    expect(llm.calls.length).toBe(1);
  });
  it("T17 a pinned-id mismatch returns a structured tool error and never executes", async () => {
    const get = vi.fn(async (id: string) => (id === "C-1001" ? ({ id } as ContractorProfile) : null));
    const llm = scripted([fakeMessage([toolUse("a", "get_contractor_profile", { contractorId: "C-1002" })], "tool_use"), fakeMessage([text("done")])]);
    const run = await runAgent(CTX, { llm, profiles: { get }, scenario: () => SCENARIO });
    expect(get).not.toHaveBeenCalled();
    const res = (llm.calls[1]!.messages.at(-1)!.content as Anthropic.ToolResultBlockParam[])[0]!;
    expect(res.is_error).toBe(true);
    expect(JSON.parse(res.content as string).code).toBe("scope_mismatch");
    expect(res.content as string).not.toContain("C-1002");
    expect(run.steps[0]!.summary.startsWith("Rejected")).toBe(true);
  });
  it("T18 an unknown tool and malformed input return is_error results", async () => {
    const llm = scripted([
      fakeMessage([toolUse("a", "delete_everything", {}), toolUse("b", "get_selected_scenario", { productId: "GL-FIX-10", amount: "lots" })], "tool_use"),
      fakeMessage([text("done")]),
    ]);
    const run = await runAgent(CTX, depsFor(llm));
    const res = llm.calls[1]!.messages.at(-1)!.content as Anthropic.ToolResultBlockParam[];
    expect(res.map((r) => JSON.parse(r.content as string).code)).toEqual(["unknown_tool", "invalid_arguments"]);
    expect(run.steps[0]!.tool).toBe("unknown_tool");
  });
  it("T19 no tool call is ended_early; prepare still builds fields with deterministic backfill", async () => {
    const llm = scripted([fakeMessage([text("Nothing to do.")])]);
    const run = await runAgent(CTX, depsFor(llm));
    expect(run.stop).toBe("ended_early");
    const app = await prepare({ contractorId: "C-1001", productId: "GL-FIX-10", amount: 30000, priority: "lower_monthly", estimateText: MESSY }, depsFor(scripted([fakeMessage([text("Nothing to do.")])])));
    expect(byKey(app.fields, "contractor.businessName").value).toBe("ABC Roofing LLC");
    const t = byKey(app.fields, "project.estimateTotal");
    expect(t.status).toBe("needs_input");
    expect(t.note!.startsWith("Not read")).toBe(true);
    expect(app.checklist[0]).toBe("The assistant stopped early; check every field.");
  });
  it("T20 C-6: no model request carries identity or income", async () => {
    const llm = scripted(HAPPY());
    await runAgent(CTX, depsFor(llm));
    const all = JSON.stringify(llm.calls).toLowerCase();
    for (const s of ["68900", "austin isd"]) expect(all).not.toContain(s);
    // Field keys may appear in list_missing_fields, but never a value for a you.* or income.* field.
    const results = llm.calls.flatMap((c) => c.messages.flatMap((m) => (Array.isArray(m.content) ? m.content : [])))
      .filter((b): b is Anthropic.ToolResultBlockParam => b.type === "tool_result")
      .map((b) => JSON.parse(b.content as string) as { missing?: Record<string, unknown>[]; fields?: Record<string, unknown>[] });
    const rows = results.flatMap((r) => [...(r.missing ?? []), ...(r.fields ?? [])]);
    const sensitive = rows.filter((r) => /^(you|income)\./.test(String(r.key)));
    expect(sensitive.length).toBeGreaterThan(0);
    for (const r of sensitive) expect(r).not.toHaveProperty("value");
  });
});

describe("application routes", () => {
  const explainSpy = vi.fn(async (req: GuardedRequest) => ({ text: req.safeTemplate, outcome: "safe_template" as const, disclosures: req.disclosures, checks: [], attempts: 0, auditId: "t", latencyMs: 0 }));
  const app = buildApplicationRoutes({ llm: () => scripted(HAPPY()), integrations: mockIntegrations(), scenario: () => SCENARIO, explain: explainSpy });
  const post = (path: string, body: unknown) => app.request(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const ready = (over: Partial<PrefillField>[] = []): PrefillField[] => [
    ...Object.entries(LABELS).map(([key, label]): PrefillField => {
      const group = key.split(".")[0] as PrefillField["group"];
      const value = key === "you.fullName" ? "Zed Testperson" : key === "you.ssnLast4" ? "9876" : key === "income.grossAnnualIncome" ? 68900 : key === "project.estimateTotal" ? 30000 : "x";
      return { key, label, group, value, source: group === "income" ? "plaid" : "homeowner", status: "ready" };
    }),
    ...over.map((o) => ({ key: "x", label: "x", group: "project" as const, value: null, source: null, status: "ready" as const, ...o })),
  ];
  const consents = { disclosuresRead: true, creditCheck: true, accurate: true };
  const submitBody = (fields: PrefillField[], c = consents) => ({ productId: "GL-FIX-10", amount: 28000, fields, consents: c });

  it("T21 GET /estimates returns the three samples", async () => {
    const res = await app.request("/estimates");
    expect((await res.json() as { id: string }[]).map((e) => e.id)).toEqual(["roof_clean", "roof_messy", "hvac_missing_total"]);
  });
  it("T22 prepare rejects a bad body without echoing it", async () => {
    const res = await post("/application/prepare", { contractorId: "ZZZ-ECHO-ME" });
    expect(res.status).toBe(400);
    const t = await res.text();
    expect(JSON.parse(t).error.code).toBe("invalid_request");
    expect(t).not.toContain("ZZZ-ECHO-ME");
  });
  it("T23 Plaid success fills income from plaid", async () => {
    explainSpy.mockClear();
    const r = await (await post("/income/plaid", { demoOutcome: "success" })).json() as { status: string; fields: PrefillField[] };
    expect(r.status).toBe("verified");
    expect(byKey(r.fields, "income.grossAnnualIncome")).toMatchObject({ value: 68900, source: "plaid", status: "ready" });
    expect(byKey(r.fields, "income.employer").value).toBe("Austin ISD");
    expect(explainSpy).not.toHaveBeenCalled();
  });
  it("T24 Plaid connection_failed: template status line and a guarded explanation with no numbers", async () => {
    explainSpy.mockClear();
    const r = await (await post("/income/plaid", { demoOutcome: "connection_failed" })).json() as { statusLine: string; fields: unknown[]; explanation?: { text: string } };
    expect(r.statusLine).toBe("We couldn't finish connecting to Demo Credit Union: the bank's extra verification step timed out. Nothing was submitted and no decision was made.");
    expect(r.fields).toEqual([]);
    expect(r.explanation!.text).toBeDefined();
    expect(explainSpy).toHaveBeenCalledTimes(1);
    const req = explainSpy.mock.calls[0]![0];
    expect(req).toMatchObject({ purpose: "exception_explain", screen: "SCR-4", allowedNumbers: [], promptVersion: "explain-v1", safeTemplate: EXPLAIN_TEMPLATE_FAILED });
    expect(req.auditInput).toEqual({ event: "INSTITUTION_MFA_TIMEOUT" });
    expect(req.disclosures.estimateLine).toBe(ESTIMATE_LINE);
    const all = req.user + req.system + req.safeTemplate;
    expect(/\d|\$|%/.test(all)).toBe(false);
    for (const w of ["qualif", "approv", "eligib", "guarantee", "no risk", "afford"]) expect(all.toLowerCase()).not.toContain(w);
    expect(req.user + req.system).not.toContain("Austin ISD");
  });
  it("T25 Plaid insufficient_data explains and offers the document path", async () => {
    explainSpy.mockClear();
    const r = await (await post("/income/plaid", { demoOutcome: "insufficient_data" })).json() as { status: string; statusLine: string };
    expect(r.status).toBe("insufficient");
    expect(r.statusLine.endsWith("Nothing was submitted and no decision was made.")).toBe(true);
    const req = explainSpy.mock.calls[0]![0];
    expect(req.auditInput.event).toBe("insufficient_data");
    expect(req.safeTemplate).toBe(EXPLAIN_TEMPLATE_INSUFFICIENT);
    expect(/\d|\$|%/.test(req.user + req.system + req.safeTemplate)).toBe(false);
  });
  it("T26 document path: $68,900.00 computed by code, needs_review, source document", async () => {
    const r = await (await post("/income/document", {})).json() as { status: string; fields: PrefillField[] };
    expect(r.status).toBe("document_review");
    const f = byKey(r.fields, "income.grossAnnualIncome");
    expect(f).toMatchObject({ value: 68900, status: "needs_review", source: "document" });
    expect(f.note).toContain("computed by code");
    expect(f.note).toContain("× 26");
  });
  it("T27 submit rejects missing consents", async () => {
    const res = await post("/submit", submitBody(ready(), { ...consents, creditCheck: false }));
    expect(res.status).toBe(400);
    expect((await res.json() as { error: { code: string } }).error.code).toBe("consent_required");
  });
  it("T28 submit rejects needs_input fields without echoing them", async () => {
    const res = await post("/submit", submitBody([{ key: "you.fullName", label: "Full name", group: "you", value: "LEAK-CHECK", source: null, status: "needs_input" }]));
    expect(res.status).toBe(400);
    const t = await res.text();
    expect(JSON.parse(t).error.code).toBe("fields_incomplete");
    expect(t).not.toContain("LEAK-CHECK");
  });
  it("T29 submit returns pending for Plaid income and conditional for document income; blocks unverified income", async () => {
    const p = await (await post("/submit", submitBody(ready()))).json() as { decision: string; referenceId: string; source: string };
    expect(p).toMatchObject({ decision: "pending", referenceId: "CD-DEMO-0001", source: "credit_engine_mock" });
    const docFields = ready().map((f) => (f.group === "income" ? { ...f, source: "document" as const, status: "needs_review" as const } : f));
    const d = await (await post("/submit", submitBody(docFields))).json() as { decision: string; nextSteps: string[] };
    expect(d.decision).toBe("conditional");
    expect(d.nextSteps).toHaveLength(2);
    const unverified = ready().map((f) => (f.group === "income" ? { ...f, status: "needs_authorization" as const } : f));
    const res = await post("/submit", submitBody(unverified));
    expect(res.status).toBe(400);
    expect((await res.json() as { error: { code: string } }).error.code).toBe("income_not_verified");
  });
  it("T35 submit with no fields and all consents is application_incomplete", async () => {
    const res = await post("/submit", submitBody([]));
    expect(res.status).toBe(400);
    expect((await res.json() as { error: { code: string } }).error.code).toBe("application_incomplete");
  });
  it("T30 the credit engine never returns approved", async () => {
    const engine = new CreditEngineMock();
    for (const source of ["plaid", "document"] as const) {
      for (const status of ["ready", "needs_review"] as const) {
        const d = await engine.decide([{ key: "income.grossAnnualIncome", label: "x", group: "income", value: 1, source, status }]);
        expect(["pending", "conditional"]).toContain(d.decision);
      }
    }
  });
  it("T31 submit logs no identity values", async () => {
    const spies = (["info", "log", "warn", "error"] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => undefined));
    try {
      const res = await post("/submit", submitBody(ready()));
      expect(res.status).toBe(200);
      const logged = JSON.stringify(spies.flatMap((s) => s.mock.calls));
      expect(logged).not.toContain("Zed Testperson");
      expect(logged).not.toContain("9876");
    } finally {
      spies.forEach((s) => s.mockRestore());
    }
  });
});
