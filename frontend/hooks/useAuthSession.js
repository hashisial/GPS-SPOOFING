"use client";

import { useSession } from "@/components/layout/session-provider";

export function useAuthSession() {
  return useSession();
}
