# PocketBase Setup Guide

## 1. Access Admin UI

Go to: **http://pb-selfdev.mimnets.com/_/**

Login with your super admin credentials.

---

## 2. Create Collections

Navigate to **Collections** in the left sidebar, then click **"New collection"** for each one below.

---

### Collection: `planner_members`

- **Type:** Base collection
- **Name:** `planner_members`

**Fields** (click "New field" for each):

| Field Name | Type | Settings |
|------------|------|----------|
| `user` | **Relation** | Collection: `users`, Max select: 1, Required: ON |
| `name` | **Plain text** | Required: ON |
| `role` | **Select** | Values: `me`, `child`, `spouse`, `other` — Required: ON, Max select: 1 |
| `avatar` | **Plain text** | Required: OFF |

**API Rules** (click the "gear" icon or "API Rules" tab):

| Rule | Value |
|------|-------|
| List/Search | `@request.auth.id != "" && user = @request.auth.id` |
| View | `@request.auth.id != "" && user = @request.auth.id` |
| Create | `@request.auth.id != ""` |
| Update | `@request.auth.id != "" && user = @request.auth.id` |
| Delete | `@request.auth.id != "" && user = @request.auth.id` |

Click **Save**.

---

### Collection: `planner_activities`

- **Type:** Base collection
- **Name:** `planner_activities`

**Fields:**

| Field Name | Type | Settings |
|------------|------|----------|
| `user` | **Relation** | Collection: `users`, Max select: 1, Required: ON |
| `member` | **Relation** | Collection: `planner_members`, Max select: 1, Required: OFF |
| `type` | **Select** | Values: `activity`, `note`, `reminder` — Max select: 1 |
| `title` | **Plain text** | Required: OFF |
| `description` | **Plain text** | Required: OFF |
| `category` | **Plain text** | Required: OFF |
| `start_time` | **DateTime** | Required: OFF |
| `end_time` | **DateTime** | Required: OFF |
| `context` | **Select** | Values: `official`, `personal` — Max select: 1 |
| `completed` | **Bool** | Default: `false` |

**API Rules** (same as planner_members):

| Rule | Value |
|------|-------|
| List/Search | `@request.auth.id != "" && user = @request.auth.id` |
| View | `@request.auth.id != "" && user = @request.auth.id` |
| Create | `@request.auth.id != ""` |
| Update | `@request.auth.id != "" && user = @request.auth.id` |
| Delete | `@request.auth.id != "" && user = @request.auth.id` |

Click **Save**.

---

### Collection: `planner_categories`

- **Type:** Base collection
- **Name:** `planner_categories`

**Fields:**

| Field Name | Type | Settings |
|------------|------|----------|
| `user` | **Relation** | Collection: `users`, Max select: 1, Required: ON |
| `key` | **Plain text** | Required: ON |
| `label` | **Plain text** | Required: ON |
| `color` | **Plain text** | Required: OFF |
| `icon` | **Plain text** | Required: OFF |

**API Rules** (same as above):

| Rule | Value |
|------|-------|
| List/Search | `@request.auth.id != "" && user = @request.auth.id` |
| View | `@request.auth.id != "" && user = @request.auth.id` |
| Create | `@request.auth.id != ""` |
| Update | `@request.auth.id != "" && user = @request.auth.id` |
| Delete | `@request.auth.id != "" && user = @request.auth.id` |

**Add Unique Index** (optional but recommended):
1. After saving, go to collection settings (gear icon)
2. Go to **Indexes** tab
3. Click **"New index"**
4. Name: `idx_unique_user_key`
5. Check **Unique**
6. Columns: `user`, `key`
7. Save

Click **Save**.

---

### Collection: `planner_goals`

- **Type:** Base collection
- **Name:** `planner_goals`

**Fields:**

| Field Name | Type | Settings |
|------------|------|----------|
| `user` | **Relation** | Collection: `users`, Max select: 1, Required: ON |
| `member` | **Relation** | Collection: `planner_members`, Max select: 1, Required: OFF |
| `title` | **Plain text** | Required: OFF |
| `category` | **Plain text** | Required: OFF |
| `target_hours` | **Number** | Required: OFF |
| `period` | **Plain text** | Required: OFF |

**API Rules** (same as above):

| Rule | Value |
|------|-------|
| List/Search | `@request.auth.id != "" && user = @request.auth.id` |
| View | `@request.auth.id != "" && user = @request.auth.id` |
| Create | `@request.auth.id != ""` |
| Update | `@request.auth.id != "" && user = @request.auth.id` |
| Delete | `@request.auth.id != "" && user = @request.auth.id` |

