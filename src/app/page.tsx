import Link from 'next/link';
import { Pricing } from '@/components/Pricing';
export default function Home() {
  return (
    <main className="bg-[#faf9f6] text-zinc-900">
      <header className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
            k.
          </span>
          Knowledge AI
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#how-it-works" className="hidden sm:block">
            How it works
          </a>
          <a href="#pricing">Pricing</a>
          <Link href="/login" className="hidden sm:block">
            Sign in
          </Link>
          <Link href="/signup" className="btn">
            Get started <span aria-hidden>↗</span>
          </Link>
        </nav>
      </header>
      <section className="mx-auto grid max-w-[1200px] items-center gap-14 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-medium text-violet-700">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />A small assistant. A lot less
            repetition.
          </p>
          <h1 className="text-5xl font-semibold leading-[1.06] tracking-[-.055em] sm:text-7xl">
            Your docs.
            <br />
            Their questions.
            <br />
            <span className="text-violet-600">Better answers.</span>
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-zinc-500">
            Turn your company knowledge into a helpful AI assistant. Test it with your team, then
            put it on your website.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link className="btn px-6 py-3.5" href="/signup">
              Build your first assistant →
            </Link>
            <a className="text-sm font-medium" href="#how-it-works">
              See how it works ↓
            </a>
          </div>
          <p className="mt-5 text-xs text-zinc-500">
            Free to start · No credit card · Your documents, your control
          </p>
        </div>
        <div className="relative rounded-[32px] bg-[#e9e3f6] p-5 sm:p-9">
          <div className="mb-4 flex items-center justify-between text-xs text-violet-900">
            <span className="font-medium">YOUR KNOWLEDGE, IN CONVERSATION</span>
            <span>Product preview</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-zinc-800 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
                k.
              </span>
              <div>
                <p className="text-sm font-medium">Acme support</p>
                <p className="mt-1 text-xs text-zinc-500">Answers from your knowledge base</p>
              </div>
              <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-zinc-800 p-3 text-xs text-zinc-400">
                ▤ &nbsp; pricing-guide.pdf{' '}
                <span className="float-right text-emerald-400">Ready</span>
              </div>
              <p className="ml-9 rounded-2xl rounded-tr-sm bg-violet-600 p-4 text-sm">
                What’s included in the Pro plan?
              </p>
              <div className="mr-6 rounded-2xl rounded-tl-sm bg-zinc-800 p-4 text-sm leading-6">
                Pro includes 5 chatbots, 100 documents and 2,000 messages each month. You can also
                embed your assistant on your website.
                <p className="mt-3 text-xs text-violet-300">Source: pricing-guide.pdf</p>
              </div>
              <div className="mt-6 flex items-center justify-between rounded-xl border border-zinc-800 px-4 py-3 text-xs text-zinc-500">
                Ask a follow-up question...<span className="text-violet-400">↑</span>
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs text-violet-900">
            <span>✓</span> Grounded in your docs. Honest when it doesn’t know.
          </div>
        </div>
      </section>
      <section id="how-it-works" className="border-y border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <p className="eyebrow">From a file to a first answer</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">
            Less setup. More useful conversations.
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              [
                '01',
                'Bring your knowledge',
                'Upload product guides, FAQs or company policies. TXT, PDF and DOCX files up to 5 MB are supported.',
              ],
              [
                '02',
                'Make it sound like you',
                'Name your assistant, set its instructions and test real questions in a private playground.',
              ],
              [
                '03',
                'Meet people where they are',
                'Copy one embed snippet into your website. Visitors can ask questions without creating an account.',
              ],
            ].map(([n, title, copy]) => (
              <article key={n}>
                <span className="text-sm font-medium text-violet-500">{n} /</span>
                <h3 className="mb-3 mt-5 text-xl font-semibold">{title}</h3>
                <p className="leading-7 text-zinc-500">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1200px] gap-10 px-6 py-20 md:grid-cols-2">
        <h2 className="text-4xl font-semibold leading-tight tracking-tight">
          A first line of support.
          <br />
          <span className="text-zinc-400">Built around what you know.</span>
        </h2>
        <div className="space-y-6">
          {[
            [
              'Answers with a source',
              'Find information across your uploaded documents. The playground shows the documents used for each answer.',
            ],
            [
              'A useful “I don’t know”',
              'When the knowledge doesn’t contain an answer, your assistant says so instead of making one up.',
            ],
            [
              'Publish on your terms',
              'Your assistant stays private until you enable its website widget. Pause it at any time.',
            ],
          ].map(([title, copy]) => (
            <div key={title} className="border-b border-zinc-200 pb-6">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 leading-7 text-zinc-500">{copy}</p>
            </div>
          ))}
        </div>
      </section>
      <section id="pricing" className="mx-auto max-w-[1000px] px-6 py-16">
        <div className="mb-12 text-center">
          <p className="eyebrow">Simple plans</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">
            Start small. Share when you’re ready.
          </h2>
          <p className="mt-4 text-zinc-500">
            This demo includes a simulated checkout. No real charges.
          </p>
        </div>
        <Pricing />
      </section>
      <section className="mx-auto max-w-[900px] px-6 py-16">
        <h2 className="mb-8 text-3xl font-semibold tracking-tight">A few things worth knowing</h2>
        {[
          [
            'Does it answer questions from the internet?',
            'No. Answers are generated from the documents you upload. Add the information your customers need before publishing.',
          ],
          [
            'Will people see my original documents?',
            'Original files stay private. Once you publish a widget, visitors can ask questions and receive answers derived from its documents. Upload only knowledge you are comfortable sharing publicly.',
          ],
          [
            'Can I cancel?',
            'Yes. Switch back to Starter in Billing. If you exceed its storage limits, remove extra bots or documents first. Website widgets pause on Starter.',
          ],
          [
            'What happens when I reach a limit?',
            'The app stops new uploads, bot creation or messages when the corresponding limit is reached. You can remove documents or try the Pro demo; message usage resets each calendar month.',
          ],
        ].map(([q, a]) => (
          <details key={q} className="border-b border-zinc-200 py-5">
            <summary className="cursor-pointer font-medium">{q}</summary>
            <p className="mt-4 leading-7 text-zinc-500">{a}</p>
          </details>
        ))}
      </section>
      <footer className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 border-t border-zinc-200 px-6 py-8 text-xs text-zinc-500">
        <span>Knowledge AI · Built for helpful answers.</span>
        <div className="flex gap-5">
          <Link href="/privacy">Privacy & demo terms</Link>
          <Link href="/login">Sign in</Link>
        </div>
        <span>Paralect product demo</span>
      </footer>
    </main>
  );
}
