'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLANS, type PlanId } from '@/lib/billing/plans';
import type { Invoice } from '@/lib/billing/account';
export function BillingPanel({
  planId,
  usage,
  invoices,
}: {
  planId: PlanId;
  usage: { bots: number; documents: number; messages: number };
  invoices: Invoice[];
}) {
  const [checkout, setCheckout] = useState<'upgrade' | 'cancel' | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  async function submit() {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: checkout, demoAcknowledged: true }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setCheckout(null);
      setMessage(
        body.plan === 'pro'
          ? 'Demo checkout complete. Your Pro features are ready. No money was charged.'
          : 'You are on Starter. Website widgets are paused.',
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="my-8 grid gap-5 md:grid-cols-2">
        {Object.entries(PLANS).map(([id, plan]) => (
          <section key={id} className={`panel ${id === planId ? '!border-violet-500' : ''}`}>
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              {id === planId && <span className="text-xs text-violet-300">Current plan</span>}
            </div>
            <p className="my-6 text-4xl font-semibold">
              ${plan.price}
              <span className="text-sm font-normal text-zinc-500"> / month</span>
            </p>
            <ul className="muted mb-6 space-y-2">
              <li>
                {plan.bots} chatbot{plan.bots > 1 ? 's' : ''}
              </li>
              <li>{plan.documents} documents</li>
              <li>{plan.messages.toLocaleString()} messages each calendar month</li>
              <li>{plan.embed ? 'Website widget + customization' : 'Private playground'}</li>
            </ul>
            <button
              disabled={id === planId || busy}
              className="btn w-full"
              onClick={() => {
                setCheckout(id === 'pro' ? 'upgrade' : 'cancel');
                setMessage('');
              }}
            >
              {id === planId
                ? 'Your plan'
                : id === 'pro'
                  ? 'Try Pro — demo checkout'
                  : 'Switch to Starter'}
            </button>
          </section>
        ))}
      </div>
      {checkout && (
        <section className="panel mb-6 !border-violet-500" aria-label="Demo checkout">
          <p className="eyebrow">Demo checkout</p>
          <h2 className="mt-3 text-2xl font-semibold">
            {checkout === 'upgrade' ? 'Confirm Pro · $29 / month' : 'Switch to Starter · $0'}
          </h2>
          <p className="muted my-4">
            {checkout === 'upgrade'
              ? 'This simulates a successful payment and enables Pro features. No card is needed, no money is charged and no real subscription is created.'
              : 'Website widgets will stop accepting questions. Existing knowledge and conversations are retained. Starter allows 1 bot and 10 documents.'}
          </p>
          <div className="flex gap-3">
            <button className="btn" disabled={busy} onClick={submit}>
              {busy
                ? 'Processing…'
                : checkout === 'upgrade'
                  ? 'Simulate successful payment'
                  : 'Confirm switch'}
            </button>
            <button disabled={busy} className="btn btn-secondary" onClick={() => setCheckout(null)}>
              Cancel
            </button>
          </div>
        </section>
      )}
      {message && (
        <p role="status" className="notice mb-6">
          {message}
        </p>
      )}
      <section className="panel mb-6">
        <h2 className="text-lg font-semibold">Workspace usage</h2>
        <p className="muted mt-1">Messages reset on the first day of each calendar month (UTC).</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {(['bots', 'documents', 'messages'] as const).map((key) => (
            <div key={key}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="capitalize">{key}</span>
                <span>
                  {usage[key]} / {PLANS[planId][key]}
                </span>
              </div>
              <progress
                className="h-2 w-full accent-violet-500"
                value={usage[key]}
                max={PLANS[planId][key]}
                aria-label={key}
              />
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2 className="text-lg font-semibold">Demo payment history</h2>
        {!invoices.length ? (
          <p className="muted mt-4">No simulated payments yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-800">
            {invoices.map((invoice) => (
              <li className="flex flex-wrap justify-between gap-3 py-4 text-sm" key={invoice.id}>
                <span>
                  {new Date(invoice.date).toLocaleDateString('en-GB')} · {invoice.plan}
                </span>
                <span>${invoice.amount} · Simulated — not charged</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
