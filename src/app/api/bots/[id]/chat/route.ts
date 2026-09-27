import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { currentOwner } from '@/lib/auth/owner';
import { respond, ChatError } from '@/lib/chat/service';
import { providerError } from '@/lib/mistral/provider-error';
const schema = z.object({
  question: z.string().trim().min(1).max(2000),
  conversationId: z.string().uuid().nullable().optional(),
});
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { userId, supabase } = await currentOwner();
  if (!userId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Enter a question of 1–2000 characters.' }, { status: 400 });
  const { id } = await context.params;
  const { data: bot } = await supabase
    .from('bots')
    .select('id,user_id,system_prompt')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (!bot) return NextResponse.json({ error: 'Chatbot not found.' }, { status: 404 });
  try {
    return NextResponse.json(
      await respond(bot, parsed.data.question, parsed.data.conversationId ?? null),
    );
  } catch (error) {
    if (error instanceof ChatError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    const failure = providerError(error, 'Could not generate an answer. Please try again.');
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
}
