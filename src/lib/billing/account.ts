import { createAdminClient } from '@/lib/supabase/admin';
import { PLANS, planId } from './plans';
export interface WidgetSettings {
  enabled: boolean;
  welcome: string;
  color: string;
}
export interface Invoice {
  id: string;
  date: string;
  amount: number;
  plan: string;
}
export async function getAccount(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) throw new Error('Could not load your account.');
  const metadata = data.user.app_metadata;
  const id = planId(metadata.plan);
  return { id, plan: PLANS[id], metadata, invoices: (metadata.demo_invoices ?? []) as Invoice[] };
}
export async function getUsage(userId: string) {
  const admin = createAdminClient();
  const month = new Date();
  month.setUTCDate(1);
  month.setUTCHours(0, 0, 0, 0);
  const results = await Promise.all([
    admin.from('bots').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    admin
      .from('messages')
      .select('id,conversations!inner(bots!inner(user_id))', { count: 'exact', head: true })
      .eq('role', 'user')
      .eq('conversations.bots.user_id', userId)
      .gte('created_at', month.toISOString()),
  ]);
  if (results.some((result) => result.error)) throw new Error('Could not load usage.');
  return {
    bots: results[0].count ?? 0,
    documents: results[1].count ?? 0,
    messages: results[2].count ?? 0,
  };
}
export function widgetSettings(metadata: Record<string, unknown>, botId: string): WidgetSettings {
  const widget = (metadata.widgets as Record<string, Partial<WidgetSettings>> | undefined)?.[botId];
  return {
    enabled: widget?.enabled === true,
    welcome: widget?.welcome || 'Hi! Ask me about our product.',
    color: widget?.color || '#8b5cf6',
  };
}
