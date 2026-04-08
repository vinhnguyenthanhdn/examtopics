# Migration Plan: AI-900 Exam Platform

This document outlines the plan to create a dedicated AI-900 exam preparation platform based on the existing PMP project structure.

## 1. Project Initialization
- **Clone Project**: Duplicate `pmp-ref` into a new project directory (e.g., `ai900-exam`).
- **Clean up**: Remove Vercel-specific configurations (`vercel.json`).
- **Update Metadata**: Update `package.json`, `vite.config.ts`, and `index.html` to reflect the AI-900 brand.
- **Environment Variables**: Configure `.env` with the same Supabase URL and Anon Key as the PMP project.

## 2. Database Schema (Supabase)
The project will share the same Supabase backend with PMP to reuse user data, but will use dedicated tables for AI-900 content:
- **New Tables**:
    - `ai900_questions`: Store AI-900 questions (cloned structure from `pmp_questions`).
    - `ai900_user_answers`: Track user answers for AI-900.
    - `ai900_user_progress`: Track user's current position in the AI-900 bank.
- **Shared Tables**:
    - `profiles`: Shared login, user roles, and approval status.
    - `ai_cache`: Can be shared or separate; sharing is easier as `question_id` will differ.

## 3. Frontend Updates
- **Logic Refactoring**: Update `App.tsx` and service files (`lib/*.ts`) to query the `ai900_*` tables instead of `pmp_*`.
- **UI Branding**:
    - Update Header title to "Microsoft AI-900 Exam Master".
    - Update Footer and meta tags.
    - Implement AI-900 specific styling if needed.

## 4. GitHub Pages Deployment
- **Vite Configuration**:
    - Set `base: './'` or a specific path for GitHub Pages deployment.
- **Routing**: Ensure compatibility with GitHub Pages (use `HashRouter` if deep linking is required).
- **GitHub Action**: Create `.github/workflows/deploy.yml` for automated deployment to the `gh-pages` branch.

## 5. Data Migration
- **AI-900 Parser**: Create a Node.js/Python script to parse `ai-900_questions.md` and upload data to the `ai900_questions` table.
- **Parsing Logic**: Parse both "Suggested Answer:" and "Answer:" from the markdown. Store both in the database, but use "Suggested Answer:" as the primary correct answer for the quiz.
- **Validation**: Ensure all 700+ lines/questions are correctly formatted and imported.

## 6. Authentication Integration
- Since the Supabase project is shared, users who are already approved for the PMP project will automatically be approved for the AI-900 project.
- User progress for AI-900 will be tracked separately in `ai900_user_progress`.

---

### Implementation Steps
1. **Infrastructure**: Clone repo and set up GH Actions.
2. **Database**: Execute SQL to create AI-900 tables.
3. **App Logic**: Switch table references from PMP to AI-900.
4. **Data**: Run import script for AI-900 questions.
5. **Deploy**: Push to GitHub and verify GH Pages.
