---
name: Deployment URLs
description: Production hosting URLs for Hajj Wallet — current and planned
type: reference
---
- **Final production target:** https://hajj-wallet.com/ — will be hosted on cPanel file manager (user uploads built files manually)
- **Current temporary URL:** https://digitechbd.shop/ (Lovable hosting, used during development)
- **Lovable preview:** https://hajj-wapp.lovable.app
- **Auth config (GOTRUE on self-hosted Supabase):**
  - `GOTRUE_SITE_URL=https://hajj-wallet.com` (primary — used in email links)
  - `GOTRUE_URI_ALLOW_LIST` includes hajj-wallet.com, digitechbd.shop, hajj-wapp.lovable.app (all with /** wildcards)
  - `ADDITIONAL_REDIRECT_URLS` mirrors the allow list
- **Migration step:** When user uploads built `dist/` to cPanel at hajj-wallet.com, no auth config change is needed — already configured.
- **During development:** Reset/confirmation email links point to hajj-wallet.com. Test by checking the link URL in email; do NOT click since hajj-wallet.com is not live yet.
