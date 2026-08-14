import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CardVisual } from "@/components/card-visual";
import { Modal } from "@/components/ui/modal";
import { addCard } from "@/lib/db";
import { CARD_BRANDS, resolveCardBrand } from "@/lib/card-brands";

const fieldClass =
  "mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 min-h-12 outline-none focus:border-primary";

export function AddCardButton({
  holder,
  variant = "primary",
  label = "Add card",
}: {
  holder: string;
  variant?: "primary" | "tile";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  if (variant === "tile") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group min-h-[220px] rounded-2xl border-2 border-dashed border-outline-variant/80 bg-surface-container-lowest/50 hover:border-secondary flex flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <span className="w-12 h-12 rounded-full bg-surface-container-high group-hover:bg-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">add</span>
          </span>
          <p className="font-semibold">Add card or wallet</p>
        </button>
        <AddCardModal open={open} onClose={() => setOpen(false)} holder={holder} />
      </>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 px-5 rounded-xl bg-primary text-on-primary font-semibold inline-flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[20px]">add_card</span>
        {label}
      </button>
      <AddCardModal open={open} onClose={() => setOpen(false)} holder={holder} />
    </>
  );
}

function AddCardModal({ open, onClose, holder }: { open: boolean; onClose: () => void; holder: string }) {
  const [name, setName] = useState("BPI");
  const [brandId, setBrandId] = useState("bpi");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const brand = useMemo(() => resolveCardBrand(brandId), [brandId]);

  async function save(fd: FormData) {
    const display = String(fd.get("name") ?? "").trim();
    if (!display) return;
    const limit = Number(fd.get("credit_limit"));
    const day = Number(fd.get("statement_day"));
    await addCard({
      name: display,
      institution: display,
      last_four: null,
      credit_limit: limit > 0 ? limit : null,
      statement_day: day > 0 ? day : null,
      color: brandId,
    });
    toast.success("Card added");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add card or wallet" description="Pick a brand — the plastic preview updates live." wide>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5 order-2 md:order-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CARD_BRANDS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setBrandId(b.id);
                  setName(b.label);
                }}
                className={`flex items-center gap-2.5 h-12 px-3 rounded-xl border text-sm font-semibold ${
                  brandId === b.id ? "border-primary bg-primary text-on-primary" : "border-outline-variant"
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: b.swatch }} />
                {b.label}
              </button>
            ))}
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void save(new FormData(e.currentTarget));
            }}
          >
            <label className="block">
              <span className="text-[12px] font-bold tracking-[0.08em] uppercase text-on-surface-variant">Display name</span>
              <input
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setBrandId(resolveCardBrand(e.target.value).id);
                }}
                className={fieldClass}
              />
            </label>
            <button type="button" className="text-sm text-secondary font-semibold" onClick={() => setShowAdvanced((s) => !s)}>
              Optional: limit & statement day
            </button>
            {showAdvanced ? (
              <div className="grid grid-cols-2 gap-3">
                <input name="credit_limit" type="number" step="0.01" placeholder="Limit" className={fieldClass} />
                <input name="statement_day" type="number" min={1} max={31} placeholder="15" className={fieldClass} />
              </div>
            ) : null}
            <button type="submit" className="w-full h-12 rounded-xl bg-primary text-on-primary font-semibold">
              Save card
            </button>
          </form>
        </div>
        <div className="order-1 md:order-2 flex flex-col items-center justify-center gap-3 rounded-2xl bg-surface-container-low/80 p-6">
          <CardVisual name={name.trim() || brand.label} holder={holder} color={brandId} balance={0} />
        </div>
      </div>
    </Modal>
  );
}
