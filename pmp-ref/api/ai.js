import { HfInference } from "@huggingface/inference";

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || process.env.VITE_HUGGINGFACE_API_KEY || '';
const HF_MODEL = process.env.HF_MODEL || process.env.VITE_HF_MODEL || "meta-llama/Llama-3.1-70B-Instruct";

// Initialize Hugging Face client
const hf = new HfInference(HUGGINGFACE_API_KEY);

export default async function handler(req, res) {
    // 1. CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // 2. Handle Options
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. Only POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log(`[API] Processing request for model: ${HF_MODEL}`);

        if (!HUGGINGFACE_API_KEY) {
            console.error('[API] Error: Missing HUGGINGFACE_API_KEY');
            return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
        }

        const { messages, max_tokens = 2000, temperature = 0.1 } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        console.log('[API] Calling Hugging Face Inference API via Library...');

        // Use official library to handle requests (automatic endpoint routing)
        const response = await hf.chatCompletion({
            model: HF_MODEL,
            messages: messages,
            max_tokens: max_tokens,
            temperature: temperature
        });

        console.log('[API] Success');
        return res.status(200).json(response);

    } catch (error) {
        console.error('[API] Internal Error:', error);

        // Return detailed error
        return res.status(500).json({
            error: 'AI Service Error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
