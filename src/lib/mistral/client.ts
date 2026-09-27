import { Mistral } from '@mistralai/mistralai';

let mistralClient: Mistral | null = null;

export function getMistralClient(): Mistral {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY is not configured.');
  }

  if (!mistralClient) {
    mistralClient = new Mistral({
      apiKey,
      timeoutMs: 45000,
    });
  }

  return mistralClient;
}
