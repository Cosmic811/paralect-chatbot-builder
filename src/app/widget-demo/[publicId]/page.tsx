import Script from 'next/script';
import { headers } from 'next/headers';
import { publicBot } from '@/lib/chat/public-bot';
import { notFound } from 'next/navigation';
export default async function WidgetDemo({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const published = await publicBot(publicId);
  if (!published) notFound();
  const h = await headers();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL || `${h.get('x-forwarded-proto') || 'http'}://${h.get('host')}`;
  return (
    <main className="min-h-dvh bg-[#f8f7f3] px-8 py-12 text-zinc-900">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold">{published.bot.name} / WIDGET PREVIEW</p>
        <section className="max-w-2xl py-24">
          <p className="mb-5 text-sm text-violet-600">A sample customer website</p>
          <h1 className="text-6xl font-semibold tracking-tight">
            Help is one
            <br />
            question away.
          </h1>
          <p className="mt-8 text-lg leading-8 text-zinc-500">
            This page loads the same embeddable script you can install on your own website. Open the
            chat button in the bottom-right corner and ask a question.
          </p>
          <p className="mt-6 text-sm text-zinc-500">
            The widget uses your published knowledge and counts toward your message allowance.
          </p>
        </section>
      </div>
      <Script src={`${origin}/embed.js`} data-bot={publicId} strategy="afterInteractive" />
    </main>
  );
}
