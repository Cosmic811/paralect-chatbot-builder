'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { credentialsSchema } from '@/lib/auth/credentials';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    redirect(
      `/login?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? 'Invalid credentials.',
      )}`,
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(`/login?error=${encodeURIComponent('Invalid email or password.')}`);
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
