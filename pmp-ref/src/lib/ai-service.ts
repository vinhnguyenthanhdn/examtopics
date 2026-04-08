import { supabase } from './supabase';
import type { Language } from '../types';

interface HFMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface HFChatResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

// Fallback configuration for direct client-side calls (e.g., local dev)
const VITE_HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY || '';
const VITE_HF_MODEL = import.meta.env.VITE_HF_MODEL || "meta-llama/Llama-3.1-70B-Instruct";
// OpenAI-compatible endpoint for Direct Fallback (use Router)
const HF_DIRECT_API_URL = "https://router.huggingface.co/hf-inference/v1/chat/completions";

async function callDirectHuggingFaceAPI(messages: HFMessage[]): Promise<string> {
    if (!VITE_HUGGINGFACE_API_KEY) {
        throw new Error('No VITE_HUGGINGFACE_API_KEY configured for direct call fallback');
    }

    console.log(`⚠️ Proxy failed or unavailable, falling back to direct Hugging Face API call...`);

    const response = await fetch(HF_DIRECT_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${VITE_HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: VITE_HF_MODEL,
            messages: messages,
            max_tokens: 2000,
            temperature: 0.1
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        // Check for rate limiting
        if (response.status === 429 || response.status === 503) {
            throw new Error('AI_SERVICE_UNAVAILABLE');
        }
        throw new Error(`Direct API error: ${response.status} - ${errorText}`);
    }

    const data: HFChatResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
        throw new Error('No response generated (Direct)');
    }

    return data.choices[0].message.content;
}

async function callHuggingFaceAPI(prompt: string): Promise<string> {
    const messages: HFMessage[] = [
        {
            role: "system",
            content: "You are a professional PMP tutor. You keep technical terms in English but explain in the requested language. You never use Chinese/Japanese characters."
        },
        {
            role: "user",
            content: prompt
        }
    ];

    try {
        console.log(`🤖 Calling Hugging Face API via proxy...`);

        // Use proxy API endpoint (works in both dev and production)
        const apiUrl = '/api/ai';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messages,
                max_tokens: 2000,
                temperature: 0.1
            })
        });

        // If Proxy returns 404 (Not Found - e.g. local vite) or 500 (Server Error - e.g. missing env vars on Vercel)
        if (response.status === 404 || response.status === 500) {
            console.warn(`Proxy returned ${response.status}, attempting fallback...`);
            return await callDirectHuggingFaceAPI(messages);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error(`❌ Proxy API error (${response.status}):`, errorData);

            // Check for rate limiting or service unavailable
            if (response.status === 503 || errorData.error === 'AI_SERVICE_UNAVAILABLE') {
                throw new Error('AI_SERVICE_UNAVAILABLE');
            }

            throw new Error(`Proxy API error: ${response.status} - ${errorData.error || 'Unknown'}`);
        }

        const data: HFChatResponse = await response.json();

        if (!data.choices || data.choices.length === 0) {
            console.error('❌ No choices in API response');
            throw new Error('No response generated');
        }

        const text = data.choices[0].message.content;

        if (!text || text.trim() === '') {
            console.error('❌ Empty response from API');
            throw new Error('Empty response generated');
        }

        console.log('✅ Hugging Face API call successful (Proxy)');
        return text;

    } catch (error: any) {
        const errorMsg = error?.message || String(error);
        console.error('❌ Hugging Face Proxy call failed:', errorMsg);

        // Don't retry if it was specifically AI Service Unavailable (quota/overload)
        if (errorMsg.includes('AI_SERVICE_UNAVAILABLE')) {
            throw new Error('AI_SERVICE_UNAVAILABLE');
        }

        // Try fallback for network errors or other proxy failures
        console.log('🔄 Attempting fallback to direct API call...');
        try {
            const fallbackText = await callDirectHuggingFaceAPI(messages);
            console.log('✅ Hugging Face API call successful (Fallback)');
            return fallbackText;
        } catch (fallbackError: any) {
            console.error('❌ Fallback also failed:', fallbackError);
            if (fallbackError?.message?.includes('AI_SERVICE_UNAVAILABLE')) {
                throw new Error('AI_SERVICE_UNAVAILABLE');
            }
            throw error; // Throw original proxy error or fallback error
        }
    }
}

async function getCachedAIContent(
    questionId: string,
    language: Language,
    type: 'explanation' | 'theory'
): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('pmp_ai_cache')
            .select('content')
            .eq('question_id', questionId)
            .eq('language', language)
            .eq('type', type)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error(`❌ Database error fetching cache for Q${questionId} (${type}, ${language}):`, {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            return null;
        }

        if (!data) {
            console.log(`📭 No cache found in DB for Q${questionId} (${type}, ${language})`);
            return null;
        }

        // Validate content is not empty or error message
        if (!data.content || data.content.trim() === '' || data.content === 'No response generated') {
            console.warn(`⚠️ Invalid cache content for Q${questionId} (${type}, ${language}), will regenerate`);
            return null;
        }

        return data.content;
    } catch (err) {
        console.error(`❌ Exception in getCachedAIContent:`, err);
        return null;
    }
}

