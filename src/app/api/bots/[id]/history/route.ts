import { NextResponse, type NextRequest } from 'next/server';
import { currentOwner } from '@/lib/auth/owner';
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { userId, supabase } = await currentOwner();
  if (!userId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { id } = await context.params;
  const conversations = await supabase
    .from('conversations')
    .select('id,created_at')
    .eq('bot_id', id)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (conversations.error)
    return NextResponse.json({ error: 'Could not load history.' }, { status: 500 });
  const conversationId =
    request.nextUrl.searchParams.get('conversationId') || conversations.data[0]?.id || null;
  if (!conversationId)
    return NextResponse.json({ conversations: [], messages: [], conversationId: null });
  const owned = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('bot_id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (!owned.data) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  const messages = await supabase
    .from('messages')
    .select('id,role,content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (messages.error)
    return NextResponse.json({ error: 'Could not load messages.' }, { status: 500 });
  return NextResponse.json({
    conversations: conversations.data,
    messages: messages.data,
    conversationId,
  });
}
