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

// Config for direct client-side calls (optimized for GitHub Pages)
const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY || '';
const HF_MODEL = import.meta.env.VITE_HF_MODEL || "meta-llama/Llama-3.1-70B-Instruct";
const API_URL = `https://api-inference.huggingface.co/v1/chat/completions`;

async function callHuggingFaceAPI(prompt: string): Promise<string> {
    if (!HUGGINGFACE_API_KEY) {
        throw new Error('No VITE_HUGGINGFACE_API_KEY configured');
    }

    const messages: HFMessage[] = [
        {
            role: "system",
            content: "You are a world-class Microsoft Azure AI Expert. You keep technical terms in English but explain in the requested language. You never use Chinese/Japanese characters."
        },
        {
            role: "user",
            content: prompt
        }
    ];

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: HF_MODEL,
            messages: messages,
            max_tokens: 2000,
            temperature: 0.1
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429 || response.status === 503) {
            throw new Error('AI_SERVICE_UNAVAILABLE');
        }
        throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const data: HFChatResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
        throw new Error('No response generated');
    }

    return data.choices[0].message.content;
}

async function getCachedAIContent(
    questionId: string,
    language: Language,
    type: 'explanation' | 'theory'
): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('ai900_ai_cache')
            .select('content')
            .eq('question_id', questionId)
            .eq('language', language)
            .eq('type', type)
            .maybeSingle();

        if (error) return null;
        return data?.content || null;
    } catch {
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
        await supabase.from('ai900_ai_cache').upsert({
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

    return `You are a world-class Microsoft Azure AI Expert. 
STRICT RULES:
1. **KEEP ALL AZURE TECHNICAL TERMS IN ENGLISH**. Do NOT translate terms like 'Cognitive Services', 'Machine Learning Studio', 'Anomaly Detector', 'Computer Vision', 'NLP', 'Conversational AI', 'Responsibility AI', 'Transparency', 'Inclusiveness', etc.
2. Provide detailed explanations in ${targetLang}.
3. DO NOT repeat explanations if a term appears in both the question and options.
4. Focus on the 'Why' and 'How' it's used in Azure AI workloads.
5. If you must explain a concept, start the bullet point with the **English Term**.
6. **DO NOT REVEAL THE CORRECT ANSWER**. This is a theory section only.
7. **DO NOT INCLUDE A CONCLUSION** or "The correct answer is..." statement at the end.

Question: ${question}
Options:
${options}

Format the response as follows:
## Cơ sở lý thuyết các khái niệm (Theoretical Concepts)
- **[English Term]**: [Detailed explanation in ${targetLang}]
- **[English Term]**: [Detailed explanation...]

## Các dịch vụ Azure liên quan (Related Azure Services)
- **[English Term]**: [Specific purpose and application in this context]
`;
}

function getExplanationPrompt(question: string, options: string, correctAnswer: string, language: Language): string {
    const targetLang = language === 'vi' ? "Tiếng Việt" : "English";

    let correctText = "N/A";
    const optionLines = options.split('\n');
    for (const line of optionLines) {
        if (line.startsWith(`${correctAnswer}.`)) {
            correctText = line.replace(`${correctAnswer}. `, "");
            break;
        }
    }

    return `You are an Azure AI Specialist. 
STRICT RULES:
1. The correct answer is ${correctAnswer}: "${correctText}". You MUST justify this answer.
2. **KEEP TECHNICAL TERMS IN ENGLISH**. Do not translate standard Azure terms (e.g., use "Form Recognizer", not "Trình nhận dạng biểu mẫu").
3. Provide a deep analysis of the scenario.
4. Use ${targetLang} for the narrative explanation.

Question: ${question}
Options:
${options}

Format the response as follows:
## Phân tích tình huống (Scenario Analysis)
[Analyze the project context, identify the core problem/workload type.]

## Giải thích đáp án đúng (${correctAnswer})
[Explain why "${correctText}" is the best choice based on Azure AI best practices and Microsoft standards.]

## Tại sao các đáp án khác không phù hợp
[Detailed analysis of each remaining option and why it was excluded.]

## Azure AI Mindset
[A golden rule or tip derived from this question.]
`;
}

export async function getAIExplanation(
    question: string,
    options: string,
    correctAnswer: string,
    questionId: string,
    language: Language = 'vi'
): Promise<string> {
    const cached = await getCachedAIContent(questionId, language, 'explanation');
    if (cached) return cached;

    const prompt = getExplanationPrompt(question, options, correctAnswer, language);
    const content = await callHuggingFaceAPI(prompt);

    if (content && content.trim() !== '') {
        await setCachedAIContent(questionId, language, 'explanation', content);
    }

    return content;
}

export async function getAITheory(
    question: string,
    options: string,
    questionId: string,
    language: Language = 'vi'
): Promise<string> {
    const cached = await getCachedAIContent(questionId, language, 'theory');
    if (cached) return cached;

    const prompt = getTheoryPrompt(question, options, language);
    const content = await callHuggingFaceAPI(prompt);

    if (content && content.trim() !== '') {
        await setCachedAIContent(questionId, language, 'theory', content);
    }

    return content;
}
