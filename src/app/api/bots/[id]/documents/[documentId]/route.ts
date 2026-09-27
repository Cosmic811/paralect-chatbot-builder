import { NextResponse } from 'next/server';
import { currentOwner } from '@/lib/auth/owner';
import { createAdminClient } from '@/lib/supabase/admin';
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; documentId: string }> },
) {
  const { userId, supabase } = await currentOwner();
  if (!userId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { id, documentId } = await context.params;
  const { data: document } = await supabase
    .from('documents')
    .select('id,storage_path')
    .eq('id', documentId)
    .eq('bot_id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (!document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  const admin = createAdminClient();
  // Hide the document from retrieval before removing its contents.
  const hidden = await admin
    .from('documents')
    .update({
      status: 'failed',
      error_message: 'Deletion in progress. Retry delete if interrupted.',
    })
    .eq('id', documentId);
  if (hidden.error)
    return NextResponse.json({ error: 'Could not delete document.' }, { status: 500 });
  if (document.storage_path) {
    const removed = await admin.storage.from('knowledge-files').remove([document.storage_path]);
    if (removed.error)
      return NextResponse.json({ error: 'Could not remove file. Retry delete.' }, { status: 500 });
  }
  const chunks = await admin.from('document_chunks').delete().eq('document_id', documentId);
  if (chunks.error)
    return NextResponse.json(
      { error: 'Could not remove document knowledge. Retry delete.' },
      { status: 500 },
    );
  const result = await admin.from('documents').delete().eq('id', documentId).eq('user_id', userId);
  return result.error
    ? NextResponse.json({ error: 'Could not remove document. Retry delete.' }, { status: 500 })
    : NextResponse.json({ deleted: true });
}
