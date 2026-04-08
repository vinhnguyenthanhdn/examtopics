"""
PMP AI Cache Builder - Version 2.1 (Enhanced Logic & Professional Analysis)
---------------------------------------------------------------------
- Role: Senior PMP Mentor (PMBOK 7 & Agile Practice Guide)
- Features: 
    + Strict English technical terms with Vietnamese explanations.
    + Forced correct answer alignment from Database.
    + JSON options parsing & clean formatting.
    + Deep situational analysis.
"""

import os
import sys
import argparse
import time
import json
from typing import Optional, List, Dict
from dotenv import load_dotenv
import httpx

try:
    from huggingface_hub import InferenceClient
except ImportError:
    print("❌ Error: Module 'huggingface_hub' chưa được cài đặt.")
    print("   Vui lòng chạy: pip install huggingface_hub python-dotenv httpx")
    sys.exit(1)

# --- 1. CẤU HÌNH HỆ THỐNG ---
load_dotenv()

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')
HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY')
# Khuyến nghị Qwen2.5-72B để tuân thủ định dạng tốt nhất
HF_MODEL = os.getenv('HF_MODEL') or "meta-llama/Llama-3.1-70B-Instruct"

if not all([SUPABASE_URL, SUPABASE_KEY, HUGGINGFACE_API_KEY]):
    print("❌ Error: Thiếu cấu hình .env (SUPABASE_URL, SUPABASE_KEY, HUGGINGFACE_API_KEY)!")
    sys.exit(1)

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

# --- 2. LOGIC PROMPT TỐI ƯU ---

def get_theory_prompt(question: str, options: str, language: str) -> str:
    target_lang = "Tiếng Việt" if language == 'vi' else "English"
    
    return f"""You are a world-class PMP Instructor. 
STRICT RULES:
1. **KEEP ALL PMP TECHNICAL TERMS IN ENGLISH**. Do NOT translate terms like 'Product Backlog', 'Sprint Review', 'Stakeholder Register', 'Critical Path', 'Servant Leadership', 'Retrospective', 'Team Charter', 'Iteration', 'Daily Standup', etc.
   - RIGHT: **Sprint Review**: Buổi họp cuối sprint để demo sản phẩm...
   - WRONG: **Đánh giá nước rút**: Buổi họp...
2. Provide detailed explanations in {target_lang}.
3. DO NOT repeat explanations if a term appears in both the question and options.
4. Focus on the 'Why' and 'How' it's used in project management.
5. If you must explain a concept, start the bullet point with the **English Term**.
6. **DO NOT REVEAL THE CORRECT ANSWER**. This is a theory section only.
7. **DO NOT INCLUDE A CONCLUSION** or "The correct answer is..." statement at the end.

Question: {question}
Options:
{options}

Format the response as follows:
## Cơ sở lý thuyết các khái niệm
- **[English Term]**: [Detailed explanation in {target_lang}]
- **[English Term]**: [Detailed explanation...]

## Các công cụ và kỹ thuật (Tools & Techniques)
- **[English Term]**: [Specific purpose and application in this context]
"""

def get_explanation_prompt(question: str, options: str, correct_letter: str, language: str) -> str:
    target_lang = "Tiếng Việt" if language == 'vi' else "English"
    
    # Clean correct_letter (e.g., "A, B" -> "AB")
    cleaned_letters = [char for char in correct_letter if char.isalnum()]
    
    found_texts = []
    option_lines = options.split('\n')
    
    for char in cleaned_letters:
        text_found = False
        for line in option_lines:
            # Check for "A." or "A)" styles just in case, though main() forces "A. "
            if line.strip().startswith(f"{char}.") or line.strip().startswith(f"{char})"):
                # Extract content after prefix
                parts = line.split(f"{char}.", 1) if f"{char}." in line else line.split(f"{char})", 1)
                if len(parts) > 1:
                    found_texts.append(parts[1].strip())
                    text_found = True
                break
        if not text_found:
             found_texts.append(f"Option {char}")
             
    correct_text = " AND ".join(found_texts) if found_texts else "N/A"

    return f"""You are a PMP Mentor. 
STRICT RULES:
1. The correct answer(s) is/are {correct_letter}: "{correct_text}". You MUST justify this answer.
2. **KEEP TECHNICAL TERMS IN ENGLISH**. Do not translate standard PMP terms (e.g., use "Project Charter", not "Hiến chương dự án"; use "Stakeholder Engagement", not "Sự tham gia của các bên liên quan").
3. Provide a deep analysis of the situation (Lifecycle: Agile/Predictive/Hybrid).
4. Use {target_lang} for the narrative explanation.

Question: {question}
Options:
{options}

Format the response as follows:
## Phân tích tình huống
[Phân tích ngữ cảnh dự án, xác định vấn đề cốt lõi và giai đoạn của dự án.]

## Giải thích đáp án đúng ({correct_letter})
[Giải thích tại sao "{correct_text}" là lựa chọn tốt nhất dựa trên PM Mindset và tiêu chuẩn PMI. Nếu có nhiều đáp án, giải thích từng cái.]

## Tại sao các đáp án khác không phù hợp
[Phân tích chi tiết từng phương án còn lại và lý do loại trừ chúng.]

## PMP Mindset
[Một quy tắc vàng hoặc mẹo rút ra từ câu hỏi này.]
"""

# --- 3. API & DATABASE COMMUNICATION ---

