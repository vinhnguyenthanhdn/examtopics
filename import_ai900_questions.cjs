const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseQuestions(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const blocks = content.split('## Exam AI-900 topic');
    const questions = [];

    for (let i = 1; i < blocks.length; i++) {
        const block = blocks[i];
        try {
            const questionNumMatch = block.match(/question (\d+)/i);
            if (!questionNumMatch) continue;
            const questionId = questionNumMatch[1];

            // Enhanced extraction for HOTSPOT/DRAG DROP
            let questionText = "";
            const hotspotStart = block.indexOf('HOTSPOT -');
            const dragdropStart = block.indexOf('DRAG DROP -');
            const startIdx = (hotspotStart !== -1 && (dragdropStart === -1 || hotspotStart < dragdropStart)) ? hotspotStart : dragdropStart;

            if (startIdx !== -1) {
                // If it's a special type, take everything from that prefix until the Answer section
                const endIdx = block.search(/\n\s*(\*\*Answer:|Suggested Answer:)/);
                if (endIdx !== -1) {
                    questionText = block.substring(startIdx, endIdx).trim();
                } else {
                    questionText = block.substring(startIdx).trim();
                }
            } else {
                // Regular question extraction
                let questionTextMatch = block.match(/\[All AI-900 Questions\]\s*\n\n([\s\S]*?)\n\s*(Suggested Answer:|A\.|B\.|C\.|D\.|HOTSPOT|DRAG DROP|\*\*Answer:)/);
                if (!questionTextMatch) {
                    questionTextMatch = block.match(/\[All AI-900 Questions\]\s*\n\n([\s\S]*?)\n\s*\*\*/);
                }
                if (questionTextMatch) {
                    questionText = questionTextMatch[1].trim();
                }
            }

            if (!questionText) {
                console.warn(`⚠️ Skipping question ${questionId}: Could not extract question text`);
                continue;
            }

            // Ensure images are preserved if not already in questionText
            const imageMatch = block.match(/!\[Question Image\]\((.*?)\)/);
            if (imageMatch && !questionText.includes(imageMatch[0])) {
                questionText += `\n\n![Question Image](${imageMatch[1]})`;
            }

            const options = [];
            const lines = block.split('\n');
            for (const line of lines) {
                const match = line.trim().match(/^([A-D])\.\s+(.*)/);
                if (match) {
                    options.push(`${match[1]}. ${match[2].trim()}`);
                }
            }

            let suggestedAnswer = "";
            let answerFromSource = "";
            
            // Capture everything until the end of the line or an emoji
            const suggestedMatch = block.match(/Suggested Answer:\s*([A-Z\s,]+)/i);
            if (suggestedMatch) {
                suggestedAnswer = suggestedMatch[1].trim().replace(/[^A-Z]/gi, '').toUpperCase();
            }

            const sourceAnswerMatch = block.match(/\*\*Answer:\s*([A-Z\s,]+)\*\*/i);
            if (sourceAnswerMatch) {
                answerFromSource = sourceAnswerMatch[1].trim().replace(/[^A-Z]/gi, '').toUpperCase();
            }

            // Primary logic uses Suggested Answer
            let correctAnswer = suggestedAnswer || answerFromSource;

            if (!correctAnswer) {
                // Try one more fallback: look for ANY A-D or something after Suggested Answer
                const suggestedFallback = block.match(/Suggested Answer:\s*([A-E]+)/i);
                if (suggestedFallback) {
                    correctAnswer = suggestedFallback[1].trim().toUpperCase();
                    suggestedAnswer = correctAnswer;
                }
            }

            if (!correctAnswer) {
                const isSpecial = questionText.includes('HOTSPOT') || questionText.includes('DRAG DROP');
                if (isSpecial) {
                    correctAnswer = "HOTSPOT_REVIEW";
                } else {
                    console.warn(`⚠️ Question ${questionId}: Could not find any answer, setting to 'TBA'.`);
                    correctAnswer = "TBA";
                }
            }

            const discussionMatch = block.match(/\[View on ExamTopics\]\((https:\/\/www\.examtopics\.com\/[^\)]+)\)/);
            const discussionLink = discussionMatch ? discussionMatch[1] : null;

            questions.push({
                id: questionId,
                question: questionText,
                options: options,
                correct_answer: correctAnswer,
                suggested_answer: suggestedAnswer,
                answer_from_source: answerFromSource,
                is_multiselect: correctAnswer.length > 1,
                discussion_link: discussionLink
            });

            console.log(`✅ Parsed question ${questionId}: ${options.length} options, suggested: ${suggestedAnswer}, source: ${answerFromSource}`);
        } catch (e) {
            console.error(`❌ Error parsing block ${i}: ${e.message}`);
        }
    }
    return questions;
}

async function importToSupabase(questions) {
    const batchSize = 50;
    console.log(`\n📊 Total questions to import: ${questions.length}`);

    for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize);
        const { error } = await supabase.from('ai900_questions').upsert(batch, { onConflict: 'id' });
        
        if (error) {
            console.error(`❌ Error importing batch ${i / batchSize + 1}:`, error.message);
            // Try individual
            for (const q of batch) {
                const { error: err2 } = await supabase.from('ai900_questions').upsert(q, { onConflict: 'id' });
                if (err2) console.error(`  ❌ Failed Q${q.id}:`, err2.message);
            }
        } else {
            console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} imported`);
        }
    }
}

async function main() {
    const filePath = 'ai-900_questions.md';
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return;
    }

    const questions = parseQuestions(filePath);
    if (questions.length === 0) {
        console.error("❌ No questions parsed.");
        return;
    }

    console.log(`\n✅ Parsed ${questions.length} questions. Starting import...`);
    await importToSupabase(questions);
    console.log("\n✅ Import complete!");
}

main();
