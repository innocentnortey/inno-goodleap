// The agent's four tools. The model advises which to call; code validates scope and executes (agent-tools rule 4).
import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";
import { formatUsd } from "@goodleap/shared";
import type { Priority, Scenario } from "@goodleap/shared";
import { findProduct } from "../data.ts";
import type { ContractorProfileClient } from "../integrations/index.ts";
import type { LlmClient } from "../llm/client.ts";
import { buildFields } from "./fields.ts";
import type { ToolResults } from "./fields.ts";
import { extractEstimate } from "./extract.ts";

export const ProfileInput = z.object({ contractorId: z.string() });
export const ScenarioInput = z.object({ productId: z.string(), amount: z.number() });
export const EmptyInput = z.object({});
export const TOOL_NAMES = ["get_contractor_profile", "get_selected_scenario", "extract_estimate", "list_missing_fields"] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

const schemaOf = (s: z.ZodType) => zodOutputFormat(s).schema as Anthropic.Tool.InputSchema;

export const AGENT_TOOLS: Anthropic.Tool[] = [
  { name: "get_contractor_profile", strict: true, input_schema: schemaOf(ProfileInput),
    description: "Returns the contractor's business name, license number, trade and city for the contractorId given in the request. Use it once, to fill the contractor fields. It does not return anything about the homeowner; for the loan option use get_selected_scenario." },
  { name: "get_selected_scenario", strict: true, input_schema: schemaOf(ScenarioInput),
    description: "Returns the loan option the homeowner chose on the Compare screen (product name, APR, term, estimated monthly payment) for the productId and amount given in the request. Use it once. It does not read the estimate; for estimate figures use extract_estimate." },
  { name: "extract_estimate", strict: true, input_schema: schemaOf(EmptyInput),
    description: "Reads the contractor's estimate attached to this request and returns the project type, scope, total, down payment and the amount to finance, each with a status. Takes no arguments: the estimate is already attached. Use it once. For what is still missing afterwards, use list_missing_fields." },
  { name: "list_missing_fields", strict: true, input_schema: schemaOf(EmptyInput),
    description: "Returns every application field that is not ready yet, with its status (needs input, needs review, needs the homeowner) and why. Takes no arguments. Call it last, after the other three tools, then end your turn." },
];

export interface ToolError { code: "unknown_tool" | "invalid_arguments" | "scope_mismatch" | "scenario_unavailable" | "extraction_failed" | "profile_not_found" | "tool_failed"; message: string; retryable: boolean }
export interface PrepContext { contractorId: string; productId: string; amount: number; priority: Priority; estimateText: string }
export interface ToolDeps { llm: LlmClient; profiles: ContractorProfileClient; scenario: (amount: number, productId: string) => Scenario }
export type ToolOutcome =
  | { ok: true; content: unknown; summary: string; tokens: number }
  | { ok: false; error: ToolError; summary: string; tokens: number };

const fail = (error: ToolError, summary: string, tokens = 0): ToolOutcome => ({ ok: false, error, summary, tokens });
const isToolName = (n: string): n is ToolName => (TOOL_NAMES as readonly string[]).includes(n);

export async function executeTool(name: string, input: unknown, ctx: PrepContext, r: ToolResults, deps: ToolDeps): Promise<ToolOutcome> {
  if (!isToolName(name)) {
    return fail({ code: "unknown_tool", message: "No such tool. Use get_contractor_profile, get_selected_scenario, extract_estimate or list_missing_fields.", retryable: false }, "Rejected: unknown tool");
  }
  const schema = name === "get_contractor_profile" ? ProfileInput : name === "get_selected_scenario" ? ScenarioInput : EmptyInput;
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail({ code: "invalid_arguments", message: "The arguments don't match the tool's schema.", retryable: false }, "Rejected: invalid arguments");
  const args = parsed.data as Record<string, unknown>;
  const scopeOk = name === "get_contractor_profile" ? args.contractorId === ctx.contractorId
    : name === "get_selected_scenario" ? args.productId === ctx.productId && args.amount === ctx.amount : true;
  if (!scopeOk) {
    return fail({ code: "scope_mismatch", message: "Use the ids given in the request; other applications are out of scope.", retryable: false }, "Rejected: id outside this application");
  }
  try {
    switch (name) {
      case "get_contractor_profile": {
        const p = await deps.profiles.get(ctx.contractorId);
        r.profile = p;
        if (!p) return fail({ code: "profile_not_found", message: "No profile for this contractor.", retryable: false }, "Contractor profile not found");
        return { ok: true, content: { businessName: p.businessName, licenseNo: p.licenseNo, trade: p.trade, city: p.city, state: p.state }, summary: `Found ${p.businessName} (${p.licenseNo})`, tokens: 0 };
      }
      case "get_selected_scenario": {
        try {
          const s = deps.scenario(ctx.amount, ctx.productId);
          const sum = { productId: ctx.productId, productName: s.productName, amount: ctx.amount, aprPct: s.aprPct, termMonths: s.termMonths, monthlyPayment: s.monthlyPayment };
          r.scenario = sum;
          return { ok: true, content: sum, summary: `${s.productName} at ${formatUsd(s.amount)}`, tokens: 0 };
        } catch {
          r.scenario = null;
          return fail({ code: "scenario_unavailable", message: "The payment scenario isn't available right now; continue without it.", retryable: false }, "Scenario not available");
        }
      }
      case "extract_estimate": {
        const out = await extractEstimate(ctx.estimateText, deps.llm, ctx.amount);
        if (!out.ok) {
          r.estimate = null;
          return fail({ code: "extraction_failed", message: "The estimate couldn't be read.", retryable: false }, "Couldn't read the estimate", out.tokens);
        }
        r.estimate = out.fields;
        const k = out.fields.filter((f) => f.status !== "ready").length;
        return {
          ok: true, tokens: out.tokens, summary: `Read the estimate: ${out.fields.length} fields, ${k} need attention`,
          content: { fields: out.fields.map((f) => ({ key: f.key, label: f.label, value: f.value, status: f.status, note: f.note })) },
        };
      }
      case "list_missing_fields": {
        r.missingListed = true;
        const fields = buildFields(ctx, r, findProduct(ctx.productId)?.name ?? ctx.productId);
        const missing = fields.filter((f) => f.status !== "ready");
        const a = missing.filter((f) => f.status === "needs_input" || f.status === "needs_authorization").filter((f) => f.group === "you" || f.group === "income").length;
        return {
          ok: true, tokens: 0, summary: `${missing.length} fields not ready (${a} wait for the homeowner)`,
          content: { missing: missing.map((f) => ({ key: f.key, label: f.label, status: f.status, note: f.note })) },
        };
      }
    }
  } catch {
    console.warn("[agent] tool error", name);
    return fail({ code: name === "extract_estimate" ? "extraction_failed" : name === "get_contractor_profile" ? "profile_not_found" : "tool_failed", message: "The tool failed.", retryable: false }, "The tool failed");
  }
}
