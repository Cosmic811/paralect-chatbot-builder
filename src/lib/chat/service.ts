import { createAdminClient } from '@/lib/supabase/admin';
import { createEmbeddings } from '@/lib/mistral/embeddings';
import { answerFromContext } from '@/lib/mistral/chat';
import { getAccount, getUsage } from '@/lib/billing/account';
import { withAccountLock } from './account-lock';
export class ChatError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
interface Bot {
  id: string;
  user_id: string;
  system_prompt: string;
}
interface Chunk {
  document_id: string;
  content: string;
  chunk_index: number;
  similarity: number;
}
export async function respond(
  bot: Bot,
  question: string,
  conversationId: string | null,
  visitor = false,
) {
  return withAccountLock(bot.user_id, () =>
    respondUnlocked(bot, question, conversationId, visitor),
  );
}
async function respondUnlocked(
  bot: Bot,
  question: string,
  conversationId: string | null,
  visitor: boolean,
) {
  const admin = createAdminClient();
  const [account, usage] = await Promise.all([getAccount(bot.user_id), getUsage(bot.user_id)]);
  if (usage.messages >= account.plan.messages)
    throw new ChatError('Monthly message limit reached. The owner can upgrade in Billing.', 429);
  let history: { role: 'user' | 'assistant'; content: string }[] = [];
  if (conversationId) {
    let query = admin
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('bot_id', bot.id);
    query = visitor ? query.is('user_id', null) : query.eq('user_id', bot.user_id);
    const { data, error } = await query.maybeSingle();
    if (error) throw new ChatError('Could not load conversation.', 500);
    if (!data) throw new ChatError('Conversation not found or expired. Start a new chat.', 404);
    const result = await admin
      .from('messages')
      .select('role,content,created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(12);
    if (result.error) throw new ChatError('Could not load history.', 500);
    history = (result.data ?? [])
      .reverse()
      .map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content }));
  }
  const retrievalQuery = [
    ...history
      .filter((message) => message.role === 'user')
      .slice(-2)
      .map((message) => message.content),
    question,
  ].join('\n');
  const [embedding] = await createEmbeddings([retrievalQuery]);
  const { data, error } = await admin.rpc('match_document_chunks', {
    query_embedding: embedding,
    match_bot_id: bot.id,
    match_threshold: 0.35,
    match_count: 5,
  });
  if (error) throw new ChatError('Could not search the knowledge base.', 500);
  let chunks = (data ?? []) as Chunk[];
  let names = new Map<string, string>();
  if (chunks.length) {
    const documents = await admin
      .from('documents')
      .select('id,name')
      .eq('bot_id', bot.id)
      .eq('user_id', bot.user_id)
      .eq('status', 'ready')
      .in('id', [...new Set(chunks.map((chunk) => chunk.document_id))]);
    if (documents.error) throw new ChatError('Could not load knowledge sources.', 500);
    names = new Map(documents.data.map((document) => [document.id, document.name]));
    chunks = chunks.filter((chunk) => names.has(chunk.document_id));
  }
  let answer = "I don't know based on the uploaded knowledge.";
  if (chunks.length)
    answer = await answerFromContext(
      question,
      chunks.map((chunk, index) => `[${index + 1}] ${chunk.content}`).join('\n\n'),
      bot.system_prompt,
      history,
    );
  let created = false;
  if (!conversationId) {
    const conversation = await admin
      .from('conversations')
      .insert({ bot_id: bot.id, user_id: visitor ? null : bot.user_id })
      .select('id')
      .single();
    if (conversation.error || !conversation.data)
      throw new ChatError('Could not create conversation.', 500);
    conversationId = conversation.data.id;
    created = true;
  }
  const now = Date.now();
  const messages = await admin.from('messages').insert([
    {
      conversation_id: conversationId,
      role: 'user',
      content: question,
      created_at: new Date(now).toISOString(),
    },
    {
      conversation_id: conversationId,
      role: 'assistant',
      content: answer,
      created_at: new Date(now + 1).toISOString(),
    },
  ]);
  if (messages.error) {
    if (created) await admin.from('conversations').delete().eq('id', conversationId);
    throw new ChatError('Could not save conversation. Please try again.', 500);
  }
  return {
    answer,
    conversationId: conversationId!,
    sources: [...names].map(([documentId, name]) => ({ documentId, name })),
  };
}
