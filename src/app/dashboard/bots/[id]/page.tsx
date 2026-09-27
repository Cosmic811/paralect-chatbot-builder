import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { currentOwner } from '@/lib/auth/owner';
import { getAccount, widgetSettings } from '@/lib/billing/account';
import { AppHeader } from '@/components/AppHeader';
import { ChatPlayground } from './ChatPlayground';
import { KnowledgePanel, SettingsPanel, EmbedPanel } from './WorkspacePanels';
export default async function BotPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const selected = (await searchParams).tab || 'playground';
  const { userId, supabase } = await currentOwner();
  if (!userId) redirect('/login');
  const { data: bot } = await supabase
    .from('bots')
    .select('id,name,description,public_id,system_prompt')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (!bot) notFound();
  const [account, documents] = await Promise.all([
    getAccount(userId),
    supabase
      .from('documents')
      .select('id,name,status,size_bytes,error_message')
      .eq('bot_id', id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);
  if (documents.error) throw new Error('Could not load documents.');
  const widget = widgetSettings(account.metadata, id);
  const h = await headers();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL || `${h.get('x-forwarded-proto') || 'http'}://${h.get('host')}`;
  const tabs = [
    { id: 'playground', label: 'Playground' },
    { id: 'knowledge', label: 'Knowledge' },
    { id: 'embed', label: 'Website widget' },
    { id: 'settings', label: 'Settings' },
  ];
  const tab = tabs.some((item) => item.id === selected) ? selected : 'playground';
  return (
    <main>
      <AppHeader />
      <div className="shell">
        <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
          ← All chatbots
        </Link>
        <div className="my-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{bot.name}</h1>
            <p className="muted mt-2">{bot.description || 'Your knowledge assistant workspace'}</p>
          </div>
          <span
            className={`rounded-full border px-3 py-1.5 text-xs ${widget.enabled && account.plan.embed ? 'border-emerald-800 text-emerald-300' : 'border-zinc-700 text-zinc-400'}`}
          >
            {widget.enabled && account.plan.embed ? 'Widget published' : 'Private assistant'}
          </span>
        </div>
        <nav
          aria-label="Chatbot sections"
          className="mb-8 flex gap-1 overflow-x-auto border-b border-zinc-800"
        >
          {tabs.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/bots/${id}?tab=${item.id}`}
              aria-current={tab === item.id ? 'page' : undefined}
              className={`shrink-0 border-b-2 px-5 py-4 text-sm ${tab === item.id ? 'border-violet-500 text-violet-300' : 'border-transparent text-zinc-500 hover:text-white'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {tab === 'playground' && (
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_280px]">
            <ChatPlayground
              key={id}
              botId={id}
              botName={bot.name}
              hasKnowledge={documents.data.some((document) => document.status === 'ready')}
            />
            <aside className="panel">
              <p className="eyebrow">Test before you share</p>
              <h2 className="mt-4 text-lg font-semibold">
                A useful answer starts with good knowledge.
              </h2>
              <p className="muted mt-4">
                Ask questions your customers actually ask. Try a follow-up, then ask something your
                documents don’t cover.
              </p>
              <div className="my-6 border-t border-zinc-800 pt-5">
                <p className="text-2xl font-semibold">
                  {documents.data.filter((document) => document.status === 'ready').length}
                </p>
                <p className="muted">ready documents</p>
              </div>
              <Link className="text-sm text-violet-300" href={`?tab=knowledge`}>
                Manage knowledge →
              </Link>
              <p className="mt-6 text-xs leading-6 text-zinc-500">
                Conversations save automatically. Sources appear beneath new answers.
              </p>
            </aside>
          </div>
        )}
        {tab === 'knowledge' && <KnowledgePanel botId={id} documents={documents.data} />}
        {tab === 'settings' && <SettingsPanel bot={bot} />}
        {tab === 'embed' && (
          <EmbedPanel
            botId={id}
            publicId={bot.public_id}
            origin={origin}
            settings={widget}
            allowed={account.plan.embed}
          />
        )}
      </div>
    </main>
  );
}
