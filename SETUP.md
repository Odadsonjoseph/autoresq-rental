# AutoresQ Rental - Database Setup

This file contains the SQL migrations that need to be applied to your Supabase project.

## How to Apply

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (epjfkpzjekhzlqazfasu)
3. Go to the SQL Editor
4. Copy and run each migration file in order:
   - 20260603000000_initial_schema.sql
   - 20260603010000_storage_and_contracts.sql (if exists)
   - 20260603020000_user_trigger.sql
   - 20260603030000_rls_policies.sql

## Or run via Supabase CLI

```bash
# Link your project
npx supabase link --project-ref epjfkpzjekhzlqazfasu

# Run migrations
npx supabase db push
```

## Environment Variables

Make sure these are set in your Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://epjfkpzjekhzlqazfasu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwamZrcHpqZWtoemxxYXpmYXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDM5MDcsImV4cCI6MjA5NjAxOTkwN30.GsM73wJYIwcxEcTdifz18dZ5QpT5YXnp1v211fJ1IM4
```
