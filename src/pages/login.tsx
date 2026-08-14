import { BrandLogo } from "@/components/brand-logo";
import { SignInForm } from "@/components/sign-in-form";

export function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-outline-variant/40 p-8">
        <BrandLogo href={null} size="md" showTagline />
        <h1 className="font-display mt-6 text-2xl font-semibold tracking-[-0.03em]">Sign in to continue</h1>
        <p className="mt-2 mb-6 text-sm leading-relaxed text-on-surface-variant">
          Cards and payments stay private to this login. Google or email before opening the tracker.
        </p>
        <SignInForm />
      </div>
    </div>
  );
}
