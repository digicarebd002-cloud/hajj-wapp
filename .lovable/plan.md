

# Admin Panel Plan

## Overview
A full-featured admin dashboard accessible at `/admin` with a sidebar layout, covering management of all core entities: Users, Products, Packages, Orders, Bookings, Community (Discussions/Replies), Sponsorship, Wallet Transactions, and Notifications.

## Database Changes

### 1. User Roles Table
Create a `user_roles` table with RLS and a `has_role()` security definer function to safely check admin status without recursive policies.

```text
user_roles
-----------
id         uuid PK
user_id    uuid FK -> auth.users (cascade)
role       app_role enum ('admin', 'moderator', 'user')
UNIQUE(user_id, role)
```

### 2. RLS Policies for Admin Access
Add SELECT/UPDATE/DELETE policies on key tables (products, packages, package_features, profiles, discussions, replies, bookings, orders, etc.) allowing users with `has_role(auth.uid(), 'admin')` to perform all operations. Also add INSERT policies for products, packages, and package_features for admins.

### 3. Storage Bucket
Create a `product-images` storage bucket for product image uploads from the admin panel.

## Frontend Architecture

### Route & Layout
- New route: `/admin` with nested sub-routes (`/admin/users`, `/admin/products`, `/admin/packages`, `/admin/orders`, `/admin/bookings`, `/admin/community`, `/admin/sponsorship`, `/admin/notifications`)
- Sidebar layout using `SidebarProvider` + `Sidebar` component
- Admin guard component that checks `has_role` via an RPC call and redirects non-admins

### Admin Pages (8 sections)

#### 1. Dashboard (`/admin`)
- Summary cards: Total Users, Total Revenue (orders + bookings), Active Discussions, Products Count
- Recent activity feed

#### 2. Users (`/admin/users`)
- Table of all profiles with search/filter
- View/edit user details: name, email, phone, tier, points
- Adjust points manually (insert into points_ledger + update profile)
- Change user tier override

#### 3. Products (`/admin/products`)
- Table of all products with image thumbnails
- Create/Edit product form: name, price, category, description, image upload, is_limited, rating, reviews
- Manage variants (sizes/colors) inline
- Delete product

#### 4. Packages (`/admin/packages`)
- Table of all Hajj packages
- Create/Edit package form: name, price, duration, accommodation, meals, guide, departure, group_size, is_popular
- Manage package features (add/remove/reorder)
- Delete package

#### 5. Orders (`/admin/orders`)
- Table of all orders with user info, total, status
- View order items
- Update order status (pending/confirmed/shipped/delivered)

#### 6. Bookings (`/admin/bookings`)
- Table of all bookings with traveller info, package name, status
- Update booking status (pending/confirmed/cancelled)

#### 7. Community (`/admin/community`)
- Table of all discussions with author, category, views, replies count
- Delete inappropriate discussions
- View/delete replies
- Mark best answers

#### 8. Notifications (`/admin/notifications`)
- Send broadcast notifications to all users or specific tiers
- View recent notifications sent

## File Structure

```text
src/
  pages/
    admin/
      AdminLayout.tsx        -- Sidebar + outlet wrapper with admin guard
      AdminDashboard.tsx     -- Overview cards + stats
      AdminUsers.tsx         -- User management table
      AdminProducts.tsx      -- Product CRUD
      AdminPackages.tsx      -- Package CRUD
      AdminOrders.tsx        -- Order management
      AdminBookings.tsx      -- Booking management
      AdminCommunity.tsx     -- Discussion/reply moderation
      AdminNotifications.tsx -- Broadcast notifications
  hooks/
    use-admin.ts             -- useIsAdmin hook + admin data fetching hooks
```

## Technical Details

### Admin Check Hook (`use-admin.ts`)
- Calls `has_role` RPC function on mount
- Returns `{ isAdmin, loading }` 
- AdminLayout redirects to `/` if not admin

### Admin Data Hooks
- Use direct Supabase queries with admin RLS policies (admin can SELECT all rows)
- Pagination with `.range()` for large tables

### Product Image Upload
- Upload to `product-images` bucket
- Get public URL and store in `products.image_url`

### Styling
- Consistent with existing dark teal + gold theme
- Uses existing shadcn components (Table, Card, Dialog, Input, Select, Badge, Tabs)
- Responsive sidebar that collapses on mobile

## Implementation Order
1. Database migration (roles table, has_role function, admin RLS policies, storage bucket)
2. `use-admin.ts` hook
3. `AdminLayout.tsx` with sidebar and route guard
4. Dashboard page
5. Users management
6. Products management (with image upload)
7. Packages management
8. Orders + Bookings management
9. Community moderation
10. Notifications broadcast
11. Add routes to `App.tsx`

