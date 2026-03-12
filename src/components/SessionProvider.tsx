"use client";
import { SessionProvider as NextSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export function SessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <NextSessionProvider>{children}</NextSessionProvider>;
}