Click **Save**.

---

### Collection: `planner_settings`

- **Type:** Base collection
- **Name:** `planner_settings`

**Fields:**

| Field Name | Type | Settings |
|------------|------|----------|
| `user` | **Relation** | Collection: `users`, Max select: 1, Required: ON |
| `theme` | **Plain text** | Required: OFF |
| `current_member_id` | **Plain text** | Required: OFF |
| `active_sessions` | **JSON** | Required: OFF |
| `session_types` | **JSON** | Required: OFF |
| `acknowledged_reminders` | **JSON** | Required: OFF |
| `custom_rules` | **JSON** | Required: OFF |
| `parent_pin` | **Plain text** | Required: OFF |

**JSON Field Details:**

**`active_sessions`** — Tracks which members have an active session running:
```json
{
  "me": {
    "sessionTypeId": "st-abc123",
    "startedAt": "2026-02-24T09:00:00.000Z"
  },
  "member-id-2": null
}
```
- Key = member app ID (`"me"` for primary member, or PocketBase record ID for others)
- Value = `null` (no active session) or object with `sessionTypeId` and `startedAt` timestamp

**`session_types`** — Defines available session types per member (supports multiple per member):
```json
{
  "me": [
    {
      "id": "st-abc123",
      "label": "Work",
      "dailyTarget": 8,
      "color": "#3b82f6",
      "icon": "briefcase"
    },
    {
      "id": "st-def456",
      "label": "Study",
      "dailyTarget": 4,
      "color": "#8b5cf6",
      "icon": "book"
    }
  ]
}
```
- Key = member app ID
- Value = array of session type objects
- Each session type has: `id` (UUID), `label` (display name), `dailyTarget` (hours, 1-16), `color` (hex), `icon` (lucide icon name)

**`acknowledged_reminders`** — Array of reminder IDs the user has dismissed:
```json
["reminder-id-1", "reminder-id-2"]
```

**`custom_rules`** — Keyword-to-category auto-mapping rules:
```json
{
  "meeting": "logistics",
  "gym": "physical",
  "reading": "improving"
}
```

**API Rules** (same as above):

| Rule | Value |
|------|-------|
| List/Search | `@request.auth.id != "" && user = @request.auth.id` |
| View | `@request.auth.id != "" && user = @request.auth.id` |
| Create | `@request.auth.id != ""` |
| Update | `@request.auth.id != "" && user = @request.auth.id` |
| Delete | `@request.auth.id != "" && user = @request.auth.id` |

**Add Unique Index** (one settings row per user):
1. Go to **Indexes** tab
2. Click **"New index"**
3. Name: `idx_unique_user`
4. Check **Unique**
5. Columns: `user`
6. Save

Click **Save**.

---

## 3. Configure Google OAuth

1. In the Admin UI, go to **Settings** (gear icon in sidebar)
2. Click **Auth providers**
3. Find **Google** and enable it
4. Enter your **Client ID** and **Client Secret** from Google Cloud Console
5. The redirect URL will be shown — add it to your Google Cloud Console under **Authorized redirect URIs**:
   ```
   http://pb-selfdev.mimnets.com/api/oauth2-redirect
   ```
6. Click **Save**

### Google Cloud Console Setup

1. Go to https://console.cloud.google.com/apis/credentials
2. Open your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   http://pb-selfdev.mimnets.com/api/oauth2-redirect
   ```
4. Under **Authorized JavaScript origins**, add your frontend URL (e.g. `http://localhost:5173` for dev)
5. Save

---

## 4. Quick Checklist

- [ ] `planner_members` collection created with API rules
- [ ] `planner_activities` collection created with API rules
- [ ] `planner_categories` collection created with API rules + unique index on (user, key)
- [ ] `planner_goals` collection created with API rules
- [ ] `planner_settings` collection created with API rules + unique index on (user)
- [ ] Google OAuth enabled in Auth providers
- [ ] Redirect URI added to Google Cloud Console

---

## 5. API Rules (Copy-Paste Reference)

All collections use the same rules. Copy-paste this into each rule field:

**List/Search & View:**
```
@request.auth.id != "" && user = @request.auth.id
```

**Create:**
```
@request.auth.id != ""
```

**Update & Delete:**
```
@request.auth.id != "" && user = @request.auth.id
```
