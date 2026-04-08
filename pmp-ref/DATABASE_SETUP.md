# PMP Quiz Database Setup Guide

## 📋 Overview
This guide helps you set up the Supabase database for the PMP Quiz application.

---

## 🔑 Step 1: Environment Variables

The `.env.local` file has been created with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://kowpqhvjlykpjwjxxhrf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Important:** 
- Add your Google Gemini API keys to `VITE_GOOGLE_API_KEYS`
- Never commit `.env.local` to git (already in `.gitignore`)

---

## 🗄️ Step 2: Create Database Tables

### Option A: Using Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `kowpqhvjlykpjwjxxhrf`
3. Navigate to **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. Copy the entire content of `database_setup.sql`
6. Paste it into the SQL Editor
7. Click **"Run"** or press `Ctrl+Enter`

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref kowpqhvjlykpjwjxxhrf

# Run the migration
supabase db push --file database_setup.sql
```

---

## 📊 Database Schema

The setup creates 5 main tables:

### 1. **questions**
Stores all PMP exam questions with options and correct answers.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Question ID (e.g., "1", "2") |
| question | TEXT | Question text |
| options | TEXT[] | Array of answer options |
| correct_answer | TEXT | Correct answer (e.g., "A", "AB") |
| is_multiselect | BOOLEAN | Multiple choice flag |
| discussion_link | TEXT | Optional discussion URL |

### 2. **ai_cache**
Caches AI-generated explanations to reduce API costs.

| Column | Type | Description |
|--------|------|-------------|
| question_id | TEXT | Reference to question |
| language | TEXT | 'vi' or 'en' |
| type | TEXT | 'explanation' or 'theory' |
| content | TEXT | AI-generated content |

### 3. **user_progress**
Tracks user's current question position.

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | User ID from auth.users |
| last_question_index | INTEGER | Current question index |

### 4. **user_submissions**
Stores user's answer history.

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | User ID |
| question_id | TEXT | Question ID |
| user_answer | TEXT | User's submitted answer |
| is_correct | BOOLEAN | Correctness flag |
| submitted_at | TIMESTAMP | Submission time |

### 5. **app_settings**
Application-level settings (e.g., API key rotation).

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT | Setting key |
| value | TEXT | Setting value |

---

## 🔒 Security (Row Level Security)

All tables have RLS enabled with appropriate policies:

- **Questions & AI Cache**: Public read access
- **User Progress & Submissions**: Users can only access their own data
- **App Settings**: Public read, service role write

---

## ✅ Step 3: Verify Setup

Run these queries in SQL Editor to verify:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected output:
-- ai_cache
-- app_settings
-- questions
-- user_progress
-- user_submissions

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All should show: rowsecurity = true
```

---

## 📥 Step 4: Import PMP Questions

You have two options to populate the `questions` table:

### Option A: Manual Import via CSV

1. Prepare a CSV file with columns: `id, question, options, correct_answer, is_multiselect`
2. In Supabase Dashboard → **Table Editor** → **questions**
3. Click **"Insert"** → **"Import from CSV"**
4. Upload your CSV file

### Option B: SQL Insert Statements

Create a file `pmp_questions.sql`:

```sql
INSERT INTO questions (id, question, options, correct_answer, is_multiselect) VALUES
('1', 'What is the primary purpose of a project charter?', 
 ARRAY['A. To authorize the project', 'B. To define project scope', 'C. To assign resources', 'D. To create WBS'], 
 'A', false),
('2', 'Which process group includes the Develop Project Charter process?',
 ARRAY['A. Planning', 'B. Initiating', 'C. Executing', 'D. Monitoring'],
 'B', false);
-- Add more questions...
```

Then run it in SQL Editor.

---

## 🧪 Step 5: Test the Application

```bash
# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` and verify:
- ✅ Questions load correctly
- ✅ User can submit answers
- ✅ AI features work (after adding API keys)
- ✅ Login/logout works
- ✅ Progress is saved

---

## 🔧 Troubleshooting

### Issue: "No questions found"
**Solution:** Make sure you've imported questions into the `questions` table.

### Issue: "Could not connect to Supabase"
**Solution:** 
1. Check `.env.local` has correct credentials
2. Verify Supabase project is active
3. Check network connection

### Issue: "AI features not working"
**Solution:** Add Google Gemini API keys to `.env.local`:
```env
VITE_GOOGLE_API_KEYS=your_key_1,your_key_2,your_key_3
```

### Issue: "User progress not saving"
**Solution:** 
1. Ensure user is logged in
2. Check RLS policies are correctly set
3. Verify `user_progress` table exists

---

## 📚 Next Steps

1. ✅ Set up database (you are here)
2. 📝 Import PMP questions
3. 🔑 Add Google API keys
4. 🚀 Deploy to production (Vercel)
5. 🎨 Customize branding (colors, logo)

---

## 🆘 Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **PMP Exam Content**: https://www.pmi.org/certifications/project-management-pmp
- **Contact**: vinh.nguyenthanhdn@gmail.com
