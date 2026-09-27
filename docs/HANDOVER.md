# Verified deployment

- Application: https://paralect-chatbot-builder.onrender.com
- Written walkthrough: https://paralect-chatbot-builder.onrender.com/guide/index.html
- Source: https://github.com/Cosmic811/paralect-chatbot-builder (private repository)
- Render: Free Node web service, Frankfurt, main branch; health endpoint `/api/health`.
- Verified 27 September 2026: new-account signup in the browser, authenticated grounded answers and sources, owner history, public visitor questions and signed history, PDF/DOCX ingestion and deletion on Render. TXT ingestion and full bot/document deletion passed locally; 20 automated tests, lint, production builds and GitHub Actions passed.
- The embedded launcher opens on a separate-origin sample website. Browser automation could not click inside its iframe; the identical public chat UI submitted successfully on its standalone page, and its HTTP API passed real visitor checks.
- Payments are explicitly simulated. Render Free can take 50 seconds or more to wake after inactivity. Scanned PDFs require OCR outside this MVP.
- Credentials are configured only in the Render environment and local ignored settings, not in source control.