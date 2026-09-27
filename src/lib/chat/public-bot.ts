import { createAdminClient } from '@/lib/supabase/admin';
import { getAccount, widgetSettings } from '@/lib/billing/account';
export async function publicBot(publicId: string) {
  const admin = createAdminClient();
  const { data: bot } = await admin
    .from('bots')
    .select('id,user_id,name,system_prompt')
    .eq('public_id', publicId)
    .maybeSingle();
  if (!bot) return null;
  const account = await getAccount(bot.user_id);
  const widget = widgetSettings(account.metadata, bot.id);
  return account.plan.embed && widget.enabled ? { bot, widget } : null;
}
