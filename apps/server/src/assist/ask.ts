import { formatUsd0 } from "@goodleap/shared";
import type { AskRequest, GuardedAnswer, GuardedRequest, Product, Scenario } from "@goodleap/shared";
import { findProduct, loadCatalog } from "../data.ts";
import { FinanceError, scenarioFor } from "../finance/index.ts";
import { guardedGenerate } from "../guardrails/index.ts";
import { ASK_SAFE_TEMPLATE, redactQuestion } from "../guardrails/policy.ts";
import type { LlmClient } from "../llm/client.ts";
import { allowedNumbersFor, scenarioFigures } from "./figures.ts";
import { buildUserMessage, PROMPT_VERSION, SYSTEM_PROMPT } from "./prompt.ts";

export class AskError extends Error {
  constructor(public code: "unknown_product" | "amount_out_of_range" | "quote_unavailable", public status: 400 | 404 | 503, message: string) {
    super(message);
  }
}

export function buildAskRequest(product: Product, scenario: Scenario, question: string, catalogVersion: string): GuardedRequest {
  const figures = scenarioFigures(scenario, product);
  question = redactQuestion(question);
  return {
    purpose: "ask",
    screen: "SCR-2",
    system: SYSTEM_PROMPT,
    user: buildUserMessage(product, figures, scenario.amount, question),
    promptVersion: PROMPT_VERSION,
    allowedNumbers: allowedNumbersFor(scenario, figures),
    disclosures: scenario.disclosures,
    safeTemplate: ASK_SAFE_TEMPLATE,
    productId: product.id,
    catalogVersion,
    auditInput: { question },
  };
}

export async function ask(req: AskRequest, llm?: LlmClient): Promise<GuardedAnswer> {
  const product = findProduct(req.productId);
  if (!product) throw new AskError("unknown_product", 404, "No such product in the catalog.");
  const catalog = loadCatalog();
  const { min, max } = catalog.amountRange;
  const rangeMsg = `The amount must be between ${formatUsd0(min)} and ${formatUsd0(max)}.`;
  if (req.amount < min || req.amount > max) throw new AskError("amount_out_of_range", 400, rangeMsg);
  let scenario: Scenario;
  try {
    scenario = scenarioFor(req.amount, product);
  } catch (e) {
    if (e instanceof FinanceError) throw new AskError("amount_out_of_range", 400, rangeMsg);
    console.error("[ask] scenario unavailable");
    throw new AskError("quote_unavailable", 503, "Loan figures aren't available yet. Try again shortly.");
  }
  return guardedGenerate(buildAskRequest(product, scenario, req.question, catalog.catalogVersion), llm);
}
