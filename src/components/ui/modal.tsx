import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { Drawer } from "vaul";

function subscribe(cb: () => void) {
  const mq = window.matchMedia("(max-width: 767px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getSnapshot = () => window.matchMedia("(max-width: 767px)").matches;

function Header({
  title,
  description,
  titleId,
  descId,
  onClose,
}: {
  title: string;
  description?: string;
  titleId: string;
  descId: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-2">
      <div>
        <h2 id={titleId} className="text-xl font-semibold text-on-background">
          {title}
        </h2>
        {description ? (
          <p id={descId} className="text-sm text-on-surface-variant mt-1">
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant"
        aria-label="Close"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, () => false);

  useEffect(() => {
    if (isMobile) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open, isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onDialogClose = () => onClose();
    dialog.addEventListener("close", onDialogClose);
    return () => dialog.removeEventListener("close", onDialogClose);
  }, [onClose, isMobile]);

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={(next) => !next && onClose()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[70] bg-primary/40 backdrop-blur-sm" />
          <Drawer.Content
            aria-labelledby={titleId}
            className="fixed bottom-0 left-0 right-0 z-[71] flex max-h-[92vh] flex-col rounded-t-3xl bg-surface-container-lowest outline-none"
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-outline-variant" />
            <Header title={title} description={description} titleId={titleId} descId={descId} onClose={onClose} />
            <div className="overflow-y-auto px-6 pb-8 pt-2">{children}</div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={`m-auto w-[calc(100%-2rem)] ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl border-0 bg-surface-container-lowest p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)]`}
    >
      <Header title={title} description={description} titleId={titleId} descId={descId} onClose={() => dialogRef.current?.close()} />
      <div className="px-6 pb-6 pt-2">{children}</div>
    </dialog>
  );
}
