# Knowledge AI

Paralect **Embeddable Chatbot Builder** MVP: company documents become a grounded assistant in an owner workspace and a public website widget.

Live application: https://paralect-chatbot-builder.onrender.com

Public walkthrough: https://paralect-chatbot-builder.onrender.com/guide/index.html

## Implemented scope

- Product landing page, pricing, onboarding and Supabase email/password authentication.
- Multiple owner-scoped bots; editable name, description and assistant instructions.
- TXT, text-layer PDF and DOCX uploads, maximum 5 MB and 200 chunks per document. Private storage, parsing, Mistral embeddings and vector retrieval. Remove outdated documents without retaining searchable chunks.
- Chat with grounded answers, source document names, follow-up context, stored conversations and history restoration.
- Starter: 1 bot, 10 documents, 100 messages per calendar month. Pro: 5 bots, 100 documents, 2,000 messages and website embedding. Limits count the whole workspace and are checked on the server.
- Explicit simulated checkout, persistent plan state, simulated invoice history and downgrade handling. No card data or real payments.
- Opt-in public widget with configurable greeting/accent, signed visitor sessions, saved visitor history, mobile layout and copyable embed script. Unpublished bots remain private. Downgrading stops public chat immediately.
- Bot/document deletion, loading/error/empty states, accessibility labels, source data isolation and Render deployment configuration.

## Run locally

Node 24 is the verified runtime.

```sh
npm ci
```

Copy `.env.example` to `.env.local` and configure the Supabase/Mistral credentials. The `NEXT_PUBLIC_*` Supabase key must be the public publishable key; the Supabase secret and Mistral key stay server-side.

For a fresh Supabase project, apply `supabase/schema.sql` in its SQL editor. Existing development data has already been configured; do not reset the database. In Supabase Authentication → URL Configuration, allow `http://localhost:3000/auth/callback` for local email confirmation and the deployed `/auth/callback` URL for hosted use. If confirmation is enabled, users must confirm email before signing in.

```sh
npm run dev
```

Open `http://localhost:3000`. The app derives embed URLs from its current origin, or uses `NEXT_PUBLIC_APP_URL` when configured.

## Quality checks

```sh
npm test
npm run lint
npm run build
npm start
```

Unit tests cover embedding order/validation, signed visitor sessions, rate limiting, mock checkout/idempotency, downgrade protection, grounding/fallback, follow-up history, owner isolation, persistence errors and message limits. Live acceptance checks additionally exercised real Mistral/Supabase calls and server-enforced quotas. Synthetic test accounts and documents are removed after verification.

## Render deployment

`render.yaml` defines a free **Node Web Service**, not a static site. Connect this repository to Render. Build: `npm ci && npm run build`. Start: `npm run start -- --hostname 0.0.0.0 --port $PORT`. Health check: `/api/health`. Set the variables from `.env.example` in Render’s secret environment settings; never commit `.env.local`. After the URL is assigned, set the Supabase site/redirect URLs and optionally `NEXT_PUBLIC_APP_URL`.

The free instance can sleep when inactive, so the first visit may take time. The app stores its persistent data in Supabase rather than the Render filesystem. A Dockerfile is provided as an alternative deployment path.

## Architecture and boundaries

Next.js App Router with React, Tailwind, Supabase Auth/Postgres/Storage/pgvector, and Mistral. Embeddings use `mistral-embed` (1024 dimensions). The chat model is selected by `MISTRAL_CHAT_MODEL`; the development key was verified with `ministral-14b-latest` after `mistral-small-latest` returned a zero request quota.

Owner actions validate authentication and bot ownership before privileged work. Direct database reads are isolated by RLS. Widget requests require an explicitly published Pro bot; a signed, expiring token binds visitors to one bot/conversation. Plan and widget state are stored in server-controlled Supabase `app_metadata`, not editable user metadata. Monthly message usage includes owner and visitor messages.

This is a single-instance evaluation MVP. Rate limits and the per-account chat concurrency guard are in-process; a multi-instance deployment should move them to shared storage. Usage checks for uploads/bot creation are read-before-write, so strict distributed quota accounting requires a transactional database reservation. Large ingestion runs synchronously; the 200-chunk cap bounds work, but background jobs are the next step for higher volumes. PDF OCR is outside scope. AI answers still require human verification. Demo billing intentionally has no payment provider or automatic real renewals.

Deleting a document removes its source file/chunks; text already saved in conversations is retained until that bot is deleted. Export or review important data before deletion. Public widgets can reveal facts from published knowledge, so only publish documents intended for website visitors.

## Submission

See `docs/DEMO.md` for the screenshot walkthrough and `docs/ACCEPTANCE.md` for the requirement-to-feature checklist. The landing page and in-app Privacy & demo terms page explain the product and simulation boundaries.
