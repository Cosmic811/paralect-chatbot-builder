'use client';
import { MessageText } from './MessageText';
import { type FormEvent, useEffect, useRef, useState } from 'react';
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { name: string }[];
};
type Conversation = { id: string; created_at: string };
export function ChatInterface({
  botId,
  name,
  ready = true,
  publicId,
  welcome = 'Ask a question about the uploaded documents.',
  color = '#7c3aed',
}: {
  botId?: string;
  name: string;
  ready?: boolean;
  publicId?: string;
  welcome?: string;
  color?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sending = useRef(false);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        if (publicId) {
          let token: string | null = null;
          try {
            token = sessionStorage.getItem('knowledge-chat:' + publicId);
          } catch {
            /* Storage may be disabled in an embedded browser. */
          }
          if (!token) return;
          const response = await fetch(`/api/widget/${publicId}`, {
            headers: { Authorization: 'Bearer ' + token },
            signal: controller.signal,
          });
          if (!response.ok) {
            try {
              sessionStorage.removeItem('knowledge-chat:' + publicId);
            } catch {}
            return;
          }
          const data = await response.json();
          setMessages(data.messages);
          setSession(token);
        } else {
          const response = await fetch(`/api/bots/${botId}/history`, { signal: controller.signal });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setMessages(data.messages);
          setConversationId(data.conversationId);
          setConversations(data.conversations);
        }
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(failure instanceof Error ? failure.message : 'Could not load history.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [botId, publicId]);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);
  function newChat() {
    setMessages([]);
    setConversationId(null);
    setSession(null);
    setError('');
    setQuestion('');
    if (publicId)
      try {
        sessionStorage.removeItem('knowledge-chat:' + publicId);
      } catch {}
  }
  async function selectChat(id: string) {
    if (!id) {
      newChat();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/bots/${botId}/history?conversationId=${encodeURIComponent(id)}`,
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessages(data.messages);
      setConversationId(data.conversationId);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not load history.');
    } finally {
      setLoading(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || sending.current || !ready || loading) return;
    sending.current = true;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(
        publicId ? `/api/widget/${publicId}` : `/api/bots/${botId}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            publicId ? { question: text, session } : { question: text, conversationId },
          ),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || 'Could not send your question. Please retry.');
      if (!data.answer) throw new Error('No answer received. Please retry.');
      if (publicId) {
        setSession(data.session);
        try {
          sessionStorage.setItem('knowledge-chat:' + publicId, data.session);
        } catch {}
      } else {
        setConversationId(data.conversationId);
        if (!conversationId)
          setConversations((current) => [
            { id: data.conversationId, created_at: new Date().toISOString() },
            ...current,
          ]);
      }
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'user', content: text },
        { id: crypto.randomUUID(), role: 'assistant', content: data.answer, sources: data.sources },
      ]);
      setQuestion('');
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Connection lost. Your question is still here.',
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  return (
    <div
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 ${publicId ? 'h-dvh rounded-none border-0' : 'h-[640px]'}`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: color }}
          >
            ✦
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{name}</h2>
            <p className="mt-0.5 text-[11px] text-zinc-500">Answers from company knowledge</p>
          </div>
        </div>
        <button
          className="shrink-0 text-xs text-zinc-400 hover:text-white disabled:opacity-40"
          disabled={busy || loading}
          onClick={newChat}
        >
          New chat
        </button>
      </header>
      {!publicId && !!conversations.length && (
        <div className="border-b border-zinc-800 px-5 py-3">
          <label className="flex items-center gap-3 text-xs text-zinc-400">
            History
            <select
              aria-label="Conversation history"
              value={conversationId ?? ''}
              disabled={busy || loading}
              className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-300"
              onChange={(event) => void selectChat(event.target.value)}
            >
              <option value="">New conversation</option>
              {conversations.map((item, index) => (
                <option key={item.id} value={item.id}>
                  {new Date(item.created_at).toLocaleString()} · conversation{' '}
                  {conversations.length - index}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div
        ref={list}
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5"
      >
        {loading ? (
          <p className="muted m-auto">Loading conversation…</p>
        ) : !messages.length && !busy ? (
          <div className="m-auto px-4 text-center">
            <p className="text-3xl text-violet-400">✦</p>
            <h3 className="mt-5 text-lg font-medium">
              {ready ? 'How can I help?' : 'Add your first document'}
            </h3>
            <p className="muted mx-auto mt-3 max-w-sm">
              {ready
                ? welcome
                : 'Upload knowledge in the Knowledge tab, then come back to test your assistant.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${message.role === 'user' ? 'ml-auto' : 'mr-auto'} max-w-[90%]`}
              >
                <div
                  style={message.role === 'user' ? { background: color } : undefined}
                  className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-tr-sm text-white' : 'rounded-tl-sm bg-zinc-800 text-zinc-200'}`}
                >
                  <span className="sr-only">
                    {message.role === 'user' ? 'You: ' : 'Assistant: '}
                  </span>
                  <MessageText text={message.content} />
                </div>
                {!!message.sources?.length && (
                  <p className="mt-2 break-words text-[11px] text-zinc-500">
                    Sources: {message.sources.map((source) => source.name).join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        {busy && (
          <p role="status" className="mt-4 text-sm text-zinc-400">
            Reading the knowledge…
          </p>
        )}
      </div>
      <form onSubmit={submit} className="border-t border-zinc-800 p-4">
        {error && (
          <p role="alert" className="mb-3 text-sm text-red-300">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <input
            aria-label="Your question"
            className="field min-w-0 flex-1 !text-sm"
            value={question}
            maxLength={2000}
            disabled={!ready || busy || loading}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={ready ? 'Ask a question…' : 'Upload knowledge first…'}
          />
          <button
            type="submit"
            className="btn !px-4"
            style={{ background: color }}
            disabled={!ready || busy || loading || !question.trim()}
          >
            Send
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-zinc-500">
          AI answers can be imperfect. Verify important information.
        </p>
      </form>
      {publicId && (
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="pb-3 text-center text-[10px] text-zinc-500"
        >
          Powered by Knowledge AI ↗
        </a>
      )}
    </div>
  );
}
