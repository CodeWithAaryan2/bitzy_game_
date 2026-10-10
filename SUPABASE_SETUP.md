# Bitzy - Supabase Setup Guide

Follow these steps after creating a NEW Supabase project.

## Step 1: Get Your Credentials

1. Go to your Supabase Dashboard
2. Click **Project Settings** (gear icon)
3. Go to **API**
4. Copy:
   - `URL` → your SUPABASE_URL
   - `anon/public` key → your SUPABASE_PUBLISHABLE_KEY

## Step 2: Update Your .env File

Open `/mnt/agents/output/app/.env` and replace the values:

```env
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY

VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
```

## Step 3: Run the Database Schema

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New query**
3. Copy ALL the content from `/mnt/agents/output/app/db/schema.sql`
4. Paste it into the SQL Editor
5. Click **Run**

This creates all tables, RLS policies, achievements data, and the signup trigger.

## Step 4: Disable Email Confirmation (Optional but Recommended)

If you don't want users to verify email before logging in:

1. Go to **Authentication** → **Providers** → **Email**
2. Turn OFF **Confirm email**
3. Save

## Step 5: Test the App

1. Start the dev server: `npm run dev`
2. Open the app in browser
3. Go to **Register** and create a new account
4. After signup, you should automatically have:
   - **50 XP**
   - **50 Coins**  
   - **5 Energy (Hearts)**
   - **Level 1**

## Troubleshooting

### "Profile not found" error
- Check browser console for `[Auth]` debug logs
- Make sure you ran the SQL schema in Step 3
- Try refreshing the page after signup

### "Not enough energy" when completing lessons
- Energy starts at 5 and refills automatically when empty
- If energy shows 0, the auto-refill in GameContext will restore it to 5

### Tables not created
- Make sure you're running the SQL in the correct Supabase project
- Check SQL Editor for any error messages
- The schema uses `IF NOT EXISTS` so it's safe to run multiple times

## What the Schema Creates

| Table | Purpose |
|-------|---------|
| `profiles` | User stats (XP, coins, energy, level) |
| `course_progress` | Track completed lessons per course |
| `challenge_submissions` | Track coding challenge attempts |
| `achievements` | Available achievements (pre-filled) |
| `user_achievements` | Which achievements user has earned |
| `leaderboard_entries` | Leaderboard data |
| `activity_logs` | Activity history |
| `chat_messages` | AI Mentor chat history |
