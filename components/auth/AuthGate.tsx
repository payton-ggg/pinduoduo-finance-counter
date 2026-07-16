"use client";

import { useEffect, useState } from "react";
import { LoginScreen } from "@/components/auth/LoginScreen";
import Loading from "@/app/loading";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  // null = loading, false = not authed, true = authed
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const isAuth = localStorage.getItem("site_auth") === "true";
    setAuthed(isAuth);

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
        if (!url.includes("/api/auth")) {
          localStorage.removeItem("site_auth");
          localStorage.removeItem("site_role");
          setAuthed(false);
        }
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (authed === null) {
    // Show loading skeleton while reading localStorage and server rendering
    return <Loading />;
  }

  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />;
  }

  return <>{children}</>;
}
