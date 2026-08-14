import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?: "outline" | "ghost" | "destructive";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      className={cn("shrink-0", className)}
      onClick={() => void signOut()}
    >
      <span className="material-symbols-outlined text-[18px]" aria-hidden>
        logout
      </span>
      Sign out
    </Button>
  );
}
