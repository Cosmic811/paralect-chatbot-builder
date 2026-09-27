import { getMistralClient } from './client';

const EMBEDDING_MODEL = 'mistral-embed';
const BATCH_SIZE = 32;
const DIMENSIONS = 1024;

export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const mistral = getMistralClient();
  const embeddings: number[][] = [];
  for (let offset = 0; offset < texts.length; offset += BATCH_SIZE) {
    const batch = texts.slice(offset, offset + BATCH_SIZE);
    const response = await mistral.embeddings.create({ model: EMBEDDING_MODEL, inputs: batch });
    if (response.data.length !== batch.length)
      throw new Error('Embedding provider returned an incomplete response.');
    const ordered: (number[] | undefined)[] = new Array(batch.length);
    const hasIndices = response.data.some((item) => item.index != null);
    for (const [position, item] of response.data.entries()) {
      const index = hasIndices ? item.index : position;
      if (
        typeof index !== 'number' ||
        !Number.isInteger(index) ||
        index < 0 ||
        index >= batch.length ||
        ordered[index]
      ) {
        throw new Error('Embedding provider returned invalid indices.');
      }
      if (
        !item.embedding ||
        item.embedding.length !== DIMENSIONS ||
        !item.embedding.every(Number.isFinite)
      ) {
        throw new Error('Embedding provider returned an invalid embedding.');
      }
      ordered[index] = item.embedding;
    }
    for (let index = 0; index < batch.length; index += 1) {
      const embedding = ordered[index];
      if (!embedding) throw new Error('Embedding provider returned an incomplete response.');
      embeddings.push(embedding);
    }
  }
  return embeddings;
}
