const active = new Set<string>();
export async function withAccountLock<T>(userId: string, action: () => Promise<T>): Promise<T> {
  if (active.has(userId))
    throw Object.assign(
      new Error('Another request is being processed. Please try again in a moment.'),
      { statusCode: 429 },
    );
  active.add(userId);
  try {
    return await action();
  } finally {
    active.delete(userId);
  }
}
