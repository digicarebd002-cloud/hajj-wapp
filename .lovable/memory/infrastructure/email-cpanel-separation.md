---
name: VPS and cPanel are separate servers
description: VPS hosts Coolify+Supabase; email (info@hajj-wallet.com) is hosted on a completely different cPanel server. SMTP must connect from VPS to external cPanel.
type: constraint
---
- **VPS server**: Hosts Coolify, self-hosted Supabase, Edge Functions, app
- **cPanel server**: Completely separate machine, hosts email accounts including `info@hajj-wallet.com`
- SMTP from VPS must reach external cPanel mail server (not localhost)
- DNS: `mail.hajj-wallet.com` points to cPanel server IP (107.180.114.252)
- **Why:** User has repeatedly clarified this. Do NOT assume cPanel is on the same VPS or that it's a Coolify dashboard option.
- **How to apply:** When troubleshooting SMTP, treat cPanel as remote third-party. Hostname/port settings come from cPanel "Connect Devices" UI, not from VPS.
