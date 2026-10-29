// SCR-6: the compliance audit. Reads GET /api/audit (newest first); nothing is recomputed here.
import { useCallback, useEffect, useState } from "react";
import type { AuditRecord } from "@goodleap/shared";
import { api, ApiFailure } from "../lib/api";
import { Button, Notice, PageLayout, Skeleton } from "../components/ui";
import { AuditDetail } from "./audit/AuditDetail";
import { AuditTable } from "./audit/AuditTable";
import { OutcomeCounts } from "./audit/OutcomeCounts";

function idFromHash(): string | null {
  return new URLSearchParams(window.location.hash.split("?")[1] ?? "").get("id");
}

export default function Audit() {
  const [records, setRecords] = useState<AuditRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(idFromHash());

  const load = useCallback(async () => {
    setError(null);
    try {
      setRecords(await api.get<AuditRecord[]>("/audit"));
    } catch (e) {
      setError(e instanceof ApiFailure ? e.message : "The audit log could not be loaded.");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const selected = records?.find((r) => r.id === selectedId) ?? records?.[0] ?? null;

  return (
    <PageLayout
      title="Compliance audit"
      sub="Every borrower-facing message: what the model wrote, what the checks found, what was shown."
      aside={<Button size="sm" onClick={() => void load()}>Refresh</Button>}
    >
      <p className="m-0 text-[12.5px] text-muted">The app never sends income or identity fields to the model or to this log. A homeowner’s own question is logged as typed, with SSN-shaped numbers, emails and phone numbers masked.</p>
      {error && <Notice tone="danger">{error}</Notice>}
      {!records && !error && <div className="flex flex-col gap-2"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>}
      {records && records.length === 0 && (
        <Notice tone="info">
          No messages yet. Each answer from <strong>Ask about this option</strong> and each income explanation appears here, with the model&apos;s raw output, every check and the text that was shown.{" "}
          <a href="#/compare" className="font-bold underline underline-offset-2">Go to Compare options</a>
        </Notice>
      )}
      {records && records.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="flex min-w-0 flex-col gap-4">
            <AuditTable records={records} selectedId={selected?.id ?? null} onSelect={setSelectedId} />
            {selected && <AuditDetail record={selected} />}
          </div>
          <OutcomeCounts records={records} />
        </div>
      )}
    </PageLayout>
  );
}
