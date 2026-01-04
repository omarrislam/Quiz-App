"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, clearAuthToken, getAuthToken } from "../../lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    apiFetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          clearAuthToken();
          router.replace("/login");
          return;
        }
        setReady(true);
      })
      .catch(() => {
        clearAuthToken();
        router.replace("/login");
      });
  }, [router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
