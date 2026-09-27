import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="shell py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="my-4 text-3xl font-semibold">This page isn’t available</h1>
      <p className="muted mb-8">
        The link may be incorrect, or this assistant is no longer published.
      </p>
      <Link className="btn" href="/dashboard">
        Go to dashboard
      </Link>
    </main>
  );
}
