
# LizExpress

**LizExpress Ltd** is pioneering a modern barter system platform that allows users
to trade goods and services online without needing cash transactions. This
innovative approach aims to create a sustainable and community-driven
marketplace, fostering economic resilience and resource sharing. The platform is
designed to simplify barter transactions, making it accessible and efficient for
users to exchange value seamlessly.
---

## 🚀 Current Status

### ✅ Implemented Features

- **User Profiles**
  - Custom user data extending Supabase's `auth.users`
  - Includes personal details and verification status

- **Item Listings**
  - Users can list items with images, categories, conditions, prices, etc.
  - Items support active/inactive status
  - Receipt image support included

- **Chat System**
  - One-on-one chat between users over items
  - Separate threads and messages table

- **Favorites**
  - Wishlist functionality for users to favourite items

- **Notifications**
  - System and personal notifications with read/unread tracking

- **Security**
  - Row-Level Security (RLS) is enabled for all tables
  - Policies for authenticated user access and actions
  - Indexes created for performance optimisation

---

## 🧩 Database Schema

Located in:
```
/supabase/migrations/20250512102628_black_island.sql
```

Tables:
- `users`
- `items`
- `chats`
- `messages`
- `favourites`
- `notifications`

Security: Enabled RLS with defined access policies per table.

---

## 📦 Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Next.js /Supabase (PostgreSQL)
- **Database Migration**: SQL schema files
- **Version Control**: Git

> Maintained by Charles5247 & contributors.
