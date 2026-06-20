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
