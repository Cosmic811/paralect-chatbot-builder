export function providerError(error: unknown, fallback: string) {
  const status =
    error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : undefined;
  if (status === 429) {
    return {
      status: 429,
      message:
        'The AI provider rate limit was reached. Try again later or check the configured model limits in Mistral.',
    };
  }
  return { status: 502, message: fallback };
}
