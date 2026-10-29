// The guarded generator: code redirect → model → checks → one regeneration → safe template. One audit record per call.
import { randomUUID } from "node:crypto";
import type { AnswerOutcome, GuardedAnswer, GuardedRequest, GuardrailCheck } from "@goodleap/shared";
import { getAuditStore } from "../audit/store.ts";
import { getLlm, MODEL, textOf } from "../llm/client.ts";
import type { LlmClient } from "../llm/client.ts";
import { runChecks } from "./checks.ts";
import { classifyRedirect, OFF_TOPIC_REDIRECT, POLICY, REDIRECT_TEMPLATES } from "./policy.ts";

export const ANSWER_MAX_TOKENS = 400;

export function regenerationNote(reason: string): string {
  return `A previous draft was rejected by an automatic compliance check: ${reason}. Write a new answer that follows every rule and uses only the listed figures.`;
}

export async function guardedGenerate(req: GuardedRequest, llm?: LlmClient): Promise<GuardedAnswer> {
  const t0 = performance.now();
  const rawOutput: string[] = [];
  const checks: GuardrailCheck[][] = [];
  let calls = 0;

  const finish = (outcome: AnswerOutcome, text: string, finalChecks: GuardrailCheck[], model: string): GuardedAnswer => {
    const q = req.auditInput.question;
    const e = req.auditInput.event;
    const record = {
      id: randomUUID(),
      time: new Date().toISOString(),
      screen: req.screen,
      purpose: req.purpose,
      productId: req.productId ?? null,
      catalogVersion: req.catalogVersion ?? null,
      promptVersion: req.promptVersion,
      model,
      inputs: {
        ...(q !== undefined && { question: q }),
        ...(e !== undefined && { event: e }),
        allowedNumbers: req.allowedNumbers,
        disclosures: req.disclosures,
      },
      rawOutput,
      checks,
      attempts: calls,
      finalText: text,
      outcome,
      latencyMs: Math.round(performance.now() - t0),
    };
    getAuditStore().append(record); // fail closed: nothing is shown that was not logged
    return { text, outcome, disclosures: req.disclosures, checks: finalChecks, attempts: calls, auditId: record.id, latencyMs: record.latencyMs };
  };
  const safe = (model: string) =>
    finish("safe_template", req.safeTemplate, runChecks(req.safeTemplate, POLICY, req.allowedNumbers, req.disclosures), model);

  const question = req.auditInput.question;
  if (req.purpose === "ask" && question) {
    const kind = classifyRedirect(question);
    if (kind) return finish("redirected", REDIRECT_TEMPLATES[kind], [], llm?.model ?? MODEL);
  }

  let client: LlmClient;
  try {
    client = llm ?? getLlm();
  } catch {
    rawOutput.push("[model unavailable]");
    return safe(MODEL);
  }

  let reason: string | null = null;
  for (let attempt = 1; attempt <= POLICY.maxAttempts; attempt++) {
    const content = reason ? `${req.user}\n\n${regenerationNote(reason)}` : req.user;
    calls = attempt;
    let msg;
    try {
      msg = await client.create({
        system: req.system,
        max_tokens: ANSWER_MAX_TOKENS,
        output_config: { effort: "low" },
        messages: [{ role: "user", content }],
      });
    } catch {
      console.error("[guardrails] model call failed");
      rawOutput.push("[model call failed]");
      checks.push([]);
      break;
    }
    if (msg.stop_reason === "refusal") {
      rawOutput.push("[model refused: stop_reason refusal]");
      checks.push([]);
      reason = "the previous attempt was declined";
      continue;
    }
    const text = textOf(msg);
    rawOutput.push(text);
    if (text === "") {
      checks.push([]);
      reason = "the previous attempt was empty";
      continue;
    }
    if (msg.stop_reason === "max_tokens") {
      checks.push([]);
      reason = "answer was cut off";
      continue;
    }
    if (req.purpose === "ask" && /^OFF_TOPIC\.?$/i.test(text.trim())) {
      checks.push([]);
      return finish("redirected", OFF_TOPIC_REDIRECT, [], client.model);
    }
    const cs = runChecks(text, POLICY, req.allowedNumbers, req.disclosures);
    checks.push(cs);
    if (cs.every((c) => c.passed)) return finish(attempt === 1 ? "shown" : "regenerated", text, cs, client.model);
    reason = cs.filter((c) => !c.passed).map((c) => c.detail).join("; ");
  }
  return safe(client.model);
}
