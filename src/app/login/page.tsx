import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import { login } from './actions';

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  if (data?.claims?.sub) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-8">
          <span className="text-sm font-medium text-violet-400">KNOWLEDGE AI</span>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back</h1>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Sign in to manage your AI chatbots.
          </p>
        </div>

        {params.error && (
          <div className="mb-5 rounded-lg border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {params.error}
          </div>
        )}

        {params.message && (
          <div className="mb-5 rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
            {params.message}
          </div>
        )}

        <form action={login} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-300">Email</span>

            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-500"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-zinc-300">Password</span>

            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-500"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-violet-600 px-4 py-3 text-sm font-medium transition hover:bg-violet-500"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-violet-400 hover:text-violet-300">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
