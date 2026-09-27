# Render handover

1. Connect the private repository `Cosmic811/paralect-chatbot-builder` to a Render **Web Service**.
2. Select Node, the `main` branch and the Free instance. Use `npm ci && npm run build` and `npm run start -- --hostname 0.0.0.0 --port $PORT`.
3. Add the six credentials/settings in `.env.example`: both Supabase URLs, the public publishable key, the server secret key, the Mistral API key and `MISTRAL_CHAT_MODEL`. Set `NODE_VERSION=24.18.0` and `NEXT_TELEMETRY_DISABLED=1`. Keys belong in Render Environment, never source control.
4. Set `/api/health` as the health-check path.
5. After Render assigns the URL, add that origin as Supabase Authentication’s Site URL and add its `/auth/callback` path to Redirect URLs. Keep localhost callbacks if local development is still needed. Set `NEXT_PUBLIC_APP_URL` to the production origin if the proxy origin is not detected correctly.
6. Verify the public landing, authentication, file upload and chat. Use an intentionally published test assistant to verify `/widget-demo/{publicId}` and copy the embed code from the deployed site.

Render Free sleeps when idle. A cold start is expected; production traffic may need a paid instance, but this project does not authorize paid upgrades automatically.

References: [Next.js on Render](https://render.com/docs/deploy-nextjs-app), [Render web services](https://render.com/docs/web-services).
