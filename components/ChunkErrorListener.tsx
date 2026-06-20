"use client";

import { useEffect } from "react";

export function ChunkErrorListener() {
  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      const message = e.message || "";
      if (
        message.includes("ChunkLoadError") ||
        message.includes("Loading chunk") ||
        message.includes("Failed to load chunk") ||
        message.includes("MIME type ('text/plain') is not executable")
      ) {
        console.warn("Chunk load error detected, reloading page...", e);
        window.location.reload();
      }
    };

    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      const message = e.reason?.message || String(e.reason || "");
      if (
        message.includes("ChunkLoadError") ||
        message.includes("Loading chunk") ||
        message.includes("Failed to load chunk") ||
        message.includes("MIME type ('text/plain') is not executable")
      ) {
        console.warn(
          "Unhandled promise rejection (chunk load error) detected, reloading page...",
          e
        );
        window.location.reload();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
