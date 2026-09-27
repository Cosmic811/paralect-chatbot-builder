export const PLANS = {
  free: { name: 'Starter', price: 0, bots: 1, documents: 10, messages: 100, embed: false },
  pro: { name: 'Pro', price: 29, bots: 5, documents: 100, messages: 2000, embed: true },
} as const;
export type PlanId = keyof typeof PLANS;
export function planId(value: unknown): PlanId {
  return value === 'pro' ? 'pro' : 'free';
}
