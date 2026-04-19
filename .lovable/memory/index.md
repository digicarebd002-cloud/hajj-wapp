1: # Memory: index.md
2: Updated: now
3: 
4: # Project Memory
5: 
6: ## Core
7: Strictly English UI only. All content and notifications must be in English.
8: Strict light theme for users: bg HSL 140 24% 94.5%, surfaces tinted green HSL 140 15% 99%. No user dark mode.
9: Self-hosted Supabase (Coolify) + Edge Functions (Deno centralized router). PayPal is the primary payment method.
10: $15/month mandatory PayPal subscription gates Wallet, Account, and Bookings functionality.
11: Framer Motion for transitions and glassmorphism. Lucide icons only (no emojis).
12: Primary Admin: digicarebd002@gmail.com. Admin panel supports light/dark toggle.
13: Mobile app uses Capacitor. Run cap/gradle from root. Remove 'server' prop in capacitor.config.ts for production.
14: VPS (Coolify+Supabase) and cPanel (email host for info@hajj-wallet.com) are SEPARATE servers. Never assume cPanel is on VPS.
15: 
16: ## Memories
17: - [VPS SSH Access](mem://infrastructure/vps-ssh-access) — SSH root@76.13.123.99 (Hostinger VPS hosting Coolify+Supabase)
- [VPS/cPanel Separation](mem://infrastructure/email-cpanel-separation) — VPS and cPanel are different servers; SMTP is external relay
18: - [Core Functionality](mem://product/core-functionality) — Overview of Hajj Wallet features (wallet, store, forum, booking)
19: - [Deployment URLs](mem://product/deployment-urls) — Production web at https://digitechbd.shop/
20: - [Backend Architecture](mem://tech-stack/backend) — Self-hosted Supabase, Deno Edge Functions router
21: - [Backend Connection](mem://tech-stack/backend-connection) — Supabase URL proxy configuration and Cloudflare DNS settings
22: - [Supabase Dashboard Credentials](mem://infrastructure/supabase-dashboard) — Access details for self-hosted Supabase Studio
23: - [Edge Functions Setup](mem://infrastructure/coolify/edge-functions-setup) — Central router path and port config for Edge Functions
24: - [Coolify Ingress Constraints](mem://infrastructure/coolify/ingress-constraints) — Port binding constraints for reverse proxies on VPS
25: - [Authentication Gate](mem://ui-patterns/authentication-gate) — Rules for unauthenticated vs authenticated access
26: - [Authentication Flow](mem://features/authentication-flow) — Registration, mandatory subscription, and edge function email auto-confirm
27: - [Email Auto-Confirmation](mem://tech-stack/authentication-configuration) — Double-layer approach using Service Role key
28: - [OAuth Status](mem://features/authentication/oauth-self-hosted-status) — Google and Apple OAuth hidden due to self-hosted constraints
29: - [Primary Admin Account](mem://admin/primary-account) — Main admin user email details
30: - [Admin Authentication](mem://admin/authentication-and-security) — Admin login route and role requirements
31: - [Admin Panel Features](mem://features/admin-panel) — Dashboard styling, modules, and CSV export functionality
32: - [Admin Theme Preference](mem://admin/theme-preference) — System-aware light/dark toggle and primary green brand color
33: - [Admin Password Reset](mem://architecture/admin/password-reset) — Manual override via Edge Function (Service Role)
34: - [Wallet Features](mem://features/wallet) — Wallet UI, Subscription Gate, real-time balance updates
35: - [Wallet Logic Constraints](mem://architecture/database/wallet-logic) — Triggers for transaction bounds ($0-$10k) and zero-balance protection
36: - [Store Layout](mem://features/store) — Max 3 columns, varied horizontal padding, premium hover states
37: - [Product Detail Page](mem://features/product-detail-page) — Advanced image gallery, color swatches, real-time pricing
38: - [Checkout Flow](mem://features/store/checkout-flow) — PayPal/COD, 10% Gold/Platinum discount, cart clearing
39: - [Order Constraints](mem://architecture/database/order-constraints) — Strict order statuses (pending, paid, shipped, delivered, cancelled)
40: - [Package Bookings](mem://features/packages) — Essential/Premium pricing and flexible installment payment plans
41: - [PayPal Integration](mem://features/payments/paypal-integration) — PayPal Edge Function handling, JWT verification disabled
42: - [PayPal Subscriptions](mem://tech-stack/payments/paypal-subscriptions) — Recurring payments webhook handling via Edge Function
43: - [Community Forum](mem://features/community) — Unanswered filter logic, reply minimums, point rewards system
44: - [Community Best Answer](mem://features/community/best-answer-logic) — Original author permissions and +25 point reward
45: - [Points and Tiers](mem://features/points-and-tiers) — Silver, Gold, Platinum definitions and visual treatments
46: - [Tier Celebration](mem://features/gamification/tier-celebration) — Tier Watch hook triggering full-screen confetti modal
47: - [Sponsorship Program](mem://features/sponsorship-program) — Eligibility rules and Zod-validated application form
48: - [Account Dashboard](mem://features/account) — Interactive tabs, client-side CSV exports, tier progress
49: - [Database Security](mem://architecture/database/security) — RLS enforcement and public SELECT restrictions
50: - [Global Navigation](mem://ui-patterns/global-navigation) — Sticky nav, active state styling, removed ⌘K search
51: - [Global Footer](mem://ui-patterns/global-footer) — Deep dark teal background, vertical stacking on mobile
52: - [Theme Colors](mem://design/visual-style/theme-colors) — Detailed HSL color values for the strict light theme
53: - [Background Pattern](mem://design/visual-style/background-pattern) — AnimatedDots.tsx dot grid pattern specifics
54: - [Premium Styling Details](mem://design/premium-styling-details) — Framer Motion animation variants (fadeUp, staggerContainer)
55: - [Visual Style Components](mem://design/component-standards/visual-style) — Strong borders, solid backgrounds, no blends
56: - [Button Standards](mem://design/component-standards/buttons) — Sizing (h-10 to h-14), btn-glow effect, hover scaling
57: - [Typography and Legibility](mem://design/typography-and-legibility) — Bold font weights, darkened foreground text
58: - [Brand Identity](mem://design/brand/identity) — Icon-only logo sizing, object-contain, no rounded corners
59: - [Iconography Standard](mem://design/iconography-standard) — Lucide icons replacing emojis and mock illustrations
60: - [Language Requirement](mem://constraints/language-requirement) — Strictly English interface constraints
61: - [Email Notifications](mem://constraints/email-notifications) — Custom domain requirement for transactional emails
62: - [Hero Video Optimization](mem://performance/hero-video-optimization) — High-priority preloading strategy for hero video
63: - [Animation Library](mem://tech-stack/animation-library) — Framer-motion usage for transitions and micro-interactions
64: - [PWA Implementation](mem://tech-stack/pwa-implementation) — Service worker unregistration in iframes/development
65: - [Mobile Configuration](mem://tech-stack/mobile/configuration) — Capacitor settings, User-Agent string, safe-area-inset
66: - [Mobile Android Build](mem://tech-stack/mobile/android-build-process) — Signed AABs via Android Studio, cap commands from root
67: - [Mobile Native Strategy](mem://tech-stack/mobile/native-strategy) — IAP requirement for digital goods, capacitor.config server setup
