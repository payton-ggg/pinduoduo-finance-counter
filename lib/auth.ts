import { cookies } from "next/headers";

export async function getAuthRole(): Promise<"admin" | "restricted" | null> {
  try {
    const cookieStore = await cookies();
    const password = cookieStore.get("site_password")?.value;

    if (!password) {
      return null;
    }

    if (password === process.env.SITE_PASSWORD) {
      return "admin";
    }

    if (process.env.SITE_PASSWORD2 && password === process.env.SITE_PASSWORD2) {
      return "restricted";
    }

    return null;
  } catch (e) {
    console.error("Failed to read auth cookies:", e);
    return null;
  }
}
