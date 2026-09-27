'use client';
import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DocumentUpload } from './DocumentUpload';
import type { WidgetSettings } from '@/lib/billing/account';
async function send(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Request failed. Please retry.');
  return result;
}
export function KnowledgePanel({
  botId,
  documents,
}: {
  botId: string;
  documents: {
    id: string;
    name: string;
    status: string;
    size_bytes: number;
    error_message: string | null;
  }[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function remove(id: string) {
    setBusy(true);
    setError('');
    try {
      await send(`/api/bots/${botId}/documents/${id}`, 'DELETE');
      setDeleting(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove file.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
      <div>
        <DocumentUpload botId={botId} />
        <p className="muted mt-4 px-2">
          PDFs need selectable text. Scanned pages are not supported. Only upload documents you have
          permission to use.
        </p>
      </div>
      <section className="panel">
        <h2 className="text-xl font-semibold">Your knowledge</h2>
        <p className="muted mt-2">
          Ready documents are used for answers. Remove outdated files and upload their replacements.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error}
          </p>
        )}
        {!documents.length ? (
          <div className="py-16 text-center text-zinc-500">
            No documents yet. Add your first guide or FAQ.
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-zinc-800">
            {documents.map((document) => (
              <li key={document.id} className="py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">{document.name}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {Math.max(1, Math.ceil(document.size_bytes / 1024))} KB ·{' '}
                      <span
                        className={
                          document.status === 'ready' ? 'text-emerald-400' : 'text-amber-400'
                        }
                      >
                        {document.status}
                      </span>
                    </p>
                    {document.error_message && (
                      <p className="mt-2 text-xs text-red-300">{document.error_message}</p>
                    )}
                  </div>
                  <button
                    disabled={busy}
                    className="text-xs text-zinc-400 hover:text-red-300"
                    onClick={() => setDeleting(document.id)}
                  >
                    Remove
                  </button>
                </div>
                {deleting === document.id && (
                  <div className="mt-4 rounded-xl border border-red-900 p-4">
                    <p className="text-sm text-zinc-300">
                      Remove this file and its knowledge permanently? Existing chat messages remain.
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button
                        className="btn !bg-red-700"
                        disabled={busy}
                        onClick={() => void remove(document.id)}
                      >
                        {busy ? 'Removing…' : 'Remove document'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        disabled={busy}
                        onClick={() => setDeleting(null)}
                      >
                        Keep file
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
export function SettingsPanel({
  bot,
}: {
  bot: { id: string; name: string; description: string; system_prompt: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState('');
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage('');
    try {
      await send(`/api/bots/${bot.id}/settings`, 'PATCH', {
        name: form.get('name'),
        description: form.get('description'),
        systemPrompt: form.get('prompt'),
      });
      setMessage('Settings saved. New answers will use these instructions.');
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setMessage('');
    try {
      await send(`/api/bots/${bot.id}`, 'DELETE');
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not delete chatbot.');
      setBusy(false);
    }
  }
  return (
    <div className="max-w-3xl">
      <form className="panel space-y-6" onSubmit={save}>
        <div>
          <h2 className="text-xl font-semibold">Make it your assistant</h2>
          <p className="muted mt-2">
            Set the tone and purpose. Answers will still stay grounded in your documents.
          </p>
        </div>
        <label className="block text-sm">
          Name
          <input
            className="field mt-2"
            name="name"
            required
            maxLength={80}
            defaultValue={bot.name}
          />
        </label>
        <label className="block text-sm">
          Description
          <textarea
            className="field mt-2"
            name="description"
            maxLength={300}
            rows={3}
            defaultValue={bot.description}
          />
        </label>
        <label className="block text-sm">
          Assistant instructions
          <textarea
            className="field mt-2"
            name="prompt"
            required
            maxLength={3000}
            rows={6}
            defaultValue={bot.system_prompt}
          />
        </label>
        <button className="btn" disabled={busy}>
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </form>
      {message && (
        <p role="status" className="notice my-5">
          {message}
        </p>
      )}
      <section className="panel mt-6 !border-red-950">
        <h2 className="text-lg font-semibold">Delete chatbot</h2>
        <p className="muted my-3">
          Permanently remove this chatbot, uploaded documents and all conversations. Its website
          widget will stop working.
        </p>
        <label className="block text-sm">
          Type <strong>{bot.name}</strong> to confirm
          <input
            className="field my-3"
            aria-label="Confirm chatbot name"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </label>
        <button
          className="btn !bg-red-800"
          disabled={busy || confirm !== bot.name}
          onClick={remove}
        >
          Delete chatbot permanently
        </button>
      </section>
    </div>
  );
}
export function EmbedPanel({
  botId,
  publicId,
  origin,
  settings,
  allowed,
}: {
  botId: string;
  publicId: string;
  origin: string;
  settings: WidgetSettings;
  allowed: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [welcome, setWelcome] = useState(settings.welcome);
  const [color, setColor] = useState(settings.color);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const snippet = `<script src="${origin}/embed.js" data-bot="${publicId}" defer></script>`;
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await send(`/api/bots/${botId}/settings`, 'PUT', { enabled, welcome, color });
      setMessage(
        enabled
          ? 'Widget published. Visitors can now ask about your knowledge.'
          : 'Widget paused. Public questions are disabled.',
      );
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save widget.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <form className="panel space-y-6" onSubmit={save}>
        <div>
          <p className="eyebrow">Website widget · Pro</p>
          <h2 className="mt-3 text-2xl font-semibold">Put your knowledge to work.</h2>
          <p className="muted mt-3">
            Visitors can chat without an account. Only publish knowledge that you want to share
            publicly.
          </p>
        </div>
        {!allowed && (
          <div className="notice">
            <p className="mb-3">Upgrade to Pro to publish a website widget.</p>
            <Link className="btn" href="/dashboard/billing">
              Try Pro demo →
            </Link>
          </div>
        )}
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-violet-500"
            disabled={!allowed}
            checked={enabled && allowed}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          <span>
            Publish this assistant
            <span className="mt-1 block text-xs leading-5 text-zinc-500">
              Anyone with the widget link can receive answers from its documents.
            </span>
          </span>
        </label>
        <label className="block text-sm">
          Welcome message
          <textarea
            className="field mt-2"
            required
            maxLength={200}
            rows={3}
            value={welcome}
            onChange={(event) => setWelcome(event.target.value)}
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          Accent color
          <input
            type="color"
            aria-label="Widget accent color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-10 w-14 cursor-pointer rounded border border-zinc-700 bg-transparent"
          />
        </label>
        <button className="btn" disabled={busy || !allowed}>
          {busy ? 'Saving…' : 'Save widget settings'}
        </button>
        {message && (
          <p role="status" className="text-sm text-zinc-300">
            {message}
          </p>
        )}
      </form>
      <section className="panel">
        <h2 className="text-xl font-semibold">One snippet. Any website.</h2>
        <ol className="muted my-5 list-inside list-decimal space-y-3">
          <li>Enable the widget and save its settings.</li>
          <li>Copy the snippet below.</li>
          <li>Paste it before the closing body tag on your site.</li>
        </ol>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs leading-6 text-violet-200">
          {snippet}
        </pre>
        <button
          className="btn mt-4"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(snippet);
              setCopied(true);
            } catch {
              setMessage('Select and copy the snippet above.');
            }
          }}
        >
          {copied ? 'Copied ✓' : 'Copy embed code'}
        </button>
        <p className="muted mt-5">
          The widget automatically adapts to phones and desktops. Your visitors never need your API
          keys.
        </p>
        {settings.enabled && allowed && (
          <div className="mt-5 flex flex-wrap gap-4 text-sm text-violet-300">
            <a href={`/widget-demo/${publicId}`} target="_blank" rel="noreferrer">
              Test on a sample website ↗
            </a>
            <a href={`/widget/${publicId}`} target="_blank" rel="noreferrer">
              Open standalone chat ↗
            </a>
          </div>
        )}
        {origin.includes('localhost') && (
          <p className="mt-5 text-xs leading-6 text-amber-300">
            Local preview: after deployment, open this page on your public domain to copy the live
            embed code.
          </p>
        )}
      </section>
    </div>
  );
}
