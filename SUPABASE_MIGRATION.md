# Supabase Migration Guide

## 🎯 Overview

This guide helps you migrate your existing data from Google Drive JSON backup to Supabase.

---

## Step 1: Export Current Data

### Option A: From Google Drive

1. Go to your Google Drive
2. Find `Gravity Planner Data/gravity_planner_backup.json`
3. Download the file
4. Save it to your project root as `backup.json`

### Option B: From localStorage

Run this in your browser console while on the app:

```javascript
const data = localStorage.getItem('planner-state');
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'backup.json';
a.click();
```

---

## Step 2: Create Migration Script

Create `scripts/migrate-to-supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'http://193.122.151.142:8000';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';  // Get from Supabase Studio

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  try {
    // 1. Read backup file
    const backup = JSON.parse(fs.readFileSync('./backup.json', 'utf8'));
    console.log('Backup loaded:', Object.keys(backup));

    // 2. Sign in (create account first if needed)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'your-email@example.com',
      password: 'your-password'
    });

    if (authError) throw authError;
    console.log('Authenticated as:', authData.user.email);

    const userId = authData.user.id;

    // 3. Migrate Members
    console.log('\\nMigrating members...');
    const memberIdMap = {}; // Map old IDs to new UUIDs

    for (const member of backup.members || []) {
      const { data, error } = await supabase
        .from('planner_members')
        .insert([{
          user_id: userId,
          name: member.name,
          role: member.id, // 'me', 'child', etc.
          avatar: member.avatar
        }])
        .select()
        .single();

      if (error) {
        console.error('Error migrating member:', member.name, error);
      } else {
        memberIdMap[member.id] = data.id;
        console.log('✓ Migrated member:', member.name);
      }
    }

    // 4. Migrate Categories
    console.log('\\nMigrating categories...');
    for (const [key, category] of Object.entries(backup.categories || {})) {
      const { error } = await supabase
        .from('planner_categories')
        .insert([{
          user_id: userId,
          key: key,
          label: category.label,
          color: category.color,
          icon: category.icon
        }]);

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error migrating category:', key, error);
      } else {
        console.log('✓ Migrated category:', key);
      }
    }

    // 5. Migrate Activities
    console.log('\\nMigrating activities...');
    let activityCount = 0;

    for (const activity of backup.activities || []) {
      // Skip if no startTime
      if (!activity.startTime) continue;

      const { error } = await supabase
        .from('planner_activities')
        .insert([{
          user_id: userId,
          member_id: memberIdMap[activity.memberId] || null,
          type: activity.type || 'activity',
          title: activity.title,
          description: activity.description,
          category: activity.category,
          start_time: activity.startTime,
          end_time: activity.endTime || null,
          context: activity.context || 'personal',
          completed: activity.completed || false
        }]);

      if (error) {
        console.error('Error migrating activity:', activity.title, error);
      } else {
        activityCount++;
        if (activityCount % 10 === 0) {
          console.log(`✓ Migrated ${activityCount} activities...`);
        }
      }
    }
    console.log(`✓ Total activities migrated: ${activityCount}`);

    // 6. Migrate Goals
    console.log('\\nMigrating goals...');
    for (const goal of backup.goals || []) {
      const { error } = await supabase
        .from('planner_goals')
        .insert([{
          user_id: userId,
          member_id: memberIdMap[goal.memberId] || null,
          title: goal.title,
          category: goal.category,
          target_hours: goal.targetHours,
          period: goal.period
        }]);

      if (error) {
        console.error('Error migrating goal:', goal.title, error);
      } else {
        console.log('✓ Migrated goal:', goal.title);
      }
    }

    // 7. Migrate Settings
    console.log('\\nMigrating settings...');
    const { error: settingsError } = await supabase
      .from('planner_settings')
      .upsert({
        user_id: userId,
        theme: backup.theme || 'dark',
        current_member_id: memberIdMap[backup.currentMemberId] || null,
        active_sessions: backup.activeSessions || {},
        session_requirements: backup.sessionRequirements || {},
        acknowledged_reminders: backup.acknowledgedReminders || []
      });

    if (settingsError) {
      console.error('Error migrating settings:', settingsError);
    } else {
      console.log('✓ Migrated settings');
    }

    console.log('\\n✅ Migration complete!');
    console.log('\\nNext steps:');
    console.log('1. Verify data in Supabase Studio');
    console.log('2. Test the app with Supabase');
    console.log('3. Keep Google Drive backup as fallback');

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
```

---

## Step 3: Run Migration

1. **Update the script:**
   - Replace `YOUR_SUPABASE_ANON_KEY` with your actual key
   - Replace email/password with your credentials

2. **Install dependencies:**
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Run the migration:**
   ```bash
   node scripts/migrate-to-supabase.js
   ```

4. **Verify in Supabase Studio:**
   - Go to Table Editor
   - Check each table for data
   - Verify counts match your backup

---

## Step 4: Verify Migration

### Check Data Integrity

```javascript
// Run in browser console after logging in
const { data: activities } = await supabase
  .from('planner_activities')
  .select('*');

console.log('Total activities:', activities.length);

const { data: members } = await supabase
  .from('planner_members')
  .select('*');

console.log('Total members:', members.length);
```

### Compare with Backup

```javascript
const backup = JSON.parse(localStorage.getItem('planner-state'));
console.log('Backup activities:', backup.activities.length);
console.log('Backup members:', backup.members.length);
```

---

## Step 5: Rollback Plan (If Needed)

If migration fails or data is incorrect:

1. **Delete migrated data:**
   ```sql
   -- In Supabase SQL Editor
   DELETE FROM planner_activities WHERE user_id = 'YOUR_USER_ID';
   DELETE FROM planner_members WHERE user_id = 'YOUR_USER_ID';
   DELETE FROM planner_categories WHERE user_id = 'YOUR_USER_ID';
   DELETE FROM planner_goals WHERE user_id = 'YOUR_USER_ID';
   DELETE FROM planner_settings WHERE user_id = 'YOUR_USER_ID';
   ```

2. **Fix the migration script**

3. **Run migration again**

---

## Step 6: Post-Migration Cleanup

After successful migration and testing:

1. **Keep Google Drive backup** (don't delete!)
2. **Disable auto-backup** in AuthContext (optional)
3. **Update app to use Supabase** exclusively

---

## Troubleshooting

### "Duplicate key" errors
- Some data already exists
- Safe to ignore for categories
- Check if you ran migration twice

### "Foreign key" errors
- Member IDs don't match
- Check `memberIdMap` in script
- Verify members migrated first

### Missing data
- Check backup.json format
- Verify user is authenticated
- Check RLS policies

### Slow migration
- Normal for 1000+ activities
- Add batch processing if needed
- Consider running overnight

---

## Migration Checklist

- [ ] Backup downloaded from Google Drive
- [ ] Migration script created
- [ ] Supabase credentials added
- [ ] User account created in Supabase
- [ ] Migration script executed
- [ ] Data verified in Supabase Studio
- [ ] App tested with Supabase
- [ ] Google Drive backup kept as fallback

---

## Next Steps

✅ Data migrated to Supabase  
✅ App using Supabase  
✅ Real-time sync enabled  

**You're done!** Your Gravity Planner is now powered by Supabase 🚀
