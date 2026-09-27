import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function getExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');

  if (dotIndex === -1) {
    return '';
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
}

export async function extractTextFromFile(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
): Promise<string> {
  const extension = getExtension(fileName);

  if (mimeType === 'text/plain' || extension === 'txt') {
    return buffer.toString('utf8');
  }

  if (mimeType === DOCX_MIME || extension === 'docx') {
    const result = await mammoth.extractRawText({
      buffer,
    });

    return result.value;
  }

  if (mimeType === PDF_MIME || extension === 'pdf') {
    const parser = new PDFParse({
      data: buffer,
    });

    try {
      const result = await parser.getText();

      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  throw new Error('Unsupported file type. Use TXT, PDF or DOCX.');
}
