import { readSynthetic } from "../data.ts";
import type { DocumentIncomeClient, DocumentIncomeRecord } from "./types.ts";

export class DocumentIncomeMock implements DocumentIncomeClient {
  async read(): Promise<DocumentIncomeRecord> {
    const { document, extracted, confidence, fraudRisk } = readSynthetic<DocumentIncomeRecord>("paystub.json");
    return { document, extracted, confidence, fraudRisk };
  }
}
