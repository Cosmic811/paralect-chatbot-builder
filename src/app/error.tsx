'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="shell py-24">
      <div className="panel mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="muted my-4">Your work is saved. Try loading this page again.</p>
        <button className="btn" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
