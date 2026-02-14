# Supabase Setup Guide for Gravity Planner

## 🎯 Overview

This guide will help you integrate your self-hosted Supabase instance with Gravity Planner.

**Your Supabase Instance:** `http://193.122.151.142:8000`

---

## 📋 Prerequisites

- ✅ Supabase running on Docker at `http://193.122.151.142:8000`
- ✅ Access to Supabase Studio (Dashboard)
- ✅ Node.js project (Gravity Planner)

---

## Step 1: Access Supabase Studio

1. Open your browser and navigate to:
   ```
   http://193.122.151.142:8000
   ```

2. Login with your Supabase credentials

3. You should see the Supabase Dashboard

---

## Step 2: Get Your Supabase Credentials

### 2.1 Find Your Project URL and Keys

1. In Supabase Studio, go to **Settings** → **API**
2. Copy the following values:

```env
VITE_SUPABASE_URL=http://193.122.151.142:8000
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2.2 Create `.env` File

Create a file named `.env` in your project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=http://193.122.151.142:8000
VITE_SUPABASE_ANON_KEY=your-anon-key-from-dashboard
```

⚠️ **Important:** Add `.env` to your `.gitignore` file!

---

## Step 3: Install Supabase Client

Run this command in your project directory:

```bash
npm install @supabase/supabase-js
```

---

## Step 4: Create Database Schema

### 4.1 Access SQL Editor

1. In Supabase Studio, go to **SQL Editor**
2. Click **New Query**

### 4.2 Run Schema Creation Script

Copy and paste this SQL script:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create planner_members table
CREATE TABLE planner_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('me', 'child', 'spouse', 'other')),
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create planner_activities table
CREATE TABLE planner_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES planner_members(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('activity', 'note', 'reminder')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  context TEXT CHECK (context IN ('personal', 'official')),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create planner_categories table
CREATE TABLE planner_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Create planner_goals table
CREATE TABLE planner_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES planner_members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  target_hours NUMERIC NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create planner_settings table
CREATE TABLE planner_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT CHECK (theme IN ('dark', 'light', 'midnight', 'paper')),
  current_member_id UUID,
  active_sessions JSONB DEFAULT '{}'::jsonb,
  session_requirements JSONB DEFAULT '{}'::jsonb,
  acknowledged_reminders JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_planner_activities_user_id ON planner_activities(user_id);
CREATE INDEX idx_planner_activities_start_time ON planner_activities(start_time);
CREATE INDEX idx_planner_members_user_id ON planner_members(user_id);
CREATE INDEX idx_planner_categories_user_id ON planner_categories(user_id);
CREATE INDEX idx_planner_goals_user_id ON planner_goals(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE planner_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- planner_members policies
CREATE POLICY "Users can view their own members"
  ON planner_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own members"
  ON planner_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own members"
  ON planner_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own members"
  ON planner_members FOR DELETE
  USING (auth.uid() = user_id);

-- planner_activities policies
CREATE POLICY "Users can view their own activities"
  ON planner_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON planner_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON planner_activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
  ON planner_activities FOR DELETE
  USING (auth.uid() = user_id);

-- planner_categories policies
CREATE POLICY "Users can view their own categories"
  ON planner_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON planner_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON planner_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON planner_categories FOR DELETE
  USING (auth.uid() = user_id);

-- planner_goals policies
CREATE POLICY "Users can view their own goals"
  ON planner_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON planner_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON planner_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON planner_goals FOR DELETE
  USING (auth.uid() = user_id);

-- planner_settings policies
CREATE POLICY "Users can view their own settings"
  ON planner_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON planner_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON planner_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
  ON planner_settings FOR DELETE
  USING (auth.uid() = user_id);
```

3. Click **Run** to execute the script
4. Verify all tables were created successfully

---

## Step 5: Configure Authentication

### 5.1 Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional)

### 5.2 (Optional) Enable Google OAuth

1. Go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials

---

## Step 6: Test Database Connection

1. Go to **Table Editor** in Supabase Studio
2. You should see all your tables:
   - `planner_members`
   - `planner_activities`
   - `planner_categories`
   - `planner_goals`
   - `planner_settings`

---

## Next Steps

✅ Database schema created  
✅ RLS policies configured  
✅ Authentication enabled  

**Continue to:** `SUPABASE_INTEGRATION.md` for code implementation

---

## Troubleshooting

### Can't access Supabase Studio?
- Check if Docker containers are running
- Verify port 8000 is not blocked by firewall
- Try accessing from the server: `curl http://localhost:8000`

### Tables not created?
- Check SQL Editor for error messages
- Ensure UUID extension is enabled
- Verify you have admin permissions

### RLS policies blocking access?
- Ensure user is authenticated
- Check `auth.uid()` matches `user_id` in tables
- Temporarily disable RLS for testing (not recommended for production)

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use HTTPS in production** - Set up SSL/TLS
3. **Keep RLS enabled** - Protects user data
4. **Rotate keys regularly** - Update anon key periodically
5. **Backup database** - Set up automated backups

---

## Support

For issues specific to:
- **Supabase Setup:** Check [Supabase Docs](https://supabase.com/docs)
- **Gravity Planner:** See `SUPABASE_INTEGRATION.md`