async function setCachedAIContent(
    questionId: string,
    language: Language,
    type: 'explanation' | 'theory',
    content: string
): Promise<void> {
    try {
        await supabase.from('pmp_ai_cache').upsert({
            question_id: questionId,
            language,
            type,
            content,
        });
    } catch (error) {
        console.error('Error caching AI content:', error);
    }
}

function getTheoryPrompt(question: string, options: string, language: Language): string {
    const targetLang = language === 'vi' ? "Tiếng Việt" : "English";

    return `You are a world-class PMP Instructor. 
STRICT RULES:
1. **KEEP ALL PMP TECHNICAL TERMS IN ENGLISH**. Do NOT translate terms like 'Product Backlog', 'Sprint Review', 'Stakeholder Register', 'Critical Path', 'Servant Leadership', 'Retrospective', 'Team Charter', 'Iteration', 'Daily Standup', etc.
   - RIGHT: **Sprint Review**: Buổi họp cuối sprint để demo sản phẩm...
   - WRONG: **Đánh giá nước rút**: Buổi họp...
2. Provide detailed explanations in ${targetLang}.
3. DO NOT repeat explanations if a term appears in both the question and options.
4. Focus on the 'Why' and 'How' it's used in project management.
5. If you must explain a concept, start the bullet point with the **English Term**.
6. **DO NOT REVEAL THE CORRECT ANSWER**. This is a theory section only.
7. **DO NOT INCLUDE A CONCLUSION** or "The correct answer is..." statement at the end.

Question: ${question}
Options:
${options}

Format the response as follows:
## Cơ sở lý thuyết các khái niệm
- **[English Term]**: [Detailed explanation in ${targetLang}]
- **[English Term]**: [Detailed explanation...]

## Các công cụ và kỹ thuật (Tools & Techniques)
- **[English Term]**: [Specific purpose and application in this context]
`;
}

function getExplanationPrompt(question: string, options: string, correctAnswer: string, language: Language): string {
    const targetLang = language === 'vi' ? "Tiếng Việt" : "English";

    // Extract the text of the correct answer
    let correctText = "N/A";
    const optionLines = options.split('\n');
    for (const line of optionLines) {
        if (line.startsWith(`${correctAnswer}.`)) {
            correctText = line.replace(`${correctAnswer}. `, "");
            break;
        }
    }

    return `You are a PMP Mentor. 
STRICT RULES:
1. The correct answer is ${correctAnswer}: "${correctText}". You MUST justify this answer.
2. **KEEP TECHNICAL TERMS IN ENGLISH**. Do not translate standard PMP terms (e.g., use "Project Charter", not "Hiến chương dự án"; use "Stakeholder Engagement", not "Sự tham gia của các bên liên quan").
3. Provide a deep analysis of the situation (Lifecycle: Agile/Predictive/Hybrid).
4. Use ${targetLang} for the narrative explanation.

Question: ${question}
Options:
${options}

Format the response as follows:
## Phân tích tình huống
[Phân tích ngữ cảnh dự án, xác định vấn đề cốt lõi và giai đoạn của dự án.]

## Giải thích đáp án đúng (${correctAnswer})
[Giải thích tại sao "${correctText}" là lựa chọn tốt nhất dựa trên PM Mindset và tiêu chuẩn PMI.]

## Tại sao các đáp án khác không phù hợp
[Phân tích chi tiết từng phương án còn lại và lý do loại trừ chúng.]

## PMP Mindset
[Một quy tắc vàng hoặc mẹo rút ra từ câu hỏi này.]
`;
}

export async function getAIExplanation(
    question: string,
    options: string,
    correctAnswer: string,
    questionId: string,
    language: Language = 'vi'
): Promise<string> {
    // Check cache first
    const cached = await getCachedAIContent(questionId, language, 'explanation');
    if (cached) {
        console.log(`✅ Cache HIT for explanation: Q${questionId} (${language})`);
        return cached;
    }
    console.log(`🔄 Cache MISS - Calling Hugging Face API for explanation: Q${questionId} (${language})`);

    const prompt = getExplanationPrompt(question, options, correctAnswer, language);
    const content = await callHuggingFaceAPI(prompt);

    // Only cache if content is valid
    if (content && content.trim() !== '' && content !== 'No response generated') {
        await setCachedAIContent(questionId, language, 'explanation', content);
    } else {
        console.warn(`⚠️ Not caching invalid explanation for Q${questionId}`);
    }

    return content;
}

export async function getAITheory(
    question: string,
    options: string,
    questionId: string,
    language: Language = 'vi'
): Promise<string> {
    // Check cache first
    const cached = await getCachedAIContent(questionId, language, 'theory');
    if (cached) {
        console.log(`✅ Cache HIT for theory: Q${questionId} (${language})`);
        return cached;
    }
    console.log(`🔄 Cache MISS - Calling Hugging Face API for theory: Q${questionId} (${language})`);

    const prompt = getTheoryPrompt(question, options, language);
    const content = await callHuggingFaceAPI(prompt);

    // Only cache if content is valid
    if (content && content.trim() !== '' && content !== 'No response generated') {
        await setCachedAIContent(questionId, language, 'theory', content);
    } else {
        console.warn(`⚠️ Not caching invalid theory for Q${questionId}`);
    }

    return content;
}
