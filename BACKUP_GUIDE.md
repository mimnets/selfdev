# 🔒 Backup & Restore Guide

## Quick Start

### Create Backup
```bash
npm run backup
```

### Restore Backup
```bash
npm run restore
```

---

## What Gets Backed Up?

- ✅ All source code (`src/`)
- ✅ Public assets (`public/`)
- ✅ Configuration files (`package.json`, `vite.config.js`, etc.)
- ✅ HTML entry point (`index.html`)
- ❌ Dependencies (`node_modules/` - excluded)
- ❌ Build output (`dist/` - excluded)

---

## Backup Location

Backups are stored in:
```
backups/
  └── backup-2026-01-28T12-30-45/
      ├── src/
      ├── public/
      ├── package.json
      └── BACKUP_INFO.json
```

---

## When to Create Backups

- ✅ Before major changes (like Supabase integration)
- ✅ Before updating dependencies
- ✅ Before refactoring code
- ✅ Weekly (as a safety measure)

---

## Restoration Process

1. Run `npm run restore`
2. Select backup from list
3. Confirm restoration
4. Run `npm install` (to restore dependencies)
5. Run `npm run dev` (to start app)

---

## Manual Backup (Browser Data)

```javascript
// Run in browser console
const data = localStorage.getItem('planner-state');
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `planner-backup-${new Date().toISOString()}.json`;
a.click();
```

---

## Backup Retention

- Keep backups for 30 days
- Delete old backups manually from `backups/` folder
- Each backup is ~5-10 MB

---

## Emergency Rollback

If something goes wrong and you can't run npm commands:

1. Navigate to `backups/` folder
2. Find the latest backup folder
3. Manually copy files back to project root
4. Run `npm install`
5. Run `npm run dev`
