# Gravity Planner - Supabase Integration

## 📚 Documentation Files

This directory contains all the documentation you need to integrate Supabase with Gravity Planner.

### Setup Guides (Read in Order)

1. **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**
   - Database schema creation
   - Row Level Security (RLS) policies
   - Authentication configuration
   - Initial Supabase setup

2. **[SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md)**
   - Install Supabase client
   - Create SupabaseContext
   - Create DatabaseService layer
   - Update PlannerContext
   - Add authentication components

3. **[SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md)**
   - Export data from Google Drive
   - Run migration script
   - Verify data integrity
   - Rollback plan

### Configuration Files

- **[.env.example](./.env.example)** - Environment variable template
- Copy to `.env` and fill in your Supabase credentials

---

## 🚀 Quick Start

### 1. Get Supabase Credentials

```bash
# Access Supabase Studio
http://193.122.151.142:8000

# Go to: Settings → API
# Copy: URL and anon/public key
```

### 2. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit .env and add your credentials
VITE_SUPABASE_URL=http://193.122.151.142:8000
VITE_SUPABASE_ANON_KEY=your-actual-key-here
```

### 3. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 4. Create Database Schema

Follow instructions in `SUPABASE_SETUP.md` to run the SQL schema script.

### 5. Integrate with App

Follow instructions in `SUPABASE_INTEGRATION.md` to:
- Create Supabase client
- Add SupabaseContext
- Create DatabaseService
- Update PlannerContext

### 6. Migrate Data

Follow instructions in `SUPABASE_MIGRATION.md` to migrate your existing data.

---

## 📁 Project Structure After Integration

```
selfdev/
├── .env                          # Your Supabase credentials (gitignored)
├── .env.example                  # Template for .env
├── SUPABASE_SETUP.md            # Database setup guide
├── SUPABASE_INTEGRATION.md      # Code integration guide
├── SUPABASE_MIGRATION.md        # Data migration guide
├── README_SUPABASE.md           # This file
├── src/
│   ├── lib/
│   │   └── supabase.js          # Supabase client
│   ├── context/
│   │   ├── SupabaseContext.jsx  # Auth context
│   │   └── PlannerContext.jsx   # Updated to use Supabase
│   ├── services/
│   │   └── database.js          # Database service layer
│   └── components/
│       └── Auth.jsx             # Login/signup component
└── scripts/
    └── migrate-to-supabase.js   # Migration script
```

---

## 🔐 Security Checklist

- [ ] `.env` file created and configured
- [ ] `.env` added to `.gitignore`
- [ ] RLS policies enabled on all tables
- [ ] Authentication configured
- [ ] HTTPS/SSL configured (for production)
- [ ] Regular database backups scheduled

---

## 🆘 Troubleshooting

### Can't connect to Supabase?
- Verify Docker containers are running
- Check firewall settings
- Test connection: `curl http://193.122.151.142:8000`

### Authentication errors?
- Verify `.env` credentials are correct
- Check Supabase Studio → Settings → API
- Restart dev server after changing `.env`

### Data not appearing?
- Check RLS policies in Supabase Studio
- Verify user is authenticated
- Check browser console for errors

### Migration failed?
- Check `backup.json` format
- Verify user account exists
- See rollback instructions in `SUPABASE_MIGRATION.md`

---

## 📞 Support

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **Project Issues:** Check the guides in this directory

---

## ✅ Next Steps After Setup

1. Test authentication (sign up, sign in, sign out)
2. Test CRUD operations (create, read, update, delete)
3. Verify real-time sync (optional)
4. Migrate production data
5. Set up automated backups
6. Configure production environment

---

**Good luck with your Supabase integration!** 🚀
