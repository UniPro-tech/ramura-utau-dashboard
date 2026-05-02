"use client";

import { SnackbarProvider } from "notistack";
import ModeProvider from "./ModeProvider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SnackbarProvider autoHideDuration={3000}>
      <ModeProvider>{children}</ModeProvider>
    </SnackbarProvider>
  );
}
