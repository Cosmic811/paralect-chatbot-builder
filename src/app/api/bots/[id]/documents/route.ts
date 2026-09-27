import { NextResponse, type NextRequest } from 'next/server';

import { chunkText } from '@/lib/documents/chunk-text';
import { extractTextFromFile } from '@/lib/documents/extract-text';
import { createEmbeddings } from '@/lib/mistral/embeddings';
import { providerError } from '@/lib/mistral/provider-error';
import { getAccount, getUsage } from '@/lib/billing/account';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const MIME_TYPES = {
  txt: 'text/plain',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

type SupportedExtension = keyof typeof MIME_TYPES;

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');

  if (dotIndex === -1) {
    return '';
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
}

function isSupportedExtension(extension: string): extension is SupportedExtension {
  return extension === 'txt' || extension === 'pdf' || extension === 'docx';
}

function safeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: botId } = await context.params;

  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return NextResponse.json(
      {
        error: 'Unauthorized.',
      },
      {
        status: 401,
      },
    );
  }

  const { data: bot, error: botError } = await supabase
    .from('bots')
    .select('id')
    .eq('id', botId)
    .eq('user_id', userId)
    .single();

  if (botError || !bot) {
    return NextResponse.json(
      {
        error: 'Chatbot not found.',
      },
      {
        status: 404,
      },
    );
  }

  let formData: FormData;
  const [account, usage] = await Promise.all([getAccount(userId), getUsage(userId)]);
  if (usage.documents >= account.plan.documents) {
    return NextResponse.json(
      { error: 'Document limit reached. Remove a document or upgrade in Billing.' },
      { status: 403 },
    );
  }

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        error: 'Invalid form data.',
      },
      {
        status: 400,
      },
    );
  }

  const uploadedFile = formData.get('file');

  if (!(uploadedFile instanceof File)) {
    return NextResponse.json(
      {
        error: 'File is required.',
      },
      {
        status: 400,
      },
    );
  }

  if (uploadedFile.size === 0) {
    return NextResponse.json(
      {
        error: 'File is empty.',
      },
      {
        status: 400,
      },
    );
  }

  if (uploadedFile.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error: 'File must be 5 MB or smaller.',
      },
      {
        status: 413,
      },
    );
  }

  const extension = getExtension(uploadedFile.name);

  if (!isSupportedExtension(extension)) {
    return NextResponse.json(
      {
        error: 'Only TXT, PDF and DOCX files are supported.',
      },
      {
        status: 415,
      },
    );
  }

  const mimeType = MIME_TYPES[extension];

  const arrayBuffer = await uploadedFile.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  let extractedText: string;

  try {
    extractedText = await extractTextFromFile(uploadedFile.name, mimeType, buffer);
  } catch (error) {
    console.error('Document parsing failed:', error);

    return NextResponse.json(
      {
        error: 'Could not read this document.',
      },
      {
        status: 422,
      },
    );
  }

  const chunks = chunkText(extractedText);

  if (chunks.length === 0) {
    return NextResponse.json(
      {
        error: 'The document contains no readable text.',
      },
      {
        status: 422,
      },
    );
  }

  let embeddings: number[][];
  if (chunks.length > 200) {
    return NextResponse.json(
      {
        error:
          'This document is too long to process in one upload. Split it into smaller documents.',
      },
      { status: 413 },
    );
  }

  try {
    embeddings = await createEmbeddings(chunks);
  } catch (error) {
    const failure = providerError(error, 'Could not generate document embeddings.');
    console.error('Embedding generation failed:', failure.status);

    return NextResponse.json(
      {
        error: failure.message,
      },
      {
        status: failure.status,
      },
    );
  }

  if (embeddings.length !== chunks.length) {
    return NextResponse.json(
      {
        error: 'Embedding response was incomplete.',
      },
      {
        status: 502,
      },
    );
  }

  for (let index = 0; index < embeddings.length; index += 1) {
    if (!embeddings[index] || embeddings[index].length === 0) {
      return NextResponse.json(
        {
          error: 'Embedding response was incomplete.',
        },
        {
          status: 502,
        },
      );
    }
  }

  const admin = createAdminClient();

  const documentId = crypto.randomUUID();

  const fileName = safeFileName(uploadedFile.name);

  const storagePath = `${userId}/${botId}/${documentId}-${fileName}`;

  const { error: storageError } = await admin.storage
    .from('knowledge-files')
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (storageError) {
    console.error('Storage upload failed:', storageError);

    return NextResponse.json(
      {
        error: 'Could not store the file.',
      },
      {
        status: 500,
      },
    );
  }

  const { data: document, error: documentError } = await admin
    .from('documents')
    .insert({
      id: documentId,
      bot_id: botId,
      user_id: userId,
      name: uploadedFile.name,
      storage_path: storagePath,
      mime_type: mimeType,
      size_bytes: uploadedFile.size,
      status: 'processing',
      error_message: null,
    })
    .select('id, name, status, created_at')
    .single();

  if (documentError || !document) {
    await admin.storage.from('knowledge-files').remove([storagePath]);

    console.error('Document insert failed:', documentError);

    return NextResponse.json(
      {
        error: 'Could not save document metadata.',
      },
      {
        status: 500,
      },
    );
  }

  const chunkRows = new Array(chunks.length);

  for (let index = 0; index < chunks.length; index += 1) {
    chunkRows[index] = {
      document_id: documentId,

      bot_id: botId,

      user_id: userId,

      content: chunks[index],

      chunk_index: index,

      embedding: embeddings[index],
    };
  }

  const { error: chunksError } = await admin.from('document_chunks').insert(chunkRows);

  if (chunksError) {
    console.error('Chunk insert failed:', chunksError);

    await admin
      .from('documents')
      .update({
        status: 'failed',
        error_message: 'Could not save document chunks.',
      })
      .eq('id', documentId);

    return NextResponse.json(
      {
        error: 'Could not process document.',
      },
      {
        status: 500,
      },
    );
  }

  const { error: readyError } = await admin
    .from('documents')
    .update({
      status: 'ready',
      error_message: null,
    })
    .eq('id', documentId);

  if (readyError) {
    await admin.from('document_chunks').delete().eq('document_id', documentId);
    await admin
      .from('documents')
      .update({ status: 'failed', error_message: 'Could not finalize document.' })
      .eq('id', documentId);
    console.error('Document status update failed:', readyError);

    return NextResponse.json(
      {
        error: 'Document was processed, but its status could not be updated.',
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json(
    {
      document: {
        ...document,
        status: 'ready',
      },

      chunksCount: chunks.length,
    },
    {
      status: 201,
    },
  );
}
