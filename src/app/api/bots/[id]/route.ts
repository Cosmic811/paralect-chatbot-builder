import { NextResponse } from 'next/server';
import { currentOwner } from '@/lib/auth/owner';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAccount } from '@/lib/billing/account';
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { userId, supabase } = await currentOwner();
  if (!userId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { id } = await context.params;
  const bot = await supabase
    .from('bots')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (!bot.data) return NextResponse.json({ error: 'Chatbot not found.' }, { status: 404 });
  const admin = createAdminClient();
  try {
    const account = await getAccount(userId);
    const widgets = { ...account.metadata.widgets };
    delete widgets[id];
    const disabled = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { ...account.metadata, widgets },
    });
    if (disabled.error) throw disabled.error;
    const documents = await admin.from('documents').select('storage_path').eq('bot_id', id);
    if (documents.error) throw documents.error;
    const paths = documents.data
      .map((document) => document.storage_path)
      .filter((value): value is string => Boolean(value));
    if (paths.length) {
      const removed = await admin.storage.from('knowledge-files').remove(paths);
      if (removed.error) throw removed.error;
    }
    while (true) {
      const conversations = await admin
        .from('conversations')
        .select('id')
        .eq('bot_id', id)
        .limit(500);
      if (conversations.error) throw conversations.error;
      if (!conversations.data.length) break;
      const ids = conversations.data.map((item) => item.id);
      const messages = await admin.from('messages').delete().in('conversation_id', ids);
      if (messages.error) throw messages.error;
      const removed = await admin.from('conversations').delete().in('id', ids);
      if (removed.error) throw removed.error;
    }
    for (const table of ['document_chunks', 'documents']) {
      const result = await admin.from(table).delete().eq('bot_id', id);
      if (result.error) throw result.error;
    }
    const removed = await admin.from('bots').delete().eq('id', id).eq('user_id', userId);
    if (removed.error) throw removed.error;
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json(
      {
        error:
          'Deletion could not finish. The public widget is paused; retry to finish removing the chatbot.',
      },
      { status: 500 },
    );
  }
}
