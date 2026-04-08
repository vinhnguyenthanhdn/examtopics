# PMP Questions Import Guide

## 📋 Overview
This guide helps you import PMP questions from `PMP_Full_1400.md` to Supabase database.

---

## ✅ Prerequisites

1. **Database Setup**: Run `pmp_database_setup.sql` in Supabase first
2. **Environment Variables**: `.env.local` must have valid Supabase credentials
3. **Python Dependencies**: Install required packages

---

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
pip3 install -r requirements.txt
```

### Step 2: Verify File Exists
Make sure `PMP_Full_1400.md` is in the project root directory.

### Step 3: Run Import Script
```bash
python3 import_pmp_questions.py
```

The script will:
1. ✅ Parse all questions from the markdown file
2. ✅ Show you how many questions were found
3. ⚠️  Ask for confirmation before importing
4. ✅ Import questions in batches of 50
5. ✅ Verify the import was successful

---

## 📊 What the Script Does

### Parsing Logic
The script extracts:
- **Question ID**: From "Question #: X"
- **Question Text**: The main question body
- **Options**: A, B, C, D choices
- **Correct Answer**: From "**Answer: X**"
- **Is Multiselect**: Detected if answer has multiple letters (e.g., "AB")
- **Discussion Link**: ExamTopics URL if available

### Example Parsed Question
```json
{
  "id": "1",
  "question": "A project manager leads a software development project...",
  "options": [
    "A. Consult the risk register for an appropriate planned risk response and implement.",
    "B. Revise the project management plan and move the task to a time when the technical resource will be available.",
    "C. Review the business requirement with stakeholders and exclude the task assigned to the technical resource.",
    "D. Update the lessons learned report and the risk log to reflect that this risk has materialized."
  ],
  "correct_answer": "A",
  "is_multiselect": false,
  "discussion_link": "https://www.examtopics.com/discussions/pmi/view/80292-exam-pmp-topic-1-question-1-discussion/"
}
```

---

## 🔍 Expected Output

### Successful Run
```
🚀 PMP Questions Importer
==================================================
📖 Reading file: PMP_Full_1400.md
✅ Parsed question 1: 4 options, answer: A
✅ Parsed question 2: 4 options, answer: D
✅ Parsed question 3: 4 options, answer: B
...
✅ Successfully parsed 1400 questions

⚠️  Ready to import to Supabase database
Continue? (yes/no): yes

📤 Importing to Supabase...
✅ Batch 1/28: Imported 50 questions (IDs: 1-50)
✅ Batch 2/28: Imported 50 questions (IDs: 51-100)
...
✅ Batch 28/28: Imported 50 questions (IDs: 1351-1400)

✅ Verification: 1400 questions in database

📋 Sample questions:
  Q1: A project manager leads a software development project in a hybrid environment...
  Q2: A team has just adopted an agile approach. During daily standup meetings...
  Q3: A team is delivering features to a customer at every iteration...
  Q4: A project manager is part of a team that is launching a series of features...
  Q5: ...

✅ Import complete!
```

---

## ⚠️ Troubleshooting

### Issue: "File not found: PMP_Full_1400.md"
**Solution:** Make sure the markdown file is in the project root directory.

### Issue: "Missing Supabase credentials"
**Solution:** Check that `.env.local` has:
```env
VITE_SUPABASE_URL=https://kowpqhvjlykpjwjxxhrf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### Issue: "No questions parsed"
**Solution:** 
1. Check the markdown file format matches the expected structure
2. Look for parsing warnings in the output
3. Verify the file encoding is UTF-8

### Issue: "Error importing batch"
**Solution:** 
- The script will automatically retry individual questions
- Check Supabase RLS policies are correctly set
- Verify the `pmp_questions` table exists

### Issue: Partial Import
**Solution:**
- The script uses `upsert` with `on_conflict='id'`
- You can safely re-run the script to import missing questions
- Already imported questions will be skipped

---

## 🔄 Re-running the Import

The script is **idempotent** - you can run it multiple times safely:
- Existing questions will be updated (upsert)
- New questions will be added
- No duplicates will be created

```bash
# Safe to run multiple times
python3 import_pmp_questions.py
```

---

## 🧪 Testing After Import

### Verify in Supabase Dashboard
1. Go to **Table Editor** → `pmp_questions`
2. You should see 1400 rows
3. Check a few questions to verify data quality

### Test in Application
```bash
npm run dev
```

Visit `http://localhost:5173` and verify:
- ✅ Questions load correctly
- ✅ Options display properly
- ✅ Correct answers are marked
- ✅ Discussion links work

---

## 📝 Script Features

- ✅ **Batch Processing**: Imports 50 questions at a time
- ✅ **Error Handling**: Continues on individual failures
- ✅ **Progress Tracking**: Shows real-time import status
- ✅ **Verification**: Confirms successful import
- ✅ **Idempotent**: Safe to re-run
- ✅ **Detailed Logging**: Shows exactly what's happening

---

## 🎯 Next Steps After Import

1. ✅ Verify questions in Supabase
2. ✅ Test application locally
3. ✅ Add Google Gemini API keys to `.env.local`
4. ✅ Test AI features (Theory & Explanation)
5. ✅ Deploy to production

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the script output for specific error messages
3. Verify database schema is correct
4. Contact: vinh.nguyenthanhdn@gmail.com
