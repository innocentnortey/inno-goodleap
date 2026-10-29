import { describe, expect, it } from "vitest";
import { ESTIMATE_LINE, type Scenario } from "@goodleap/shared";
import { loadCatalog } from "../src/data.ts";
import { FinanceError, quote, scenarioFor } from "../src/finance/index.ts";
import { quoteRoutes } from "../src/routes/quote.ts";

const cat = loadCatalog();
const byId = (list: Scenario[], id: string) => list.find((s) => s.productId === id)!;
const post = (body: unknown) =>
  quoteRoutes.request("/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const codeOf = (fn: () => unknown) => {
  try { fn(); } catch (e) { return e instanceof FinanceError ? { code: e.code, message: e.message } : null; }
  return null;
};

describe("WP-1 quote maths at $30,000", () => {
  const list = quote(30000, "lower_monthly", cat);
  it("WP-1 fixed products at $30,000", () => {
    const rows: [string, number, number, number, number][] = [
      ["GL-FIX-05", 593.89, 35633.67, 5633.67, 60],
      ["GL-FIX-10", 355.95, 42713.85, 12713.85, 120],
      ["GL-FIX-15", 286.7, 51605.21, 21605.21, 180],
      ["GL-FIX-25", 261.9, 78570.15, 48570.15, 300],
    ];
    for (const [id, pay, paid, interest, term] of rows) {
      const s = byId(list, id);
      expect(s.monthlyPayment).toBe(pay);
      expect(s.totalPaid).toBe(paid);
      expect(s.totalInterest).toBe(interest);
      expect(s.phases).toHaveLength(1);
      expect(s.phases[0].months).toBe(term);
    }
  });
  it("WP-1 GL-INTRO-0 phases and totals", () => {
    const s = byId(list, "GL-INTRO-0");
    expect(s.phases).toMatchObject([{ months: 12, payment: 250 }, { months: 108, payment: 379.98 }]);
    expect(s.monthlyPayment).toBe(250);
    expect(s.totalPaid).toBe(44037.66);
    expect(s.totalInterest).toBe(14037.66);
    expect(s.note).toBe("Payment rises after month 12");
    expect(s.aprPct).toBe(9.99);
    expect(s.termMonths).toBe(120);
  });
  it("WP-1 GL-DEF-18 payoff and retroactive interest", () => {
    const s = byId(list, "GL-DEF-18");
    expect(s.monthlyPayment).toBe(1666.67);
    expect(s.phases[0]).toMatchObject({ months: 18, payment: 1666.67 });
    expect(s.totalPaid).toBe(30000);
    expect(s.totalInterest).toBe(0);
    expect(s.promo).toMatchObject({ months: 18, payoffMonthly: 1666.67, retroactiveInterest: 11245.5 });
    expect(s.promo!.condition).toContain("$11,245.50");
    expect(s.note).toBe("Only cheaper if paid off within 18 months");
    expect(s.aprPct).toBe(24.99);
    expect(s.termMonths).toBe(84);
  });
  it("returns all six catalog products", () => {
    expect(list).toHaveLength(6);
    expect(new Set(list.map((s) => s.productId))).toEqual(new Set(cat.products.map((p) => p.id)));
  });
});

