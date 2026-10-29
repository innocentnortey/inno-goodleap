import { formatUsd } from "@goodleap/shared";
import { Button, Notice } from "../../components/ui";
import { go } from "../../router";

export function MismatchNotice({ financed, compared }: { financed: number; compared: number }) {
  return (
    <Notice tone="check">
      The amount to finance ({formatUsd(financed)}) differs from the {formatUsd(compared)} you compared. Go back to Compare to update the estimate, or check the estimate.{" "}
      <Button variant="link" size="sm" onClick={() => go("compare")}>Go to Compare</Button>
    </Notice>
  );
}
