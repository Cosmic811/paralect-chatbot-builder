import { redirect } from 'next/navigation';
import { currentOwner } from '@/lib/auth/owner';
import { getAccount, getUsage } from '@/lib/billing/account';
import { AppHeader } from '@/components/AppHeader';
import { BillingPanel } from './BillingPanel';
export default async function Billing() {
  const { userId } = await currentOwner();
  if (!userId) redirect('/login');
  const [account, usage] = await Promise.all([getAccount(userId), getUsage(userId)]);
  return (
    <main>
      <AppHeader active="billing" />
      <div className="shell">
        <p className="eyebrow">Plans & usage</p>
        <h1 className="mt-2 text-4xl font-semibold">Room to grow.</h1>
        <p className="muted mt-3">
          Choose the right plan for your knowledge. This checkout is a demo — no real charges.
        </p>
        <BillingPanel planId={account.id} usage={usage} invoices={account.invoices} />
      </div>
    </main>
  );
}
