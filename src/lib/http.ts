export async function safeJson(res: Response): Promise<{ ok: boolean; status: number; data: any }> {
  const status = res.status;
  const ok = res.ok;
  const ct = res.headers.get("content-type") || "";
  let raw = "";
  try {
    raw = await res.text();
  } catch {
    raw = "";
  }
  if (ct.includes("application/json")) {
    try {
      const data = raw ? JSON.parse(raw) : {};
      return { ok, status, data };
    } catch {
      return { ok: false, status, data: { error: "Invalid JSON from server", raw: raw.slice(0, 500) } };
    }
  }
  return { ok: false, status, data: { error: raw.slice(0, 500) || `HTTP ${status}` } };
}
