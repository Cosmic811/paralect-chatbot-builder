# Paralect acceptance checklist

Source: https://www.paralect.com/academy/product-manager/projects/chatbot-builder

| Requirement                       | Implementation                                                      | Verification                                               |
| --------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| Company docs become a chatbot     | TXT/PDF/DOCX upload, chunking, embeddings, pgvector retrieval       | Real uploads and grounded answers                          |
| ChatGPT-like in-app conversation  | Playground, follow-ups, saved chat history, new chat, sources       | API and browser walkthrough                                |
| Website widget                    | `/embed.js`, public chat iframe, opt-in publication, greeting/color | Anonymous question, signed session, sample host page       |
| Pricing and gated features        | Starter/Pro plans, bot/document/message limits, Pro widget          | Quota and gating tests                                     |
| Billing flow; mock allowed        | Explicit demo checkout, persisted plan and receipts, downgrade      | Upgrade, duplicate submission, downgrade and paused widget |
| Landing with features and pricing | Home page with product preview, use cases, prices, FAQ and CTAs     | Desktop/mobile review                                      |
| Demo presentation                 | Written tutorial with screenshots                                   | `docs/DEMO.md`                                             |
| Functioning focused MVP           | Owner access, errors, deletion, settings, mobile widget             | Build, lint, unit tests and live acceptance checks         |

Deployment target: Render Node Web Service. The hosted URL and deployment status are recorded in the final handover after deployment verification; configuration files alone are not evidence of a live deployment.
