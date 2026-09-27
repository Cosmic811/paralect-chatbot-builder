import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import { createBot } from './actions';

interface NewBotPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function NewBotPage({ searchParams }: NewBotPageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-white">
      <section className="mx-auto w-full max-w-2xl">
        <Link href="/dashboard" className="text-sm text-zinc-400 transition hover:text-white">
          ← Back to dashboard
        </Link>

        <div className="mt-8">
          <span className="text-xs font-medium tracking-[0.2em] text-violet-400">NEW CHATBOT</span>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Create chatbot</h1>

          <p className="mt-2 text-zinc-400">
            Create the assistant first. You will add its knowledge base on the next screen.
          </p>
        </div>

        {params.error && (
          <div className="mt-6 rounded-lg border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {params.error}
          </div>
        )}

        <form
          action={createBot}
          className="mt-8 space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-7"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Name</span>

            <input
              name="name"
              type="text"
              required
              maxLength={80}
              placeholder="Customer Support"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-violet-500"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Description</span>

            <textarea
              name="description"
              maxLength={300}
              rows={4}
              placeholder="Answers questions using our product documentation."
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-violet-500"
            />
          </label>

          <div className="flex justify-end gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-700 px-5 py-3 text-sm text-zinc-300 transition hover:bg-zinc-800"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-5 py-3 text-sm font-medium transition hover:bg-violet-500"
            >
              Create chatbot
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
