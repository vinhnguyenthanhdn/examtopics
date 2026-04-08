#!/usr/bin/env python3
"""
PMP Questions Importer
Parses PMP_Full_1400.md and imports questions to Supabase
"""

import re
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Supabase configuration
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env.local")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def parse_pmp_questions(file_path: str):
    """
    Parse PMP questions from markdown file
    
    Returns:
        list: List of question dictionaries
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by question separator
    question_blocks = content.split('## Exam PMP topic')
    
    questions = []
    
    for block in question_blocks[1:]:  # Skip first empty split
        try:
            # Extract question number
            question_num_match = re.search(r'question (\d+)', block, re.IGNORECASE)
            if not question_num_match:
                continue
            
            question_id = question_num_match.group(1)
            
            # Extract question text (everything between [All PMP Questions] and first option)
            question_text_match = re.search(
                r'\[All PMP Questions\]\s*\n\n(.*?)\n\s*Suggested Answer:',
                block,
                re.DOTALL
            )
            
            if not question_text_match:
                print(f"⚠️  Skipping question {question_id}: Could not extract question text")
                continue
            
            question_text = question_text_match.group(1).strip()
            
            # Extract options (A, B, C, D)
            options = []
            option_pattern = r'^([A-D])\.\s+(.+?)(?=\n[A-D]\.|$|\*\*Answer:)'
            
            # Find all options in the block
            for match in re.finditer(option_pattern, block, re.MULTILINE | re.DOTALL):
                letter = match.group(1)
                text = match.group(2).strip()
                # Clean up extra whitespace
                text = re.sub(r'\s+', ' ', text)
                options.append(f"{letter}. {text}")
            
            if len(options) < 2:
                print(f"⚠️  Skipping question {question_id}: Found only {len(options)} options")
                continue
            
            # Extract correct answer
            answer_match = re.search(r'\*\*Answer:\s*([A-D]+)\*\*', block)
            if not answer_match:
                print(f"⚠️  Skipping question {question_id}: Could not find answer")
                continue
            
            correct_answer = answer_match.group(1)
            
            # Determine if multiselect (answer has multiple letters)
            is_multiselect = len(correct_answer) > 1
            
            # Extract ExamTopics discussion link
            discussion_link = None
            link_match = re.search(r'\[View on ExamTopics\]\((https://www\.examtopics\.com/[^\)]+)\)', block)
            if link_match:
                discussion_link = link_match.group(1)
            
            # Create question object
            question = {
                'id': question_id,
                'question': question_text,
                'options': options,
                'correct_answer': correct_answer,
                'is_multiselect': is_multiselect,
                'discussion_link': discussion_link
            }
            
            questions.append(question)
            print(f"✅ Parsed question {question_id}: {len(options)} options, answer: {correct_answer}")
            
        except Exception as e:
            print(f"❌ Error parsing question block: {str(e)}")
            continue
    
    return questions

def import_to_supabase(questions: list, batch_size: int = 50):
    """
    Import questions to Supabase in batches
    
    Args:
        questions: List of question dictionaries
        batch_size: Number of questions per batch
    """
    total = len(questions)
    print(f"\n📊 Total questions to import: {total}")
    
    # Import in batches
    for i in range(0, total, batch_size):
        batch = questions[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total + batch_size - 1) // batch_size
        
        try:
            response = supabase.table('pmp_questions').upsert(
                batch,
                on_conflict='id'
            ).execute()
            
            print(f"✅ Batch {batch_num}/{total_batches}: Imported {len(batch)} questions (IDs: {batch[0]['id']}-{batch[-1]['id']})")
            
        except Exception as e:
            print(f"❌ Error importing batch {batch_num}: {str(e)}")
            # Try individual inserts for this batch
            for question in batch:
                try:
                    supabase.table('pmp_questions').upsert(
                        question,
                        on_conflict='id'
                    ).execute()
                    print(f"  ✅ Imported question {question['id']} individually")
                except Exception as e2:
                    print(f"  ❌ Failed to import question {question['id']}: {str(e2)}")

def verify_import():
    """Verify the import by counting records"""
    try:
        response = supabase.table('pmp_questions').select('id', count='exact').execute()
        count = response.count
        print(f"\n✅ Verification: {count} questions in database")
        
        # Show first 5 questions
        sample = supabase.table('pmp_questions').select('id, question').limit(5).order('id').execute()
        print("\n📋 Sample questions:")
        for q in sample.data:
            preview = q['question'][:80] + '...' if len(q['question']) > 80 else q['question']
            print(f"  Q{q['id']}: {preview}")
            
    except Exception as e:
        print(f"❌ Verification failed: {str(e)}")

def main():
    """Main execution function"""
    print("🚀 PMP Questions Importer")
    print("=" * 50)
    
    # Check if file exists
    file_path = 'PMP_Full_1400.md'
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    
    print(f"📖 Reading file: {file_path}")
    
    # Parse questions
    questions = parse_pmp_questions(file_path)
    
    if not questions:
        print("❌ No questions parsed. Please check the file format.")
        return
    
    print(f"\n✅ Successfully parsed {len(questions)} questions")
    
    # Confirm before importing
    print("\n⚠️  Ready to import to Supabase database")
    response = input("Continue? (yes/no): ").strip().lower()
    
    if response != 'yes':
        print("❌ Import cancelled")
        return
    
    # Import to Supabase
    print("\n📤 Importing to Supabase...")
    import_to_supabase(questions)
    
    # Verify
    verify_import()
    
    print("\n✅ Import complete!")

if __name__ == "__main__":
    main()
