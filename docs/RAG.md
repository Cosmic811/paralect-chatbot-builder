# Knowledge pipeline

The complete product is documented in the root README. This note describes the knowledge workflow.

1. Authenticate the owner and verify bot ownership and document allowance.
2. Validate the file (TXT/PDF/DOCX, nonempty, maximum 5 MB).
3. Extract text; PDF parsing runs as an external Node package so its worker remains available in production builds.
4. Split into 1,200-character chunks with 200-character overlap; reject documents exceeding 200 chunks.
5. Generate and validate 1,024-dimensional embeddings in batches of 32, preserving provider indices.
6. Store the private original and metadata, insert chunks/embeddings and mark the document ready. Failed documents are excluded from answers.
7. Embed the current question and recent user questions, retrieve up to five relevant ready-document chunks, and generate an answer with recent conversation context.
8. Persist the ordered user/assistant message pair and return source document names in the owner playground.

When no usable evidence is found, the assistant returns `I don't know based on the uploaded knowledge.` The model is also instructed to use that fallback when retrieved text does not answer the question.

Old NULL embeddings from the initial prototype were backfilled without changing document text. Public chat uses the same pipeline with an opt-in Pro widget and signed visitor session; it never returns the original files or owner account details.
