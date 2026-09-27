import Link from 'next/link';
import { logout } from '@/app/dashboard/actions';
export function AppHeader({ active = 'bots' }: { active?: 'bots' | 'billing' }) {
  return (
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white">
            k.
          </span>
          Knowledge AI
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/dashboard" className={active === 'bots' ? 'text-white' : 'text-zinc-400'}>
            My chatbots
          </Link>
          <Link
            href="/dashboard/billing"
            className={active === 'billing' ? 'text-white' : 'text-zinc-400'}
          >
            Billing
          </Link>
          <form action={logout}>
            <button className="text-zinc-400 hover:text-white">Sign out</button>
          </form>
        </nav>
      </div>
    </header>
  );
}
