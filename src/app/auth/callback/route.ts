import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL('/dashboard', origin));
  }
  return NextResponse.redirect(
    new URL(
      '/login?message=Please%20sign%20in.%20If%20your%20confirmation%20link%20expired%2C%20request%20a%20new%20one.',
      origin,
    ),
  );
}
