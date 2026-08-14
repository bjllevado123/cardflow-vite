import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const SESSION_KEY = "cardflow-vite:splash";
const letters = "CardFlow".split("");

function shouldPlay() {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as { standalone?: boolean }).standalone);
  if (standalone) return true;
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return false;
    sessionStorage.setItem(SESSION_KEY, "1");
    return true;
  } catch {
    return true;
  }
}

export function BrandSplash() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (reduce) return;
    if (!shouldPlay()) return;
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 1650);
    return () => window.clearTimeout(t);
  }, [reduce]);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#f3f7f5]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: "radial-gradient(ellipse 70% 50% at 50% 42%, rgba(184,245,212,0.85), transparent 70%)",
            }}
          />
          <motion.div
            className="relative h-24 w-24 rounded-[1.75rem]"
            initial={{ scale: 0.55, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
          >
            <span className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-[#0b1f17] via-[#123528] to-[#0a1628] shadow-[0_18px_40px_rgba(10,40,28,0.35)]" />
            <span className="absolute inset-[4px] rounded-[1.35rem] border border-white/10" />
            <span className="relative block h-full w-full">
              <motion.span
                className="absolute left-[28%] top-[22%] h-[34%] w-[52%] rounded-md bg-white/15"
                initial={{ x: 18, y: -14, rotate: 18, opacity: 0 }}
                animate={{ x: 8, y: -6, rotate: 8, opacity: 1 }}
                transition={{ delay: 0.18, type: "spring", stiffness: 220, damping: 16 }}
              />
              <motion.span
                className="absolute left-[18%] top-[38%] h-[34%] w-[52%] rounded-md bg-gradient-to-br from-[#9af5c8] to-[#3dd68c]"
                initial={{ x: -22, y: 16, opacity: 0 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                transition={{ delay: 0.28, type: "spring", stiffness: 240, damping: 16 }}
              />
            </span>
          </motion.div>
          <div className="relative mt-7 flex font-display text-4xl font-semibold tracking-[-0.04em] text-[#0f1a16]">
            {letters.map((ch, i) => (
              <motion.span
                key={`${ch}-${i}`}
                className={i >= 4 ? "text-[#0d7a52]" : undefined}
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.42 + i * 0.045, duration: 0.35 }}
              >
                {ch}
              </motion.span>
            ))}
          </div>
          <motion.p
            className="relative mt-3 font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5c7368]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
          >
            Clean Finance
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
