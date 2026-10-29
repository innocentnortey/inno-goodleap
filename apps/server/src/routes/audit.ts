// GET /api/audit (SCR-6): every borrower-facing message, newest first. Mounted under /api by src/index.ts.
import { Hono } from "hono";
import type { AuditRecord } from "@goodleap/shared";
import { getAuditStore } from "../audit/store.ts";

export const auditRoutes = new Hono();

auditRoutes.get("/audit", (c) => c.json<AuditRecord[]>(getAuditStore().list()));
