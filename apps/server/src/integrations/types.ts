// Interfaces for the four mocked external systems (architecture §3). One adapter per system.
import type { CreditDecision, PlaidDemoOutcome, PrefillField } from "@goodleap/shared";

export interface ContractorProfile { id: string; businessName: string; trade: string; city: string; state: string; licenseNo: string; partnerSince: string; contact: { name: string; phone: string } }
export interface ContractorProfileClient { get(contractorId: string): Promise<ContractorProfile | null> }
export interface PlaidIncomeSource { employer: string; payFrequency: string; grossPerPeriod: number; annualizedGross: number; months: number }
export type PlaidOutcomeRecord =
  | { status: "verified"; institution: string; incomeSources: PlaidIncomeSource[] }
  | { status: "failed"; errorCode: string; institution: string; userMessage: string }
  | { status: "insufficient"; institution: string; reason: string; months: number };
export interface PlaidClient { connect(outcome: PlaidDemoOutcome): Promise<PlaidOutcomeRecord> }
export interface DocumentIncomeRecord { document: string; extracted: { employer: string; payPeriodStart: string; payPeriodEnd: string; payFrequency: string; grossPay: number; ytdGross: number }; confidence: number; fraudRisk: string }
export interface DocumentIncomeClient { read(): Promise<DocumentIncomeRecord> }
export interface CreditEngineClient { decide(fields: PrefillField[]): Promise<CreditDecision> }
