import { NextResponse, type NextRequest } from 'next/server';
import { currentOwner } from '@/lib/auth/owner';
import { getAccount, getUsage } from '@/lib/billing/account';
import { createAdminClient } from '@/lib/supabase/admin';
export async function POST(request: NextRequest) {
  const { userId } = await currentOwner();
  if (!userId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || !['upgrade', 'cancel'].includes(body.action) || body.demoAcknowledged !== true)
    return NextResponse.json({ error: 'Confirm the demo checkout to continue.' }, { status: 400 });
  const account = await getAccount(userId);
  const plan = body.action === 'upgrade' ? 'pro' : 'free';
  if (account.id === plan) return NextResponse.json({ plan });
  if (plan === 'free') {
    const usage = await getUsage(userId);
    if (usage.bots > 1 || usage.documents > 10)
      return NextResponse.json(
        {
          error:
            'Before switching to Starter, keep at most 1 bot and 10 documents. Nothing has been deleted.',
        },
        { status: 409 },
      );
  }
  const invoices =
    plan === 'pro'
      ? [
          { id: crypto.randomUUID(), date: new Date().toISOString(), amount: 29, plan: 'Pro' },
          ...account.invoices,
        ].slice(0, 20)
      : account.invoices;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { ...account.metadata, plan, demo_invoices: invoices },
  });
  if (error)
    return NextResponse.json(
      { error: 'Could not update your plan. Please retry.' },
      { status: 500 },
    );
  return NextResponse.json({ plan });
}
