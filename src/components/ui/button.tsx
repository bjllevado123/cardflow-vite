import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-[background-color,color,border-color,box-shadow,opacity,transform,filter] duration-150 ease-out disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 active:translate-y-px active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-on-primary shadow-sm hover:bg-secondary hover:text-on-secondary hover:shadow-[0_8px_20px_rgba(13,122,82,0.28)]",
        outline:
          "border border-outline-variant bg-surface-container-lowest text-on-surface hover:border-secondary hover:bg-surface-container-high hover:text-on-surface",
        ghost: "text-on-surface hover:bg-surface-container-high hover:text-on-surface",
        destructive:
          "border border-outline-variant bg-surface-container-lowest text-error hover:border-error hover:bg-error/10",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-5 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
