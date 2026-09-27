'use server';

import { redirect } from 'next/navigation';

import { createBotSchema } from '@/lib/bots/schema';
import { createClient } from '@/lib/supabase/server';
import { getAccount, getUsage } from '@/lib/billing/account';

export async function createBot(formData: FormData) {
  const parsed = createBotSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
  });

  if (!parsed.success) {
    redirect(
      `/dashboard/new?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? 'Invalid bot data.',
      )}`,
    );
  }

  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect('/login');
  }

  const [account, usage] = await Promise.all([getAccount(userId), getUsage(userId)]);
  if (usage.bots >= account.plan.bots)
    redirect(
      '/dashboard/new?error=' +
        encodeURIComponent(
          'Your plan’s chatbot limit is reached. Upgrade in Billing or delete an unused bot.',
        ),
    );

  const { data: bot, error } = await supabase
    // Ownership and limits are checked on the server, not just in the UI.
    .from('bots')
    .insert({
      user_id: userId,
      name: parsed.data.name,
      description: parsed.data.description,
    })
    .select('id')
    .single();

  if (error) {
    redirect(`/dashboard/new?error=${encodeURIComponent('Failed to create chatbot.')}`);
  }

  redirect(`/dashboard/bots/${bot.id}`);
}
