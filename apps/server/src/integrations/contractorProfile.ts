import { readSynthetic } from "../data.ts";
import type { ContractorProfile, ContractorProfileClient } from "./types.ts";

export class ContractorProfileMock implements ContractorProfileClient {
  private list: ContractorProfile[] | null = null;
  async get(contractorId: string): Promise<ContractorProfile | null> {
    this.list ??= readSynthetic<{ contractors: ContractorProfile[] }>("contractors.json").contractors;
    return this.list.find((c) => c.id === contractorId) ?? null;
  }
}
