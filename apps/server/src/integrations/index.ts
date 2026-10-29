import { ContractorProfileMock } from "./contractorProfile.ts";
import { CreditEngineMock } from "./creditEngine.ts";
import { DocumentIncomeMock } from "./documentIncome.ts";
import { PlaidMock } from "./plaid.ts";
import type { ContractorProfileClient, CreditEngineClient, DocumentIncomeClient, PlaidClient } from "./types.ts";

export * from "./types.ts";
export { ContractorProfileMock, CreditEngineMock, DocumentIncomeMock, PlaidMock };

export interface Integrations { profiles: ContractorProfileClient; plaid: PlaidClient; documents: DocumentIncomeClient; engine: CreditEngineClient }
export function mockIntegrations(): Integrations {
  return { profiles: new ContractorProfileMock(), plaid: new PlaidMock(), documents: new DocumentIncomeMock(), engine: new CreditEngineMock() };
}
