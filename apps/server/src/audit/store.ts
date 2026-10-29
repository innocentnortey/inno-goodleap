// Append-only audit log. Records hold only AuditRecord keys built from a GuardedRequest, which carries no income or
// identity fields, and segment C passes none, so none can reach this file.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { AuditRecord } from "@goodleap/shared";
import { REPO_ROOT } from "../data.ts";

export interface AuditStore { append(record: AuditRecord): void; /** Newest first. */ list(): AuditRecord[] }

export const DEFAULT_AUDIT_PATH = resolve(REPO_ROOT, "var/audit.jsonl");

export class JsonlAuditStore implements AuditStore {
  constructor(readonly path: string) {}
  append(r: AuditRecord): void {
    mkdirSync(dirname(this.path), { recursive: true });
    appendFileSync(this.path, JSON.stringify(r) + "\n", "utf8");
  }
  list(): AuditRecord[] {
    if (!existsSync(this.path)) return [];
    const out: AuditRecord[] = [];
    for (const line of readFileSync(this.path, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try { out.push(JSON.parse(line) as AuditRecord); } catch { /* skip a malformed line */ }
    }
    return out.reverse();
  }
}

export class MemoryAuditStore implements AuditStore {
  records: AuditRecord[] = [];
  append(r: AuditRecord): void { this.records.push(r); }
  list(): AuditRecord[] { return [...this.records].reverse(); }
}

let current: AuditStore | null = null;
export function getAuditStore(): AuditStore {
  current ??= new JsonlAuditStore(process.env.AUDIT_PATH || DEFAULT_AUDIT_PATH);
  return current;
}
/** Tests swap in a MemoryAuditStore or a temp-path store. */
export function setAuditStore(store: AuditStore | null): void { current = store; }
