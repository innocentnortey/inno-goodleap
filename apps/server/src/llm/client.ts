// The only file that imports the Anthropic SDK (dependency inversion: assist/, guardrails/ and application/ take an
// LlmClient). Model: claude-sonnet-5-5 (PRD D-9). Sonnet 5.5 notes: no temperature, no forced tool_choice (use
// output_config.format or tool_choice auto + strict tools), and check stop_reason "refusal" before reading content.
// Tests use FakeLlm; nothing in test/ reaches the network.
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.LLM_MODEL || "claude-sonnet-5-5";

export type CreateParams = Omit<Anthropic.MessageCreateParamsNonStreaming, "model">;

export interface LlmClient {
  readonly model: string;
  /** One Messages API call with the configured model. */
  create(params: CreateParams): Promise<Anthropic.Message>;
}

/** Concatenated text blocks of a response ("" when there are none). */
export function textOf(msg: Anthropic.Message): string {
  return msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
}

export class AnthropicLlm implements LlmClient {
  readonly model = MODEL;
  private client: Anthropic;
  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add a key.");
    this.client = new Anthropic({ timeout: 30_000, maxRetries: 1 });
  }
  create(params: CreateParams): Promise<Anthropic.Message> {
    return this.client.messages.create({ ...params, model: this.model });
  }
}

let shared: LlmClient | null = null;
/** The process-wide client, created on first use so the server starts (and health passes) without a key. */
export function getLlm(): LlmClient {
  shared ??= new AnthropicLlm();
  return shared;
}

type Scripted = string | Anthropic.Message | ((params: CreateParams) => string | Anthropic.Message);

/** Test double: replays scripted replies in order and records every request it was given. */
export class FakeLlm implements LlmClient {
  readonly model = "fake-llm";
  readonly calls: CreateParams[] = [];
  constructor(private script: Scripted[]) {}
  async create(params: CreateParams): Promise<Anthropic.Message> {
    this.calls.push(params);
    const next = this.script[Math.min(this.calls.length - 1, this.script.length - 1)];
    if (next === undefined) throw new Error("FakeLlm: no scripted reply");
    const out = typeof next === "function" ? next(params) : next;
    return typeof out === "string" ? fakeMessage([{ type: "text", text: out, citations: null }]) : out;
  }
}

/** Builds a Message for tests (text or tool_use content). */
export function fakeMessage(content: Anthropic.ContentBlock[], stop: Anthropic.StopReason = "end_turn"): Anthropic.Message {
  return {
    id: "msg_fake", type: "message", role: "assistant", model: "fake-llm", content, stop_reason: stop, stop_sequence: null,
    usage: { input_tokens: 0, output_tokens: 0 },
  } as unknown as Anthropic.Message;
}
