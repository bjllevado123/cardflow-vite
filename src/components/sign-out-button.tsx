import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?: "outline" | "ghost" | "destructive";
}) {
  const { signOutThisAccount } = useAuth();
  return (
    <Button
      type="button"
      variant={variant}
      className={cn("shrink-0", className)}
      onClick={() => void signOutThisAccount()}
    >
      <span className="material-symbols-outlined text-[18px]" aria-hidden>
        logout
      </span>
      Sign out
    </Button>
  );
}
