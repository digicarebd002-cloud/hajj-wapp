

# Wallet Page -- Public Landing for Non-Logged-In Users

## Overview
Transform the Wallet page so that unauthenticated visitors see a beautiful, informative landing experience with 4 sections (in English), followed by a CTA to sign up. Logged-in users continue to see the existing wallet dashboard.

## Architecture
- Remove the `<RequireAuth>` wrapper from the Wallet page
- Add a conditional: if `user` exists, show `<WalletContent />`; otherwise, show `<WalletPublicLanding />`
- All 4 public sections are static (no database queries needed)

---

## Section 1: Hajj Savings Calculator (Interactive)
- User inputs their **savings goal** (default $5,000) and **weekly contribution** ($25-$500 slider)
- Instantly calculates: weeks to goal, estimated completion date
- Animated progress bar preview showing projected savings timeline
- CTA button: "Start Saving Now" (links to `/auth`)

## Section 2: How It Works (3-4 Steps)
- Step-by-step cards with icons:
  1. **Sign Up** -- Create your free account in seconds
  2. **Set Your Goal** -- Choose your Hajj savings target
  3. **Contribute Regularly** -- Add funds weekly or monthly
  4. **Achieve Your Dream** -- Reach your goal and go for Hajj
- Each step has an icon, title, and short description
- Staggered animation on scroll

## Section 3: Community Stats and Success Stories
- Show live stats from the database: total members, total savings goals set, total contributions made
- 2-3 hardcoded testimonial/success story cards with quotes (placeholder data since no testimonials table exists)
- Stats fetched via public-safe count queries (profiles count, wallets count)

## Section 4: Membership Tiers and Benefits
- 3 cards for Silver, Gold, Platinum tiers
- Each card lists tier benefits (points thresholds, perks)
- Visual hierarchy: Silver (basic), Gold (highlighted), Platinum (premium glow)
- CTA: "Join Now" button linking to `/auth`

---

## Technical Details

### Files Modified
- **`src/pages/Wallet.tsx`**: Main changes
  - Remove `<RequireAuth>` wrapper
  - Add auth check: show `WalletPublicLanding` or `WalletContent`
  - Create `WalletPublicLanding` component with all 4 sections
  - Calculator uses local React state only (no DB)
  - Community stats section fetches public counts (profiles, wallets tables allow admin select only, so we'll use static/estimated numbers or make a simple edge function)

### Stats Data Approach
- Since profiles/wallets tables have RLS restricting to own user or admin, the community stats will use **static placeholder numbers** that can be updated later, or we can reuse the existing `useCommunityStats` hook which already queries discussions/replies/profiles counts (profiles SELECT requires auth though).
- Best approach: use hardcoded impressive numbers for the public view, keeping it simple.

### Animations
- Framer Motion stagger animations for each section
- Scroll-triggered reveals using the existing `use-scroll-reveal` hook
- Calculator slider/progress bar animations

### No Database Changes Required
All content is static or computed client-side. No new tables, RLS policies, or migrations needed.
