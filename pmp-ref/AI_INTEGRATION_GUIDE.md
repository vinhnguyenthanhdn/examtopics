# Hướng dẫn Tích hợp Hugging Face API trên Vercel (Production Ready)

Tài liệu này mô tả cách tích hợp Hugging Face Inference API vào ứng dụng Vercel (Next.js/Vite) một cách ổn định, tránh lỗi CORS và lỗi thay đổi Endpoint (410 Gone).

## Vấn đề thường gặp
1. **CORS Error**: Gọi trực tiếp API từ trình duyệt sẽ bị chặn.
2. **Endpoint Deprecation (410 Gone)**: Hugging Face thường xuyên thay đổi URL API (ví dụ từ `api-inference.huggingface.co` sang `router.huggingface.co`). Hardcode URL sẽ rất dễ lỗi.
3. **404 Not Found**: Cấu hình sai `vercel.json` khiến Serverless Function không chạy.

## Giải pháp chuẩn: Proxy với `@huggingface/inference`

Sử dụng Vercel Serverless Function làm Proxy và thư viện chính chủ `@huggingface/inference`.

### 1. Cài đặt thư viện
```bash
npm install @huggingface/inference
```

### 2. Cấu trúc Serverless Function (`api/ai.js`)
Tạo file `api/ai.js` (hoặc `.ts`) tại root project.

```javascript
import { HfInference } from "@huggingface/inference";

// Khởi tạo client với API Key
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export default async function handler(req, res) {
    // 1. Cấu hình CORS (Bắt buộc cho web app)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { messages, max_tokens, temperature } = req.body;
        const model = process.env.HF_MODEL || "meta-llama/Llama-3.1-70B-Instruct";

        // Sử dụng thư viện để gọi API (Tự động handle URL routing)
        const response = await hf.chatCompletion({
            model: model,
            messages: messages,
            max_tokens: max_tokens || 2000,
            temperature: temperature || 0.1
        });

        return res.status(200).json(response);
    } catch (error) {
        console.error("HF Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
```

### 3. Cấu hình Vercel (`vercel.json`)
Quan trọng: Phải loại trừ thư mục `/api` khỏi các rule rewrite của SPA (Single Page App).

```json
{
    "rewrites": [
        {
            "source": "/((?!api/.*).*)",
            "destination": "/index.html"
        }
    ]
}
```

### 4. Client-side Call (`src/lib/ai-service.ts`)
Gọi đến `/api/ai` thay vì gọi trực tiếp Hugging Face.

```typescript
async function callAI(prompt: string) {
    const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }]
        })
    });
    // ... handle response
}
```

## Environment Variables
Cần cấu hình trên Vercel Dashboard:
- `HUGGINGFACE_API_KEY`: API Key (đọc/ghi)
- `HF_MODEL`: Tên model (VD: `meta-llama/Llama-3.3-70B-Instruct`)
