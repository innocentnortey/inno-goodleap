import * as z from "zod/v4";

export const PrepareBody = z.object({
  estimateId: z.string().max(64).optional(),
  estimateText: z.string().min(1).max(20000).optional(),
  contractorId: z.string().max(32),
  productId: z.string().max(32),
  amount: z.number().finite().positive().max(1_000_000),
  priority: z.enum(["lower_monthly", "lower_total"]),
}).refine((b) => b.estimateId !== undefined || b.estimateText !== undefined);

export const PlaidBody = z.object({ demoOutcome: z.enum(["success", "connection_failed", "insufficient_data"]) });

const FieldBody = z.object({
  key: z.string().max(64), label: z.string().max(80),
  group: z.enum(["project", "financing", "contractor", "you", "income"]),
  value: z.union([z.string().max(500), z.number(), z.null()]),
  source: z.enum(["estimate", "profile", "conversation", "homeowner", "plaid", "document"]).nullable(),
  sourceQuote: z.string().max(500).optional(),
  confidence: z.number().optional(),
  status: z.enum(["ready", "needs_input", "needs_authorization", "needs_review"]),
  note: z.string().max(300).optional(),
});

export const SubmitBody = z.object({
  productId: z.string().max(32),
  amount: z.number().finite().positive(),
  fields: z.array(FieldBody).max(40),
  consents: z.object({ disclosuresRead: z.boolean(), creditCheck: z.boolean(), accurate: z.boolean() }),
});
