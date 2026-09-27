import { createClient } from '@/lib/supabase/server';
export async function currentOwner() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub ?? null };
}
