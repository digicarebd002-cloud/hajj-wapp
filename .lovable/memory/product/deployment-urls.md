---
name: Deployment URLs
description: Production hosting URLs for Hajj Wallet — current and planned
type: reference
---
- **Current production:** https://digitechbd.shop/ (Lovable hosting)
- **Lovable preview:** https://hajj-wapp.lovable.app
- **Planned future production:** https://hajj-wallet.com/ — user will migrate to cPanel file manager hosting later
- **Auth allow list** (GOTRUE_URI_ALLOW_LIST + ADDITIONAL_REDIRECT_URLS) on self-hosted Supabase already includes both `digitechbd.shop` AND `hajj-wallet.com` (with www variants) so migration only requires changing GOTRUE_SITE_URL to the new primary domain
- **GOTRUE_SITE_URL:** currently `https://digitechbd.shop` — change to `https://hajj-wallet.com` after cPanel migration