def call_huggingface(prompt: str) -> Optional[str]:
    client = InferenceClient(api_key=HUGGINGFACE_API_KEY)
    try:
        messages = [
            {"role": "system", "content": "You are a professional PMP tutor. You keep technical terms in English but explain in the requested language. You never use Chinese/Japanese characters."},
            {"role": "user", "content": prompt}
        ]
        response = client.chat_completion(
            model=HF_MODEL,
            messages=messages,
            max_tokens=2000,
            temperature=0.1 # Thấp để đảm bảo tính logic và bám sát prompt
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"   ⚠️ API Error: {str(e)[:100]}...")
        return None

def fetch_questions(start: int, end: int) -> List[Dict]:
    try:
        url = f"{SUPABASE_URL}/rest/v1/pmp_questions"
        all_questions = []
        offset = 0
        limit = 1000
        
        while True:
            # Add Range header for pagination
            custom_headers = HEADERS.copy()
            custom_headers['Range'] = f'{offset}-{offset + limit - 1}'
            
            with httpx.Client() as client:
                resp = client.get(url, headers=custom_headers, params={'select': '*'})
                if resp.status_code not in (200, 206): 
                    print(f"❌ DB Error: {resp.text}")
                    break
                
                data = resp.json()
                if not data:
                    break
                    
                all_questions.extend(data)
                
                # If we received fewer items than the limit, we've reached the end
                if len(data) < limit:
                    break
                    
                offset += limit
                
        # Hàm trích xuất số từ ID (VD: "Q1" -> 1)
        def extract_num(q):
            num_part = "".join(filter(str.isdigit, str(q.get('id', ''))))
            val = int(num_part) if num_part else 0
            return val
        
        all_questions.sort(key=extract_num)
        
        filtered = [q for q in all_questions if start <= extract_num(q) <= end]
        return filtered

    except Exception as e:
        print(f"❌ Fetch Error: {e}")
        return []

def save_to_cache(q_id: str, lang: str, c_type: str, content: str):
    url = f"{SUPABASE_URL}/rest/v1/pmp_ai_cache"
    with httpx.Client() as client:
        # Xóa bản ghi cũ nếu có (upsert logic)
        client.delete(url, headers=HEADERS, params={'question_id': f'eq.{q_id}', 'language': f'eq.{lang}', 'type': f'eq.{c_type}'})
        # Ghi mới
        payload = {'question_id': q_id, 'language': lang, 'type': c_type, 'content': content}
        client.post(url, headers=HEADERS, json=payload)

def get_cached_content(q_id: str, lang: str, c_type: str) -> Optional[str]:
    url = f"{SUPABASE_URL}/rest/v1/pmp_ai_cache"
    params = {'question_id': f'eq.{q_id}', 'language': f'eq.{lang}', 'type': f'eq.{c_type}', 'select': 'content'}
    with httpx.Client() as client:
        r = client.get(url, headers=HEADERS, params=params)
        return r.json()[0]['content'] if r.status_code == 200 and r.json() else None

# --- 4. EXECUTION ---

def main():
    parser = argparse.ArgumentParser(description='PMP AI Cache Builder Professional')
    parser.add_argument('range', help='Range câu hỏi (VD: 1-50)')
    parser.add_argument('--lang', default='vi', choices=['vi', 'en'])
    parser.add_argument('--force', action='store_true', help='Ghi đè cache cũ')
    args = parser.parse_args()

    try:
        start, end = map(int, args.range.split('-'))
    except ValueError:
        print("❌ Định dạng range sai. Ví dụ: 1-10")
        return

    print(f"\n{'='*60}")
    print(f"🚀 PMP AI BUILDER PRO: {start} -> {end} ({args.lang.upper()})")
    print(f"🤖 Model: {HF_MODEL}")
    print(f"{'='*60}\n")

    questions = fetch_questions(start, end)
    if not questions:
        print("⚠️ Không tìm thấy câu hỏi nào.")
        return

    for idx, q in enumerate(questions):
        q_id = q['id']
        correct_letter = q.get('correct_answer', 'A')
        print(f"[{idx+1}/{len(questions)}] Processing ID: {q_id} (Answer: {correct_letter})...")
        
        # Parse options: Database lưu dạng '["A...","B..."]' (string JSON)
        try:
            raw_options = q.get('options', [])
            if isinstance(raw_options, str):
                options_list = json.loads(raw_options)
            else:
                options_list = raw_options
        except Exception:
            options_list = []

        # Làm sạch options: loại bỏ prefix 'A. ' nếu có để format lại đồng nhất
        clean_options = []
        for i, opt in enumerate(options_list):
            prefix = f"{chr(65+i)}. "
            content = opt.replace(prefix, "") if opt.startswith(prefix) else opt
            clean_options.append(f"{chr(65+i)}. {content}")
        
        options_str = '\n'.join(clean_options)
        
        for c_type in ['theory', 'explanation']:
            if not args.force:
                if get_cached_content(q_id, args.lang, c_type):
                    print(f"   - {c_type.capitalize()}: Skipped (Exists)")
                    continue

            print(f"   - {c_type.capitalize()}: Generating...", end="", flush=True)
            
            if c_type == 'theory':
                prompt = get_theory_prompt(q['question'], options_str, args.lang)
            else:
                prompt = get_explanation_prompt(q['question'], options_str, correct_letter, args.lang)
            
            result = call_huggingface(prompt)
            if result:
                save_to_cache(q_id, args.lang, c_type, result)
                print(" ✅ Done.")
            else:
                print(" ❌ Failed.")
            
            time.sleep(1) # Tránh rate limit API

    print(f"\n🎉 Finished! Range {args.range} is ready.")

if __name__ == "__main__":
    main()