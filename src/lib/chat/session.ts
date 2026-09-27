import { createHmac, timingSafeEqual } from 'node:crypto';
function sign(value: string) {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error('Server configuration missing.');
  return createHmac('sha256', secret)
    .update('knowledge-ai-widget:' + value)
    .digest('base64url');
}
export function issueSession(botId: string, conversationId: string) {
  const value = Buffer.from(
    JSON.stringify({ botId, conversationId, expires: Date.now() + 7 * 86400000 }),
  ).toString('base64url');
  return `${value}.${sign(value)}`;
}
export function readSession(token: string, botId: string): string | null {
  try {
    const [value, signature, extra] = token.split('.');
    if (!value || !signature || extra) return null;
    const actual = Buffer.from(signature);
    const expected = Buffer.from(sign(value));
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const payload = JSON.parse(Buffer.from(value, 'base64url').toString());
    return payload.botId === botId &&
      payload.expires > Date.now() &&
      typeof payload.conversationId === 'string'
      ? payload.conversationId
      : null;
  } catch {
    return null;
  }
}
