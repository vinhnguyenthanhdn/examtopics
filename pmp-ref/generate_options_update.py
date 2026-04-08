
import re

def escape_sql_string(s):
    """Escape single quotes for SQL."""
    return s.replace("'", "''")

def generate_options_update_sql(file_path, output_sql_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by specific header to separate questions
    # Using '## Exam PMP topic' as a delimiter seems robust based on the file view
    blocks = content.split('## Exam PMP topic')
    
    updates = []
    
    for block in blocks:
        # Extract Question ID
        q_id_match = re.search(r'Question #:\s*(\d+)', block)
        if not q_id_match:
            continue
        q_id = q_id_match.group(1)

        # Extract Suggested Answer
        suggested_answer = ""
        sa_match = re.search(r'Suggested Answer:\s*([A-Za-z]+)', block)
        if sa_match:
            raw_ans = sa_match.group(1)
            suggested_answer = "".join([c for c in raw_ans if c in 'ABCDE'])
            
        # Extract Options
        # Logic: Find lines starting with A., B., C., D., E. 
        # But we need to be careful not to capture things in comments.
        # Options usually appear before "Suggested Answer" or "**Answer"
        
        # Strategy: Look for the segment between [All PMP Questions] and "Suggested Answer"
        # Options appear AFTER "Suggested Answer" and BEFORE "**Answer"
        # Extract the segment between them
        segment_match = re.search(r'Suggested Answer:.*?\n(.*?)(\*\*Answer:|$)', block, re.DOTALL)
        if not segment_match:
             # Fallback: maybe just look from Suggested Answer to end if **Answer is missing
             segment_match = re.search(r'Suggested Answer:.*?\n(.*)', block, re.DOTALL)
             if not segment_match:
                 continue
            
        segment = segment_match.group(1)
        
        options = []
        # Find all options A-F followed by a dot or bracket
        # Regex to capture "A. content" or "A) content"
        # We assume standard formatting: "A. Text..." or "A) Text..."
        # And we want to capture everything until the next option or the end of the segment
        
        # Use a simpler approach: Split by option start patterns
        # But `re.split` is tricky with capturing groups. 
        # Let's iterate.
        
        # Look for the start of the options section. It usually starts with "A. " or "A) "
        # We can find all matches of `^[A-F][.)] ` in the segment.
        
        matches = list(re.finditer(r'(?:^|\n)([A-F])\.\s+(.*?)(?=(?:\n[A-F]\.\s+)|$)', segment, re.DOTALL))
        
        # If still empty, try "A)" format or relax the dot constraint
        if not matches:
             matches = list(re.finditer(r'(?:^|\n)([A-F])\s*[.)]\s+(.*?)(?=(?:\n[A-F]\s*[.)]\s+)|$)', segment, re.DOTALL))

        # IF still empty, it might be that options are not preceded by newline if format is messy
        # Try simple line search
        if not matches:
             lines = segment.split('\n')
             for line in lines:
                 m = re.match(r'^\s*([A-F])\s*[.)]\s+(.*)', line)
                 if m:
                     letter = m.group(1)
                     text = m.group(2).strip()
                     options.append(f"{letter}. {text}")
        else:
            for match in matches:
                letter = match.group(1)
                text = match.group(2).strip()
                # Clean up newlines within the option text
                text = " ".join(text.split()) 
                options.append(f"{letter}. {text}")

        # Criteria to update:
        # 1. Multi-select answer (length > 1)
        # 2. Has option E
        # 3. User specifically asked for "all questions belonging to multichoice"
        
        is_multiselect = len(suggested_answer) > 1
        has_option_e = any(opt.startswith('E.') for opt in options)
        
        # DEBUG: why are options empty?
        if is_multiselect and not options:
            print(f"DEBUG: Q{q_id} detected as multiselect but parsed 0 options.")
            # Print segment excerpt to debug regex
            print(f"   Excerpt: {segment[:200]}...")

        # We will generate updates for ALL multiselect questions OR questions with >4 options
        if (is_multiselect or has_option_e) and options:
            updates.append((q_id, options))

    # Generate SQL
    with open(output_sql_path, 'w', encoding='utf-8') as f:
        f.write("-- SQL to update options for multichoice questions or questions with >4 options\n")
        f.write("BEGIN;\n\n")
        
        for q_id, opts in updates:
            # Construct Postgres ARRAY literal: ARRAY['opt1', 'opt2']
            # Escape each option
            escaped_opts = [f"'{escape_sql_string(opt)}'" for opt in opts]
            array_literal = f"ARRAY[{', '.join(escaped_opts)}]"
            
            f.write(f"UPDATE pmp_questions SET options = {array_literal} WHERE id = '{q_id}';\n")
            
        f.write("\nCOMMIT;\n")
    
    print(f"Generated {len(updates)} update statements in {output_sql_path}")

if __name__ == "__main__":
    input_file = '/Users/vinh/Documents/Project/pmp/PMP_Full_1400.md'
    output_file = '/Users/vinh/Documents/Project/pmp/update_multichoice_options.sql'
    generate_options_update_sql(input_file, output_file)
