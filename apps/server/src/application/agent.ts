// The bounded tool loop (R-8): the model picks the order of four tools; code decides when it is done and enforces four brakes.
import type Anthropic from "@anthropic-ai/sdk";
import type { AgentStep } from "@goodleap/shared";
import { textOf } from "../llm/client.ts";
import type { ToolResults } from "./fields.ts";
import { AGENT_TOOLS, TOOL_NAMES, executeTool } from "./tools.ts";
import type { PrepContext, ToolDeps } from "./tools.ts";

export interface AgentBrakes { maxSteps: number; wallClockMs: number; tokenBudget: number; identicalCallLimit: number }
export const DEFAULT_BRAKES: AgentBrakes = { maxSteps: 6, wallClockMs: 45_000, tokenBudget: 40_000, identicalCallLimit: 3 };
export type AgentStop = "completed" | "ended_early" | "refusal" | "max_steps" | "wall_clock" | "token_budget" | "identical_calls";
export interface AgentDeps extends ToolDeps { now?: () => number }
export interface AgentRun { steps: AgentStep[]; results: ToolResults; stop: AgentStop; finalText: string; tokens: number }
export const AGENT_PROMPT_VERSION = "prep-agent-v1";

export const AGENT_SYSTEM =
  "You prepare a draft home-improvement loan application for a contractor. Use the four tools: get_contractor_profile, get_selected_scenario and extract_estimate (you may call these three together in one turn), then list_missing_fields last. Call each tool once; do not repeat a call that succeeded or one that returned an error. You never see or ask for the homeowner's identity or income. When list_missing_fields has returned, end your turn with one short sentence saying what is ready and what is missing. Never comment on credit or on what the lender will decide; the lender's credit review decides.";

const TIMEOUT = Symbol("timeout");
async function raceDeadline<T>(p: Promise<T>, ms: number): Promise<T | typeof TIMEOUT> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const t = new Promise<typeof TIMEOUT>((res) => { timer = setTimeout(() => res(TIMEOUT), Math.max(ms, 0)); });
  try { return await Promise.race([p, t]); } finally { clearTimeout(timer); }
}

function stableJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableJson).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${stableJson(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v) ?? "null";
}

export async function runAgent(ctx: PrepContext, deps: AgentDeps, brakes: AgentBrakes = DEFAULT_BRAKES): Promise<AgentRun> {
  const now = deps.now ?? (() => Date.now());
  const deadline = now() + brakes.wallClockMs;
  const steps: AgentStep[] = [];
  const seen = new Map<string, number>();
  const r: ToolResults = { missingListed: false };
  let tokens = 0;
  let finalText = "";
  const messages: Anthropic.MessageParam[] = [{
    role: "user",
    content: `Prepare the application. contractorId: ${ctx.contractorId}. productId: ${ctx.productId}. amount: ${ctx.amount}. priority: ${ctx.priority}.`,
  }];

  const done = (stop: AgentStop): AgentRun => {
    console.info(`[agent] stop=${stop} steps=${steps.length} tokens=${tokens}`);
    return { steps, results: r, stop, finalText, tokens };
  };

  for (;;) {
    if (now() >= deadline) return done("wall_clock");
    if (tokens >= brakes.tokenBudget) return done("token_budget");
    const res = await raceDeadline(
      deps.llm.create({ max_tokens: 1024, system: AGENT_SYSTEM, tools: AGENT_TOOLS, tool_choice: { type: "auto" }, output_config: { effort: "low" }, messages }),
      deadline - now(),
    );
    if (res === TIMEOUT) return done("wall_clock");
    const msg = res;
    tokens += msg.usage.input_tokens + msg.usage.output_tokens;
    if (msg.stop_reason === "refusal") return done("refusal");
    const uses = msg.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (uses.length === 0) {
      finalText = textOf(msg);
      return done(r.estimate !== undefined && r.missingListed ? "completed" : "ended_early");
    }
    messages.push({
      role: "assistant",
      content: msg.content.flatMap((b): Anthropic.ContentBlockParam[] =>
        b.type === "text" ? [{ type: "text", text: b.text }] : b.type === "tool_use" ? [{ type: "tool_use", id: b.id, name: b.name, input: b.input }] : []),
    });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const use of uses) {
      if (steps.length >= brakes.maxSteps) return done("max_steps");
      if (now() >= deadline) return done("wall_clock");
      const sig = `${use.name}:${stableJson(use.input)}`;
      const count = (seen.get(sig) ?? 0) + 1;
      seen.set(sig, count);
      if (count >= brakes.identicalCallLimit) return done("identical_calls");
      const t0 = now();
      const raced = await raceDeadline(executeTool(use.name, use.input, ctx, r, deps), deadline - now());
      if (raced === TIMEOUT) return done("wall_clock");
      const out = raced;
      tokens += out.tokens;
      steps.push({ n: steps.length + 1, tool: (TOOL_NAMES as readonly string[]).includes(use.name) ? use.name : "unknown_tool", summary: out.summary, ms: Math.round(now() - t0) });
      results.push({ type: "tool_result", tool_use_id: use.id, content: JSON.stringify(out.ok ? out.content : out.error), ...(out.ok ? {} : { is_error: true }) });
    }
    messages.push({ role: "user", content: results });
    // Code assembles the result from the tool outputs, so once the estimate is read and the missing list has run, a closing model turn adds only latency.
    if (r.estimate !== undefined && r.missingListed) return done("completed");
  }
}
