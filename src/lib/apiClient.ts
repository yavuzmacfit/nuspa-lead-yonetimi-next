export async function apiFetch<T = unknown>(
  path: string,
  opts: (RequestInit & { repId?: number | null }) = {}
): Promise<T> {
  const { repId, headers, ...rest } = opts;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...((headers as Record<string, string>) || {}),
  };
  if (repId) finalHeaders["x-sales-rep-id"] = String(repId);

  const res = await fetch(path, { ...rest, headers: finalHeaders });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // boş body olabilir
  }
  if (!res.ok) {
    const errBody = body as { error?: string; message?: string } | null;
    const msg = errBody?.error || errBody?.message || `İstek başarısız (${res.status})`;
    throw new Error(msg);
  }
  return body as T;
}
