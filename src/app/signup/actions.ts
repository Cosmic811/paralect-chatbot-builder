'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { credentialsSchema } from '@/lib/auth/credentials';
import { createClient } from '@/lib/supabase/server';

export async function signup(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    redirect(
      `/signup?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? 'Invalid credentials.',
      )}`,
    );
  }

  const supabase = await createClient();

  const requestHeaders = await headers();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    `${requestHeaders.get('x-forwarded-proto') || 'http'}://${requestHeaders.get('host')}`;
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.session) {
    redirect('/dashboard');
  }

  redirect(`/login?message=${encodeURIComponent('Check your email and confirm your account.')}`);
}
