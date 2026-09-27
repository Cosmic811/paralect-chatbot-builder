const requests = new Map<string, { count: number; reset: number }>();
export function allowRequest(key: string, limit = 15) {
  const now = Date.now();
  for (const [id, value] of requests) if (value.reset <= now) requests.delete(id);
  const value = requests.get(key) ?? { count: 0, reset: now + 60000 };
  if (value.count >= limit || (!requests.has(key) && requests.size >= 10000)) return false;
  value.count++;
  requests.set(key, value);
  return true;
}
