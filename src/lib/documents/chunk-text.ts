const DEFAULT_CHUNK_SIZE = 1200;
const DEFAULT_OVERLAP = 200;

function normalizeText(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function chunkText(
  source: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_OVERLAP,
): string[] {
  const text = normalizeText(source);

  if (!text) {
    return [];
  }

  if (overlap >= chunkSize) {
    throw new Error('Chunk overlap must be smaller than chunk size.');
  }

  const chunks: string[] = [];

  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    if (end < text.length) {
      const searchStart = Math.max(start + Math.floor(chunkSize * 0.6), start);

      const boundary = text.lastIndexOf(' ', end);

      if (boundary >= searchStart) {
        end = boundary;
      }
    }

    const chunk = text.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= text.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}
