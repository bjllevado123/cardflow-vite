import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from "sonner";
import { BrandSplash } from "@/components/brand-splash";
import { router } from "@/router";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary fallback={<p className="p-8">Something went wrong. Reload CardFlow.</p>}>
      <QueryClientProvider client={queryClient}>
        <BrandSplash />
        <RouterProvider router={router} />
        <Toaster position="top-center" />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
