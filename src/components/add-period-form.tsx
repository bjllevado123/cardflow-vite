import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { addPeriod } from "@/lib/db";

const fieldClass =
  "mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 min-h-12 outline-none focus:border-primary";

export function AddPeriodButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 px-5 rounded-xl bg-primary text-on-primary font-semibold inline-flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
        New period
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="New billing period" description="Same idea as duplicating an Excel tab for the 15th or 30th.">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const date = String(fd.get("period_date") ?? "");
            if (!date) return;
            void addPeriod(date, String(fd.get("label") ?? "")).then(() => {
              toast.success("Period added");
              setOpen(false);
            });
          }}
        >
          <label className="block">
            <span className="text-[12px] font-bold tracking-[0.08em] uppercase text-on-surface-variant">Date</span>
            <input name="period_date" type="date" required className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-[12px] font-bold tracking-[0.08em] uppercase text-on-surface-variant">Label</span>
            <input name="label" placeholder="e.g. August 15, 2026" className={fieldClass} />
          </label>
          <button type="submit" className="w-full h-12 rounded-xl bg-primary text-on-primary font-semibold">
            Create period
          </button>
        </form>
      </Modal>
    </>
  );
}