describe("ranking", () => {
  it("ranks lower_monthly by highest regular payment, deferred last", () => {
    const l = quote(30000, "lower_monthly", cat);
    expect(l.map((s) => s.productId)).toEqual(["GL-FIX-25", "GL-FIX-15", "GL-FIX-10", "GL-INTRO-0", "GL-FIX-05", "GL-DEF-18"]);
    expect(l.map((s) => s.rank)).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it("ranks lower_total by total paid, deferred last", () => {
    const l = quote(30000, "lower_total", cat);
    expect(l.map((s) => s.productId)).toEqual(["GL-FIX-05", "GL-FIX-10", "GL-INTRO-0", "GL-FIX-15", "GL-FIX-25", "GL-DEF-18"]);
  });
  it("adds relative notes", () => {
    const l = quote(30000, "lower_monthly", cat);
    expect(byId(l, "GL-FIX-25").note).toBe("Lowest monthly payment, highest total interest");
    expect(byId(l, "GL-FIX-05").note).toBe("Lowest total interest");
    expect(byId(l, "GL-FIX-10").note).toBeUndefined();
    expect(byId(l, "GL-FIX-15").note).toBeUndefined();
  });
});

describe("spot checks and validation", () => {
  it("WP-1 spot checks for GL-FIX-15 at $15,000 and $45,000", () => {
    expect(byId(quote(15000, "lower_monthly", cat), "GL-FIX-15").monthlyPayment).toBe(143.35);
    expect(byId(quote(45000, "lower_monthly", cat), "GL-FIX-15").monthlyPayment).toBe(430.04);
  });
  it("rejects $4,000 with amount_below_min", () => {
    expect(() => quote(4000, "lower_monthly", cat)).toThrow(FinanceError);
    const e = codeOf(() => quote(4000, "lower_monthly", cat))!;
    expect(e.code).toBe("amount_below_min");
    expect(e.message).toContain("below the $5,000 minimum");
    expect(e.message).not.toMatch(/4000|4,000/);
  });
  it("rejects $100,001 with amount_above_max", () => {
    expect(codeOf(() => quote(100001, "lower_monthly", cat))?.code).toBe("amount_above_max");
  });
  it("rejects NaN and fractions of a cent with invalid_amount", () => {
    expect(codeOf(() => quote(NaN, "lower_monthly", cat))?.code).toBe("invalid_amount");
    expect(codeOf(() => quote(30000.001, "lower_monthly", cat))?.code).toBe("invalid_amount");
  });
  it("scenarioFor returns an unranked scenario", () => {
    const s = scenarioFor(30000, cat.products.find((p) => p.id === "GL-FIX-15")!);
    expect(s.rank).toBe(0);
    expect(s.id).toBe("GL-FIX-15@30000");
    expect(s.monthlyPayment).toBe(286.7);
  });
});

describe("disclosures and allowed numbers", () => {
  const l = quote(30000, "lower_monthly", cat);
  it("disclosures carry ESTIMATE_LINE, APR, term, cost of credit, total paid", () => {
    expect(byId(l, "GL-FIX-15").disclosures).toEqual({
      estimateLine: ESTIMATE_LINE, aprPct: 8, termMonths: 180, totalCostOfCredit: 21605.21, totalPaid: 51605.21, lines: [],
    });
    for (const s of l) expect(s.disclosures.estimateLine).toBe(ESTIMATE_LINE);
    expect(byId(l, "GL-INTRO-0").disclosures.lines[0]).toContain("not deferred interest");
    const d = byId(l, "GL-DEF-18");
    expect(d.disclosures.lines[0]).toBe(d.promo!.condition);
  });
  it("allowedNumbers hold every number the model may say", () => {
    expect(byId(l, "GL-FIX-15").allowedNumbers).toEqual(expect.arrayContaining([30000, 286.7, 180, 51605.21, 21605.21, 8, 15]));
    expect(byId(l, "GL-INTRO-0").allowedNumbers).toEqual(expect.arrayContaining([250, 12, 379.98, 108, 120, 10, 9.99, 0, 13, 27000, 44037.66, 14037.66]));
    expect(byId(l, "GL-DEF-18").allowedNumbers).toEqual(expect.arrayContaining([30000, 1666.67, 18, 24.99, 84, 7, 11245.5, 0]));
    for (const s of l) {
      expect(s.allowedNumbers.every(Number.isFinite)).toBe(true);
      expect(new Set(s.allowedNumbers).size).toBe(s.allowedNumbers.length);
    }
  });
});

describe("POST /quote route", () => {
  it("returns a ranked QuoteResponse for $30,000", async () => {
    const res = await post({ amount: 30000, priority: "lower_monthly" });
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.catalogVersion).toBe("2026-10-29");
    expect(b.amount).toBe(30000);
    expect(b.priority).toBe("lower_monthly");
    expect(b.amountRange).toEqual({ min: 5000, max: 100000 });
    expect(b.scenarios).toHaveLength(6);
    expect(b.scenarios[1].productId).toBe("GL-FIX-15");
    expect(b.scenarios[1].monthlyPayment).toBe(286.7);
    expect(b.scenarios[1].totalPaid).toBe(51605.21);
    expect(b.scenarios[0].id).toBe("GL-FIX-25@30000");
  });
  it("returns 400 amount_below_min for $4,000", async () => {
    const res = await post({ amount: 4000, priority: "lower_monthly" });
    expect(res.status).toBe(400);
    const b = await res.json();
    expect(b.error.code).toBe("amount_below_min");
    expect(b.error.message).toContain("below the $5,000 minimum");
  });
  it("returns 400 invalid_amount for a string amount", async () => {
    const res = await post({ amount: "30000", priority: "lower_monthly" });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("invalid_amount");
  });
  it("returns 400 invalid_priority", async () => {
    const res = await post({ amount: 30000, priority: "cheapest" });
    expect(res.status).toBe(400);
    const b = await res.json();
    expect(b.error.code).toBe("invalid_priority");
    expect(b.error.message).not.toContain("cheapest");
  });
  it("returns 400 invalid_amount for malformed JSON", async () => {
    const res = await quoteRoutes.request("/quote", { method: "POST", headers: { "content-type": "application/json" }, body: "{" });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("invalid_amount");
  });
});
