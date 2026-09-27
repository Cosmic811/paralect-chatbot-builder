import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { currentOwner } from '@/lib/auth/owner';
import { getAccount } from '@/lib/billing/account';
import { createAdminClient } from '@/lib/supabase/admin';
const schema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300),
  systemPrompt: z.string().trim().min(1).max(3000),
});
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { userId, supabase } = await currentOwner();
  if (!userId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { id } = await context.params;
  const { data: bot } = await supabase
    .from('bots')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (!bot) return NextResponse.json({ error: 'Chatbot not found.' }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Check the name, description and instructions.' },
      { status: 400 },
    );
  const { error } = await supabase
    .from('bots')
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      system_prompt: parsed.data.systemPrompt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);
  return error
    ? NextResponse.json({ error: 'Could not save settings.' }, { status: 500 })
    : NextResponse.json({ saved: true });
}
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { userId, supabase } = await currentOwner();
  if (!userId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { id } = await context.params;
  const { data: bot } = await supabase
    .from('bots')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (!bot) return NextResponse.json({ error: 'Chatbot not found.' }, { status: 404 });
  const parsed = z
    .object({
      enabled: z.boolean(),
      welcome: z.string().trim().min(1).max(200),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Check widget settings.' }, { status: 400 });
  const account = await getAccount(userId);
  if (parsed.data.enabled && !account.plan.embed)
    return NextResponse.json({ error: 'Website widgets are included in Pro.' }, { status: 403 });
  const widgets = account.metadata.widgets ?? {};
  const { error } = await createAdminClient().auth.admin.updateUserById(userId, {
    app_metadata: { ...account.metadata, widgets: { ...widgets, [id]: parsed.data } },
  });
  return error
    ? NextResponse.json({ error: 'Could not save widget.' }, { status: 500 })
    : NextResponse.json({ saved: true });
}
