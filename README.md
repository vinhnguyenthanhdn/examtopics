# Microsoft AI-900 Exam Master

A modern, interactive quiz application for Microsoft Azure AI Fundamentals (AI-900) certification practice. Built with React, TypeScript, Vite, and Supabase.

## ✨ Features

- 📚 **240+ Practice Questions** - Comprehensive question bank from AI-900
- 🤖 **AI-Powered Explanations** - Get detailed explanations using Hugging Face (Llama 3.1)
- 📖 **Theory Mode** - Understand the concepts behind each question
- 🌐 **Bilingual Support** - Vietnamese and English interface
- 💾 **Progress Tracking** - Answers saved locally in your browser and synced with Supabase
- 🎨 **Modern UI/UX** - Beautiful, responsive design with smooth animations
- ☁️ **Cloud Database** - Supabase for data storage and user profiles

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Database**: Supabase
- **AI**: Hugging Face (Llama-3.1-70B-Instruct)
- **Deployment**: GitHub Pages

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase Database

Run the SQL commands provided in `ai900_database_setup.sql` in your Supabase SQL Editor.

### 3. Configure Environment Variables

Create a `.env` file in the root directory with your credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Hugging Face AI Configuration
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key
VITE_HF_MODEL=meta-llama/Llama-3.1-70B-Instruct
```

### 4. Import Questions

Run the Node.js import script:

```bash
node import_ai900_questions.cjs
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

## 📁 Project Structure

- `src/components/`: React components for UI
- `src/lib/`: Core logic (AI, Supabase, Parser, Translations)
- `ai900_database_setup.sql`: SQL script for Supabase tables
- `import_ai900_questions.cjs`: Node.js script to import questions
- `pmp-ref/`: Original PMP project reference

## 📝 License

ISC

## 👤 Author
 
Vinh Nguyen
 