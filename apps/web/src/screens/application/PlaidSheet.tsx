// Synthetic Plaid Link sheet (native <dialog>). No real bank is contacted.
import { useEffect, useRef } from "react";
import type { PlaidDemoOutcome } from "@goodleap/shared";
import { Button } from "../../components/ui";

export function PlaidSheet({ open, onPick, onClose }: { open: boolean; onPick: (o: PlaidDemoOutcome) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="plaid-title"
      className="m-auto w-[min(92vw,420px)] rounded-2xl border border-line bg-surface p-5 text-text backdrop:bg-black/40">
      <h2 id="plaid-title" className="m-0 text-[16px] font-extrabold">Demo bank connection</h2>
      <p className="mt-1 text-[13px] text-muted">Synthetic Plaid Link for the demo. No real bank is contacted.</p>
      <p className="my-3 rounded-xl bg-raised px-3 py-2 text-[14px] font-bold">Demo Credit Union</p>
      <div className="flex flex-col gap-2">
        <Button variant="primary" onClick={() => onPick("success")}>Connect bank (succeeds)</Button>
        <Button onClick={() => onPick("connection_failed")}>Connect bank (fails)</Button>
        <Button onClick={() => onPick("insufficient_data")}>Not enough history</Button>
        <Button variant="quiet" onClick={onClose}>Cancel</Button>
      </div>
    </dialog>
  );
}
