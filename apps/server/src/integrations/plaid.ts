import type { PlaidDemoOutcome } from "@goodleap/shared";
import { readSynthetic } from "../data.ts";
import type { PlaidClient, PlaidOutcomeRecord } from "./types.ts";

export class PlaidMock implements PlaidClient {
  async connect(outcome: PlaidDemoOutcome): Promise<PlaidOutcomeRecord> {
    return readSynthetic<{ outcomes: Record<PlaidDemoOutcome, PlaidOutcomeRecord> }>("plaid.json").outcomes[outcome];
  }
}
