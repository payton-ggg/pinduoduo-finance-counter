export async function logout() {
  try {
    await fetch("/api/auth", { method: "DELETE" });
  } catch (e) {
    console.error("Logout error:", e);
  } finally {
    localStorage.removeItem("site_auth");
    localStorage.removeItem("site_role");
    window.location.href = "/";
  }
}
