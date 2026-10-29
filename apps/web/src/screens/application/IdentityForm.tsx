// The homeowner's identity fields (SCR-5). Values live in the parent's React state only; never in session storage.
import type { PrefillField } from "@goodleap/shared";
import { Field } from "../../components/ui";

export interface Identity { fullName: string; address: string; dateOfBirth: string; ssnLast4: string }
export const EMPTY_IDENTITY: Identity = { fullName: "", address: "", dateOfBirth: "", ssnLast4: "" };

export function identityFields(v: Identity): PrefillField[] {
  const mk = (key: string, label: string, value: string, valid: boolean): PrefillField => valid
    ? { key, label, group: "you", value, source: "homeowner", status: "ready" }
    : { key, label, group: "you", value: null, source: null, status: "needs_input", note: "Type this to submit." };
  return [
    mk("you.fullName", "Full name", v.fullName.trim(), v.fullName.trim() !== ""),
    mk("you.address", "Home address", v.address.trim(), v.address.trim() !== ""),
    mk("you.dateOfBirth", "Date of birth", v.dateOfBirth, /^\d{4}-\d{2}-\d{2}$/.test(v.dateOfBirth)),
    mk("you.ssnLast4", "SSN (last 4 digits)", v.ssnLast4, /^\d{4}$/.test(v.ssnLast4)),
  ];
}

export function IdentityForm({ values, onChange }: { values: Identity; onChange: (v: Identity) => void }) {
  const set = (k: keyof Identity) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...values, [k]: e.target.value });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div id="field-you.fullName"><Field id="id-fullName" label="Full name" autoComplete="off" value={values.fullName} onChange={set("fullName")} /></div>
      <div id="field-you.address"><Field id="id-address" label="Home address" autoComplete="off" value={values.address} onChange={set("address")} /></div>
      <div id="field-you.dateOfBirth"><Field id="id-dateOfBirth" label="Date of birth" type="date" autoComplete="off" value={values.dateOfBirth} onChange={set("dateOfBirth")} /></div>
      <div id="field-you.ssnLast4"><Field id="id-ssnLast4" label="SSN (last 4 digits)" inputMode="numeric" maxLength={4} autoComplete="off"
        hint="Only the last 4 digits; the lender's credit review uses it" value={values.ssnLast4} onChange={set("ssnLast4")} /></div>
    </div>
  );
}
