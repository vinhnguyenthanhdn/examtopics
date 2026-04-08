
import re

def check_answers(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    current_question = None
    suggested_answer = None
    actual_answer = None
    parsed_count = 0
    incomplete_questions = []
    discrepancies = []
    is_drag_drop = False

    for line in lines:
        line = line.strip()
        
        # Check for Question #
        question_match = re.search(r'Question #:\s*(\d+)', line)
        if question_match:
            # Check previous question status
            if current_question:
                if not suggested_answer or not actual_answer:
                    incomplete_questions.append({
                        'question': current_question,
                        'suggested': suggested_answer,
                        'actual': actual_answer,
                        'is_drag_drop': is_drag_drop
                    })
                else:
                    # Normalize answers for comparison (sort chars to handle BE vs EB)
                    s_norm = "".join(sorted(suggested_answer))
                    a_norm = "".join(sorted(actual_answer))
                    
                    if s_norm == a_norm:
                        parsed_count += 1
                    else:
                        discrepancies.append({
                            'question': current_question,
                            'suggested': suggested_answer,
                            'actual': actual_answer,
                            'is_drag_drop': is_drag_drop
                        })
            
            current_question = question_match.group(1)
            suggested_answer = None
            actual_answer = None
            is_drag_drop = False
            continue

        if "DRAG DROP" in line or "Select and Place" in line or "Match the" in line:
            is_drag_drop = True

        # Check for Suggested Answer
        # Example: Suggested Answer: BE 🗳️
        if line.startswith("Suggested Answer:"):
            # Extract one or more letters
            match = re.search(r'Suggested Answer:\s*([A-Za-z]+)', line) # Capture A-Za-z to be safe, then filter
            if match:
                raw_ans = match.group(1)
                # Keep only uppercase valid options (usually A, B, C, D, E)
                suggested_answer = "".join([c for c in raw_ans if c in 'ABCDE'])
            continue

        # Check for Answer
        # Example: **Answer: B**
        if line.startswith("**Answer:"):
            match = re.search(r'\*\*Answer:\s*([A-Za-z]+)', line)
            if match:
                raw_ans = match.group(1)
                actual_answer = "".join([c for c in raw_ans if c in 'ABCDE'])
            continue

    # Check the last question
    if current_question:
        if not suggested_answer or not actual_answer:
            incomplete_questions.append({
                'question': current_question,
                'suggested': suggested_answer,
                'actual': actual_answer,
                'is_drag_drop': is_drag_drop
            })
        else:
            s_norm = "".join(sorted(suggested_answer))
            a_norm = "".join(sorted(actual_answer))
            if s_norm == a_norm:
                parsed_count += 1
            else:
                 discrepancies.append({
                    'question': current_question,
                    'suggested': suggested_answer,
                    'actual': actual_answer,
                    'is_drag_drop': is_drag_drop
                })

    print(f"Total lines: {len(lines)}")
    print(f"Total questions with both answers matching: {parsed_count}")
    
    if incomplete_questions:
        print(f"\nFound {len(incomplete_questions)} incomplete questions (missing suggested or actual answer):")
        for item in incomplete_questions:
            type_str = " [DRAG DROP]" if item['is_drag_drop'] else ""
            print(f"Question #: {item['question']}{type_str}, Suggested: {item['suggested']}, Actual: {item['actual']}")
            
    if discrepancies:
        print(f"\nFound {len(discrepancies)} discrepancies:")
        for item in discrepancies:
            print(f"Question #: {item['question']}, Suggested: {item['suggested']}, Actual: {item['actual']}")
    else:
        print("\nNo discrepancies found.")

    return discrepancies

if __name__ == "__main__":
    file_path = '/Users/vinh/Documents/Project/pmp/PMP_Full_1400.md'
    results = check_answers(file_path)
