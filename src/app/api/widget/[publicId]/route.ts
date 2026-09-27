import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { publicBot } from '@/lib/chat/public-bot';
import { issueSession, readSession } from '@/lib/chat/session';
import { allowRequest } from '@/lib/chat/rate-limit';
import { respond, ChatError } from '@/lib/chat/service';
import { providerError } from '@/lib/mistral/provider-error';
import { createAdminClient } from '@/lib/supabase/admin';
const schema = z.object({
  question: z.string().trim().min(1).max(2000),
  session: z.string().max(1000).nullable().optional(),
});
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await context.params;
  const ip = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ?? 'local';
  if (!allowRequest(publicId + ':' + ip))
    return NextResponse.json(
      { error: 'Too many messages. Please wait a minute.' },
      { status: 429 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Enter a question of 1–2000 characters.' }, { status: 400 });
  try {
    const published = await publicBot(publicId);
    if (!published)
      return NextResponse.json({ error: 'This assistant is not available.' }, { status: 404 });
    const conversationId = parsed.data.session
      ? readSession(parsed.data.session, published.bot.id)
      : null;
    if (parsed.data.session && !conversationId)
      return NextResponse.json(
        { error: 'Your session expired. Start a new chat.' },
        { status: 401 },
      );
    const result = await respond(published.bot, parsed.data.question, conversationId, true);
    return NextResponse.json({
      answer: result.answer,
      session: issueSession(published.bot.id, result.conversationId),
    });
  } catch (error) {
    if (error instanceof ChatError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    const failure = providerError(error, 'The assistant could not respond. Please try again.');
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
}
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await context.params;
  const published = await publicBot(publicId);
  if (!published) return NextResponse.json({ error: 'Assistant unavailable.' }, { status: 404 });
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  const conversationId = readSession(token, published.bot.id);
  if (!conversationId) return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
  const admin = createAdminClient();
  const owned = await admin
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('bot_id', published.bot.id)
    .is('user_id', null)
    .maybeSingle();
  if (!owned.data) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  const result = await admin
    .from('messages')
    .select('id,role,content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (result.error)
    return NextResponse.json({ error: 'Could not load conversation.' }, { status: 500 });
  return NextResponse.json({ messages: result.data }, { headers: { 'Cache-Control': 'no-store' } });
}
