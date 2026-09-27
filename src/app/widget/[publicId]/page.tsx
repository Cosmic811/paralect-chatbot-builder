import { publicBot } from '@/lib/chat/public-bot';
import { ChatInterface } from '@/components/ChatInterface';
export const dynamic = 'force-dynamic';
export default async function Widget({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const published = await publicBot(publicId);
  if (!published)
    return (
      <main className="flex h-dvh items-center justify-center bg-zinc-950 p-8 text-center">
        <div>
          <p className="text-3xl text-violet-400">✦</p>
          <h1 className="mt-5 text-xl font-semibold">This assistant is offline</h1>
          <p className="muted mt-3">Please contact the website team directly.</p>
        </div>
      </main>
    );
  return (
    <ChatInterface
      name={published.bot.name}
      publicId={publicId}
      welcome={published.widget.welcome}
      color={published.widget.color}
    />
  );
}
