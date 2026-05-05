"use client";

import { useEffect, useState } from "react";
import { LoginScreen } from "@/components/auth/LoginScreen";

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
    // Brief flash while reading localStorage
    return null;
  }

  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />;
  }

  return <>{children}</>;
}
