'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DocumentUploadProps {
  botId: string;
}

export function DocumentUpload({ botId }: DocumentUploadProps) {
  const router = useRouter();

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  async function uploadDocument(file: File) {
    setIsUploading(true);
    setMessage(null);

    if (file.size > 5 * 1024 * 1024 || file.size === 0) {
      setMessage('Choose a non-empty file up to 5 MB.');
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();

      formData.append('file', file);

      const response = await fetch(`/api/bots/${botId}/documents`, {
        method: 'POST',
        body: formData,
      });

      const rawBody = await response.text();

      let body: {
        error?: string;
        chunksCount?: number;
      } = {};

      if (rawBody) {
        try {
          body = JSON.parse(rawBody) as {
            error?: string;
            chunksCount?: number;
          };
        } catch {
          if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}.`);
          }

          throw new Error('Server returned an invalid response.');
        }
      }

      if (!response.ok) {
        throw new Error(body.error ?? `Upload failed with status ${response.status}.`);
      }

      setMessage('Document ready. You can now ask questions about it in the Playground.');

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div>
        <span className="text-xs font-medium tracking-[0.16em] text-zinc-500">KNOWLEDGE</span>

        <h3 className="mt-2 text-lg font-medium">Upload documents</h3>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          TXT, PDF or DOCX. Maximum file size is 5 MB.
        </p>
      </div>

      <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950 px-6 py-8 text-center transition hover:border-violet-500">
        <span className="text-sm font-medium">
          {isUploading ? 'Processing...' : 'Choose document'}
        </span>

        <span className="mt-1 text-xs text-zinc-500">TXT, PDF, DOCX</span>

        <input
          ref={inputRef}
          type="file"
          disabled={isUploading}
          accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              void uploadDocument(file);
            }
          }}
        />
      </label>

      {message && <p className="mt-4 text-sm text-zinc-300">{message}</p>}
    </div>
  );
}
