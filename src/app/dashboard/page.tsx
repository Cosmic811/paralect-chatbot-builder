import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentOwner } from '@/lib/auth/owner';
import { getAccount, getUsage } from '@/lib/billing/account';
import { AppHeader } from '@/components/AppHeader';
export default async function Dashboard() {
  const { userId, supabase } = await currentOwner();
  if (!userId) redirect('/login');
  const [account, usage, result] = await Promise.all([
    getAccount(userId),
    getUsage(userId),
    supabase
      .from('bots')
      .select('id,name,description,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);
  if (result.error) throw new Error('Could not load chatbots.');
  return (
    <main>
      <AppHeader />
      <div className="shell">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Your workspace</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Knowledge, ready to help.
            </h1>
            <p className="muted mt-3">Build an assistant. Give it knowledge. Make it useful.</p>
          </div>
          <Link
            className="btn"
            href={usage.bots >= account.plan.bots ? '/dashboard/billing' : '/dashboard/new'}
          >
            {usage.bots >= account.plan.bots ? 'Upgrade to add a chatbot' : '+ Create chatbot'}
          </Link>
        </div>
        <div className="mb-9 grid gap-4 sm:grid-cols-3">
          {[
            ['Chatbots', usage.bots, account.plan.bots],
            ['Documents', usage.documents, account.plan.documents],
            ['Messages this month', usage.messages, account.plan.messages],
          ].map(([title, value, limit]) => (
            <div key={title} className="panel">
              <p className="muted">{title}</p>
              <p className="mt-3 text-3xl font-semibold">
                {value}
                <span className="ml-2 text-sm font-normal text-zinc-500">/ {limit}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your chatbots</h2>
          <Link href="/dashboard/billing" className="text-sm text-violet-300">
            {account.plan.name} plan →
          </Link>
        </div>
        {!result.data.length ? (
          <div className="panel py-16 text-center">
            <p className="text-4xl text-violet-400">✦</p>
            <h3 className="mt-5 text-xl font-semibold">Your first assistant starts here</h3>
            <p className="muted mx-auto my-4 max-w-sm">
              Create a chatbot and upload a document. You’ll be testing its first answer in a few
              minutes.
            </p>
            <Link className="btn mt-3" href="/dashboard/new">
              Create your first chatbot
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {result.data.map((bot) => (
              <Link
                key={bot.id}
                href={`/dashboard/bots/${bot.id}`}
                className="panel group transition hover:border-violet-500"
              >
                <div className="mb-7 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-xl text-violet-300">
                    ✦
                  </span>
                  <span className="text-zinc-500 group-hover:text-violet-300">↗</span>
                </div>
                <h3 className="text-lg font-semibold">{bot.name}</h3>
                <p className="muted mt-2 line-clamp-2">
                  {bot.description || 'Your company knowledge, in conversation.'}
                </p>
                <p className="mt-7 text-xs text-zinc-500">
                  Created {new Date(bot.created_at).toLocaleDateString('en-GB')}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
